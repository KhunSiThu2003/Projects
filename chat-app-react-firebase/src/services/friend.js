import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp,
  runTransaction 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { toast } from "react-hot-toast";

/**
 * Send a friend request from one user to another
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    // Validate inputs
    if (!fromUserId || !toUserId) {
      throw new Error('User IDs are required');
    }

    if (fromUserId === toUserId) {
      toast.error('You cannot send a friend request to yourself');
      return { success: false, error: 'Cannot send request to yourself' };
    }

    await runTransaction(db, async (transaction) => {
      // Get both users' documents
      const fromUserRef = doc(db, "users", fromUserId);
      const toUserRef = doc(db, "users", toUserId);
      
      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);

      // Check if users exist
      if (!fromUserDoc.exists()) {
        throw new Error("Sender user not found");
      }
      if (!toUserDoc.exists()) {
        throw new Error("Receiver user not found");
      }

      const fromUserData = fromUserDoc.data();
      const toUserData = toUserDoc.data();

      // Check if already friends
      if (fromUserData.friends?.includes(toUserId) || toUserData.friends?.includes(fromUserId)) {
        throw new Error('You are already friends with this user');
      }

      // Check if request already sent
      if (fromUserData.sentRequests?.includes(toUserId)) {
        throw new Error('Friend request already sent');
      }

      // Check if you have a pending request from this user
      if (fromUserData.receivedRequests?.includes(toUserId)) {
        throw new Error('This user has already sent you a friend request');
      }

      // Check if user is blocked
      if (fromUserData.blocked?.includes(toUserId) || toUserData.blocked?.includes(fromUserId)) {
        throw new Error('Cannot send friend request to blocked user');
      }

      // Update sender's sentRequests
      transaction.update(fromUserRef, {
        sentRequests: arrayUnion(toUserId),
        updatedAt: serverTimestamp()
      });

      // Update receiver's receivedRequests
      transaction.update(toUserRef, {
        receivedRequests: arrayUnion(fromUserId),
        updatedAt: serverTimestamp()
      });
    });

    toast.success('Friend request sent successfully');
    return { success: true };

  } catch (error) {
    console.error('Error sending friend request:', error);
    
    // Show user-friendly error messages
    if (error.message.includes('already friends')) {
      toast.error('You are already friends with this user');
    } else if (error.message.includes('request already sent')) {
      toast.error('Friend request already sent');
    } else if (error.message.includes('already sent you')) {
      toast.error('This user has already sent you a friend request');
    } else if (error.message.includes('blocked')) {
      toast.error('Cannot send friend request');
    } else {
      toast.error('Failed to send friend request');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      throw new Error('User ID and Friend ID are required');
    }

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const friendRef = doc(db, "users", friendId);
      
      const userDoc = await transaction.get(userRef);
      const friendDoc = await transaction.get(friendRef);

      if (!userDoc.exists() || !friendDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const friendData = friendDoc.data();

      // Check if request exists
      if (!userData.receivedRequests?.includes(friendId)) {
        throw new Error('No friend request found from this user');
      }

      // Check if already friends
      if (userData.friends?.includes(friendId)) {
        throw new Error('You are already friends with this user');
      }

      // Remove from receivedRequests (current user) and sentRequests (friend)
      transaction.update(userRef, {
        receivedRequests: arrayRemove(friendId),
        friends: arrayUnion(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        sentRequests: arrayRemove(userId),
        friends: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
    });

    toast.success('Friend request accepted');
    return { success: true };

  } catch (error) {
    console.error('Error accepting friend request:', error);
    
    if (error.message.includes('No friend request found')) {
      toast.error('No pending friend request from this user');
    } else if (error.message.includes('already friends')) {
      toast.error('You are already friends with this user');
    } else {
      toast.error('Failed to accept friend request');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      throw new Error('User ID and Friend ID are required');
    }

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const friendRef = doc(db, "users", friendId);
      
      const userDoc = await transaction.get(userRef);
      const friendDoc = await transaction.get(friendRef);

      if (!userDoc.exists() || !friendDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();

      // Check if request exists
      if (!userData.receivedRequests?.includes(friendId)) {
        throw new Error('No friend request found from this user');
      }

      // Remove from receivedRequests (current user) and sentRequests (friend)
      transaction.update(userRef, {
        receivedRequests: arrayRemove(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        sentRequests: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    });

    toast.success('Friend request rejected');
    return { success: true };

  } catch (error) {
    console.error('Error rejecting friend request:', error);
    
    if (error.message.includes('No friend request found')) {
      toast.error('No pending friend request from this user');
    } else {
      toast.error('Failed to reject friend request');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      throw new Error('User ID and Friend ID are required');
    }

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const friendRef = doc(db, "users", friendId);
      
      const userDoc = await transaction.get(userRef);
      const friendDoc = await transaction.get(friendRef);

      if (!userDoc.exists() || !friendDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();

      // Check if request was actually sent
      if (!userData.sentRequests?.includes(friendId)) {
        throw new Error('No sent friend request found for this user');
      }

      // Remove from sentRequests (current user) and receivedRequests (friend)
      transaction.update(userRef, {
        sentRequests: arrayRemove(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        receivedRequests: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    });

    toast.success('Friend request cancelled');
    return { success: true };

  } catch (error) {
    console.error('Error cancelling friend request:', error);
    
    if (error.message.includes('No sent friend request')) {
      toast.error('No sent friend request found for this user');
    } else {
      toast.error('Failed to cancel friend request');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      throw new Error('User ID and Friend ID are required');
    }

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const friendRef = doc(db, "users", friendId);
      
      const userDoc = await transaction.get(userRef);
      const friendDoc = await transaction.get(friendRef);

      if (!userDoc.exists() || !friendDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const friendData = friendDoc.data();

      // Check if they are actually friends
      if (!userData.friends?.includes(friendId) || !friendData.friends?.includes(userId)) {
        throw new Error('You are not friends with this user');
      }

      // Remove from friends list for both users
      transaction.update(userRef, {
        friends: arrayRemove(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        friends: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    });

    toast.success('Friend removed successfully');
    return { success: true };

  } catch (error) {
    console.error('Error removing friend:', error);
    
    if (error.message.includes('not friends')) {
      toast.error('You are not friends with this user');
    } else {
      toast.error('Failed to remove friend');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Block a user
 */
export const blockUser = async (userId, blockUserId) => {
  try {
    if (!userId || !blockUserId) {
      throw new Error('User ID and Block User ID are required');
    }

    if (userId === blockUserId) {
      toast.error('You cannot block yourself');
      return { success: false, error: 'Cannot block yourself' };
    }

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const blockUserRef = doc(db, "users", blockUserId);
      
      const userDoc = await transaction.get(userRef);
      const blockUserDoc = await transaction.get(blockUserRef);

      if (!userDoc.exists() || !blockUserDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();

      // Check if already blocked
      if (userData.blocked?.includes(blockUserId)) {
        throw new Error('User is already blocked');
      }

      // Remove from friends if they are friends
      const updates = {
        blocked: arrayUnion(blockUserId),
        updatedAt: serverTimestamp()
      };

      // Remove from friends list if they are friends
      if (userData.friends?.includes(blockUserId)) {
        updates.friends = arrayRemove(blockUserId);
      }

      // Remove from sent/received requests
      if (userData.sentRequests?.includes(blockUserId)) {
        updates.sentRequests = arrayRemove(blockUserId);
      }

      if (userData.receivedRequests?.includes(blockUserId)) {
        updates.receivedRequests = arrayRemove(blockUserId);
      }

      transaction.update(userRef, updates);
    });

    toast.success('User blocked successfully');
    return { success: true };

  } catch (error) {
    console.error('Error blocking user:', error);
    
    if (error.message.includes('already blocked')) {
      toast.error('User is already blocked');
    } else {
      toast.error('Failed to block user');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId, blockUserId) => {
  try {
    if (!userId || !blockUserId) {
      throw new Error('User ID and Block User ID are required');
    }

    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      blocked: arrayRemove(blockUserId),
      updatedAt: serverTimestamp()
    });

    toast.success('User unblocked successfully');
    return { success: true };

  } catch (error) {
    console.error('Error unblocking user:', error);
    toast.error('Failed to unblock user');
    return { success: false, error: error.message };
  }
};

/**
 * Get user's friends list with details
 */
export const getFriendsList = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const friends = userData.friends || [];

    // Get detailed information for each friend
    const friendsPromises = friends.map(async (friendId) => {
      const friendRef = doc(db, "users", friendId);
      const friendDoc = await getDoc(friendRef);
      
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        return {
          uid: friendId,
          email: friendData.email,
          fullName: friendData.fullName,
          profilePic: friendData.profilePic,
          bio: friendData.bio,
          status: friendData.status,
          lastSeen: friendData.lastSeen
        };
      }
      return null;
    });

    const friendsList = await Promise.all(friendsPromises);
    return { success: true, friends: friendsList.filter(friend => friend !== null) };

  } catch (error) {
    console.error('Error getting friends list:', error);
    return { success: false, error: error.message, friends: [] };
  }
};

/**
 * Get pending friend requests (sent and received)
 */
export const getPendingRequests = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const sentRequests = userData.sentRequests || [];
    const receivedRequests = userData.receivedRequests || [];

    // Get details for sent requests
    const sentPromises = sentRequests.map(async (requestId) => {
      const userRef = doc(db, "users", requestId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: requestId,
          email: userData.email,
          fullName: userData.fullName,
          profilePic: userData.profilePic,
          status: userData.status,
          lastSeen: userData.lastSeen
        };
      }
      return null;
    });

    // Get details for received requests
    const receivedPromises = receivedRequests.map(async (requestId) => {
      const userRef = doc(db, "users", requestId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: requestId,
          email: userData.email,
          fullName: userData.fullName,
          profilePic: userData.profilePic,
          status: userData.status,
          lastSeen: userData.lastSeen
        };
      }
      return null;
    });

    const [sent, received] = await Promise.all([
      Promise.all(sentPromises),
      Promise.all(receivedPromises)
    ]);

    return {
      success: true,
      sent: sent.filter(request => request !== null),
      received: received.filter(request => request !== null)
    };

  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { 
      success: false, 
      error: error.message, 
      sent: [], 
      received: [] 
    };
  }
};

/**
 * Check friendship status between two users
 */
// In friend.js - Add detailed logging to checkFriendshipStatus
export const checkFriendshipStatus = async (userId, otherUserId) => {
  try {
    console.log('🔍 Checking friendship between:', userId, 'and', otherUserId);
    
    if (!userId || !otherUserId) {
      throw new Error('Both user IDs are required');
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    
    console.log('📊 User data:', {
      friends: userData.friends,
      sentRequests: userData.sentRequests,
      receivedRequests: userData.receivedRequests,
      blocked: userData.blocked
    });
    
    const status = {
      isFriend: userData.friends?.includes(otherUserId) || false,
      requestSent: userData.sentRequests?.includes(otherUserId) || false,
      requestReceived: userData.receivedRequests?.includes(otherUserId) || false,
      isBlocked: userData.blocked?.includes(otherUserId) || false
    };

    console.log('✅ Friendship status result:', status);
    return { success: true, status };

  } catch (error) {
    console.error('❌ Error checking friendship status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or get existing chat room between two users
 */
export const getOrCreateChatRoom = async (currentUserId, otherUserId) => {
  try {
    if (!currentUserId || !otherUserId) {
      throw new Error('User IDs are required');
    }

    if (currentUserId === otherUserId) {
      throw new Error('Cannot create chat with yourself');
    }

    // Generate consistent chat ID for the two users
    const chatId = [currentUserId, otherUserId].sort().join('_');

    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      // Create new chat room
      await setDoc(chatRef, {
        id: chatId,
        participants: [currentUserId, otherUserId],
        participantsData: {
          [currentUserId]: true,
          [otherUserId]: true
        },
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isGroup: false,
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0
        }
      });
    }

    return { success: true, chatId };

  } catch (error) {
    console.error('Error creating chat room:', error);
    return { success: false, error: error.message };
  }
};

export const getBlockedUsers = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("User not found");
        }

        const userData = userDoc.data();
        const blockedUsers = userData.blocked || [];

        // Get detailed information for each blocked user
        const blockedPromises = blockedUsers.map(async (blockedUserId) => {
            const blockedUserRef = doc(db, "users", blockedUserId);
            const blockedUserDoc = await getDoc(blockedUserRef);
            
            if (blockedUserDoc.exists()) {
                const blockedUserData = blockedUserDoc.data();
                return {
                    uid: blockedUserId,
                    email: blockedUserData.email,
                    fullName: blockedUserData.fullName,
                    profilePic: blockedUserData.profilePic,
                    status: blockedUserData.status,
                    lastSeen: blockedUserData.lastSeen,
                };
            }
            return null;
        });

        const blockedUsersList = await Promise.all(blockedPromises);
        return { 
            success: true, 
            users: blockedUsersList.filter(user => user !== null) 
        };

    } catch (error) {
        console.error('Error getting blocked users:', error);
        return { 
            success: false, 
            error: error.message, 
            users: [] 
        };
    }
};