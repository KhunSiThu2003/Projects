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

export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    if (!fromUserId || !toUserId) {
      throw new Error('User IDs are required');
    }

    if (fromUserId === toUserId) {
      return { success: false, error: 'Cannot send request to yourself' };
    }

    await runTransaction(db, async (transaction) => {
      const fromUserRef = doc(db, "users", fromUserId);
      const toUserRef = doc(db, "users", toUserId);
      
      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);

      if (!fromUserDoc.exists()) {
        throw new Error("Sender user not found");
      }
      if (!toUserDoc.exists()) {
        throw new Error("Receiver user not found");
      }

      const fromUserData = fromUserDoc.data();
      const toUserData = toUserDoc.data();

      if (fromUserData.friends?.includes(toUserId) || toUserData.friends?.includes(fromUserId)) {
        throw new Error('You are already friends with this user');
      }

      if (fromUserData.sentRequests?.includes(toUserId)) {
        throw new Error('Friend request already sent');
      }

      if (fromUserData.receivedRequests?.includes(toUserId)) {
        throw new Error('This user has already sent you a friend request');
      }

      if (fromUserData.blocked?.includes(toUserId) || toUserData.blocked?.includes(fromUserId)) {
        throw new Error('Cannot send friend request to blocked user');
      }

      transaction.update(fromUserRef, {
        sentRequests: arrayUnion(toUserId),
        updatedAt: serverTimestamp()
      });

      transaction.update(toUserRef, {
        receivedRequests: arrayUnion(fromUserId),
        updatedAt: serverTimestamp()
      });
    });

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

      if (!userData.receivedRequests?.includes(friendId)) {
        throw new Error('No friend request found from this user');
      }

      if (userData.friends?.includes(friendId)) {
        throw new Error('You are already friends with this user');
      }

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

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

      if (!userData.receivedRequests?.includes(friendId)) {
        throw new Error('No friend request found from this user');
      }

      transaction.update(userRef, {
        receivedRequests: arrayRemove(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        sentRequests: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    });

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

      if (!userData.sentRequests?.includes(friendId)) {
        throw new Error('No sent friend request found for this user');
      }

      transaction.update(userRef, {
        sentRequests: arrayRemove(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        receivedRequests: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    });

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

      if (!userData.friends?.includes(friendId) || !friendData.friends?.includes(userId)) {
        throw new Error('You are not friends with this user');
      }

      transaction.update(userRef, {
        friends: arrayRemove(friendId),
        updatedAt: serverTimestamp()
      });

      transaction.update(friendRef, {
        friends: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    });

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const blockUser = async (userId, blockUserId) => {
  try {
    if (!userId || !blockUserId) {
      throw new Error('User ID and Block User ID are required');
    }

    if (userId === blockUserId) {
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
      const blockUserData = blockUserDoc.data();

      if (userData.blocked?.includes(blockUserId)) {
        throw new Error('User is already blocked');
      }

      const userUpdates = {
        blocked: arrayUnion(blockUserId),
        updatedAt: serverTimestamp()
      };

      const blockUserUpdates = {
        updatedAt: serverTimestamp()
      };

      if (userData.friends?.includes(blockUserId)) {
        userUpdates.friends = arrayRemove(blockUserId);
      }
      if (blockUserData.friends?.includes(userId)) {
        blockUserUpdates.friends = arrayRemove(userId);
      }

      if (userData.sentRequests?.includes(blockUserId)) {
        userUpdates.sentRequests = arrayRemove(blockUserId);
      }
      if (blockUserData.receivedRequests?.includes(userId)) {
        blockUserUpdates.receivedRequests = arrayRemove(userId);
      }

      if (userData.receivedRequests?.includes(blockUserId)) {
        userUpdates.receivedRequests = arrayRemove(blockUserId);
      }
      if (blockUserData.sentRequests?.includes(userId)) {
        blockUserUpdates.sentRequests = arrayRemove(userId);
      }

      transaction.update(userRef, userUpdates);
      transaction.update(blockUserRef, blockUserUpdates);
    });

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

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
    return { success: false, error: error.message, friends: [] };
  }
};

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
    return { 
      success: false, 
      error: error.message, 
      sent: [], 
      received: [] 
    };
  }
};

export const checkFriendshipStatus = async (userId, otherUserId) => {
  try {
    if (!userId || !otherUserId) {
      throw new Error('Both user IDs are required');
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    
    const status = {
      isFriend: userData.friends?.includes(otherUserId) || false,
      requestSent: userData.sentRequests?.includes(otherUserId) || false,
      requestReceived: userData.receivedRequests?.includes(otherUserId) || false,
      isBlocked: userData.blocked?.includes(otherUserId) || false
    };

    return { success: true, status };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getOrCreateChatRoom = async (currentUserId, otherUserId) => {
  try {
    if (!currentUserId || !otherUserId) {
      throw new Error('User IDs are required');
    }

    if (currentUserId === otherUserId) {
      throw new Error('Cannot create chat with yourself');
    }

    const chatId = [currentUserId, otherUserId].sort().join('_');

    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
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
        return { 
            success: false, 
            error: error.message, 
            users: [] 
        };
    }
};