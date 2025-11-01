import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  doc
} from "firebase/firestore";
import { db } from "../firebase/config";

// =============================================
// CHAT SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to user's chats with real-time updates
 * Uses participantsArray field with array-contains for better indexing
 */
export const subscribeToChats = (userId, onChatsUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const chatsRef = collection(db, "chats");
    
    // Primary query with array-contains and ordering
    const q = query(
      chatsRef, 
      where("participantsArray", "array-contains", userId),
      orderBy("lastUpdated", "desc")
    );

    let isActive = true;

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!isActive) return;

        const chats = [];
        snapshot.forEach(doc => {
          const chatData = doc.data();
          chats.push({
            id: doc.id,
            ...chatData
          });
        });

        onChatsUpdate(chats);
      }, 
      (error) => {
        if (!isActive) return;
        console.error('Error in chat list subscription:', error);
        
        // If index error, try fallback without orderBy
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.log('🔄 Trying chat subscription without orderBy...');
          const fallbackUnsubscribe = subscribeToChatsWithoutOrderBy(userId, onChatsUpdate, onError);
          return () => {
            isActive = false;
            fallbackUnsubscribe();
          };
        } else {
          if (onError) onError(error);
          onChatsUpdate([]);
        }
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };

  } catch (error) {
    console.error('Error setting up chat subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

// Add to realtimeSubscriptions.js

/**
 * Subscribe to messages for a specific chat
 */
export const subscribeToChatMessages = (chatId, onMessagesUpdate, onError) => {
  try {
    if (!chatId) {
      const error = new Error('Chat ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    let isActive = true;

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!isActive) return;

        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        onMessagesUpdate(messages);
      }, 
      (error) => {
        if (!isActive) return;
        console.error('Error in messages subscription:', error);
        if (onError) onError(error);
        onMessagesUpdate([]);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };

  } catch (error) {
    console.error('Error setting up messages subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Subscribe to messages for all user's chats
 */
export const subscribeToAllChatMessages = (userId, onMessagesUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    // First get user's chats, then subscribe to each chat's messages
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("participantsArray", "array-contains", userId)
    );

    let isActive = true;
    let chatUnsubscribers = new Map();

    const unsubscribeChats = onSnapshot(q, 
      (snapshot) => {
        if (!isActive) return;

        const userChats = [];
        snapshot.forEach(doc => {
          const chatData = doc.data();
          userChats.push({
            id: doc.id,
            ...chatData
          });
        });

        // Clean up subscriptions for chats that are no longer in the list
        const currentChatIds = userChats.map(chat => chat.id);
        chatUnsubscribers.forEach((unsub, chatId) => {
          if (!currentChatIds.includes(chatId)) {
            unsub();
            chatUnsubscribers.delete(chatId);
          }
        });

        // Subscribe to messages for each chat
        userChats.forEach(chat => {
          if (!chatUnsubscribers.has(chat.id)) {
            const unsubscribeMessages = subscribeToChatMessages(
              chat.id, 
              (messages) => {
                if (!isActive) return;
                onMessagesUpdate(chat.id, messages);
              },
              (error) => {
                if (!isActive) return;
                console.error(`Error in messages for chat ${chat.id}:`, error);
              }
            );
            
            chatUnsubscribers.set(chat.id, unsubscribeMessages);
          }
        });
      }, 
      (error) => {
        if (!isActive) return;
        console.error('Error in all chats subscription:', error);
        if (onError) onError(error);
      }
    );

    return () => {
      isActive = false;
      unsubscribeChats();
      chatUnsubscribers.forEach(unsub => unsub());
      chatUnsubscribers.clear();
    };

  } catch (error) {
    console.error('Error setting up all messages subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Fallback chat subscription without orderBy (no index required)
 */
export const subscribeToChatsWithoutOrderBy = (userId, onChatsUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const chatsRef = collection(db, "chats");
    
    const q = query(
      chatsRef, 
      where("participantsArray", "array-contains", userId)
      // No orderBy to avoid index requirements
    );

    let isActive = true;

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!isActive) return;

        const chats = [];
        snapshot.forEach(doc => {
          const chatData = doc.data();
          chats.push({
            id: doc.id,
            ...chatData
          });
        });

        // Client-side sorting
        chats.sort((a, b) => {
          const timeA = a.lastUpdated?.toDate?.() || a.lastMessageAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.lastUpdated?.toDate?.() || b.lastMessageAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return timeB - timeA; // Newest first
        });

        onChatsUpdate(chats);
      }, 
      (error) => {
        if (!isActive) return;
        console.error('Error in fallback chat subscription:', error);
        
        // Ultimate fallback - get all chats and filter manually
        if (error.code === 'failed-precondition') {
          console.log('🔄 Trying ultimate fallback...');
          const ultimateUnsubscribe = subscribeToAllChatsManualFilter(userId, onChatsUpdate, onError);
          return () => {
            isActive = false;
            ultimateUnsubscribe();
          };
        } else {
          if (onError) onError(error);
          onChatsUpdate([]);
        }
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };

  } catch (error) {
    console.error('Error setting up fallback chat subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Ultimate fallback - subscribe to all chats and filter manually
 */
export const subscribeToAllChatsManualFilter = (userId, onChatsUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const chatsRef = collection(db, "chats");
    let isActive = true;

    const unsubscribe = onSnapshot(chatsRef, 
      (snapshot) => {
        if (!isActive) return;

        const allChats = [];
        snapshot.forEach(doc => {
          const chatData = doc.data();
          allChats.push({
            id: doc.id,
            ...chatData
          });
        });

        // Manual filtering
        const userChats = allChats.filter(chat => {
          // Try participantsArray first, then participants as fallback
          if (chat.participantsArray && chat.participantsArray.includes(userId)) {
            return true;
          }
          if (chat.participants && chat.participants.includes(userId)) {
            return true;
          }
          return false;
        });

        // Manual sorting
        userChats.sort((a, b) => {
          const timeA = a.lastUpdated?.toDate?.() || a.lastMessageAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.lastUpdated?.toDate?.() || b.lastMessageAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return timeB - timeA;
        });

        onChatsUpdate(userChats);
      }, 
      (error) => {
        if (!isActive) return;
        console.error('Error in ultimate fallback chat subscription:', error);
        if (onError) onError(error);
        onChatsUpdate([]);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };

  } catch (error) {
    console.error('Error setting up ultimate fallback chat subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

// =============================================
// FRIENDS SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to friends list with real-time updates
 */
export const subscribeToFriends = (userId, onFriendsUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const userRef = doc(db, "users", userId);
    let unsubscribers = [];
    let isActive = true;
    
    const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
      if (!isActive) return;
      
      if (!userDoc.exists()) {
        const error = new Error("User not found");
        console.error(error.message);
        if (onError) onError(error);
        onFriendsUpdate([]);
        return;
      }

      const userData = userDoc.data();
      const friendIds = userData.friends || [];

      // Clean up previous subscriptions
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      if (friendIds.length === 0) {
        onFriendsUpdate([]);
        return;
      }

      const friendsData = [];

      // Subscribe to each friend's profile
      friendIds.forEach(friendId => {
        const friendRef = doc(db, "users", friendId);
        
        const unsubscribeFriend = onSnapshot(friendRef, (friendDoc) => {
          if (!isActive) return;
          
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            const friendInfo = {
              uid: friendId,
              email: friendData.email,
              fullName: friendData.fullName,
              profilePic: friendData.profilePic,
              bio: friendData.bio,
              status: friendData.status,
              lastSeen: friendData.lastSeen
            };

            // Update friend in array
            const existingIndex = friendsData.findIndex(f => f.uid === friendId);
            if (existingIndex >= 0) {
              friendsData[existingIndex] = friendInfo;
            } else {
              friendsData.push(friendInfo);
            }

            // Sort and update
            onFriendsUpdate([...friendsData].sort((a, b) => 
              (a.fullName || '').localeCompare(b.fullName || '')
            ));
          }
        }, (error) => {
          if (!isActive) return;
          console.error(`Error listening to friend ${friendId}:`, error);
        });

        unsubscribers.push(unsubscribeFriend);
      });
    }, (error) => {
      if (!isActive) return;
      console.error('Error in friends list subscription:', error);
      if (onError) onError(error);
      onFriendsUpdate([]);
    });

    return () => {
      isActive = false;
      unsubscribeUser();
      unsubscribers.forEach(unsub => unsub());
    };

  } catch (error) {
    console.error('Error setting up friends subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

// =============================================
// FRIEND REQUESTS SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to friend requests (both sent and received)
 */
export const subscribeToFriendRequests = (userId, onRequestsUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const userRef = doc(db, "users", userId);
    let isActive = true;
    let unsubscribers = [];

    const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
      if (!isActive) return;

      if (!userDoc.exists()) {
        const error = new Error("User not found");
        if (onError) onError(error);
        onRequestsUpdate({ sent: [], received: [] });
        return;
      }

      const userData = userDoc.data();
      const sentRequests = userData.sentRequests || [];
      const receivedRequests = userData.receivedRequests || [];

      // Clean up previous subscriptions
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      const requestsData = {
        sent: [],
        received: []
      };

      // Subscribe to sent requests
      sentRequests.forEach(requestId => {
        const requestRef = doc(db, "users", requestId);
        const unsubscribeRequest = onSnapshot(requestRef, (requestDoc) => {
          if (!isActive) return;

          if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            const requestInfo = {
              uid: requestId,
              email: requestData.email,
              fullName: requestData.fullName,
              profilePic: requestData.profilePic,
              status: requestData.status,
              lastSeen: requestData.lastSeen
            };

            const existingIndex = requestsData.sent.findIndex(r => r.uid === requestId);
            if (existingIndex >= 0) {
              requestsData.sent[existingIndex] = requestInfo;
            } else {
              requestsData.sent.push(requestInfo);
            }

            onRequestsUpdate({ ...requestsData });
          }
        });
        unsubscribers.push(unsubscribeRequest);
      });

      // Subscribe to received requests
      receivedRequests.forEach(requestId => {
        const requestRef = doc(db, "users", requestId);
        const unsubscribeRequest = onSnapshot(requestRef, (requestDoc) => {
          if (!isActive) return;

          if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            const requestInfo = {
              uid: requestId,
              email: requestData.email,
              fullName: requestData.fullName,
              profilePic: requestData.profilePic,
              status: requestData.status,
              lastSeen: requestData.lastSeen
            };

            const existingIndex = requestsData.received.findIndex(r => r.uid === requestId);
            if (existingIndex >= 0) {
              requestsData.received[existingIndex] = requestInfo;
            } else {
              requestsData.received.push(requestInfo);
            }

            onRequestsUpdate({ ...requestsData });
          }
        });
        unsubscribers.push(unsubscribeRequest);
      });

      // If no requests, send empty data
      if (sentRequests.length === 0 && receivedRequests.length === 0) {
        onRequestsUpdate({ sent: [], received: [] });
      }
    }, (error) => {
      if (!isActive) return;
      console.error('Error in friend requests subscription:', error);
      if (onError) onError(error);
      onRequestsUpdate({ sent: [], received: [] });
    });

    return () => {
      isActive = false;
      unsubscribeUser();
      unsubscribers.forEach(unsub => unsub());
    };

  } catch (error) {
    console.error('Error setting up friend requests subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Subscribe to received friend requests only
 */
export const subscribeToReceivedFriendRequests = (userId, onReceivedRequestsUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const userRef = doc(db, "users", userId);
    let isActive = true;
    let unsubscribers = [];

    const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
      if (!isActive) return;

      if (!userDoc.exists()) {
        const error = new Error("User not found");
        if (onError) onError(error);
        onReceivedRequestsUpdate([]);
        return;
      }

      const userData = userDoc.data();
      const receivedRequests = userData.receivedRequests || [];

      // Clean up previous subscriptions
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      if (receivedRequests.length === 0) {
        onReceivedRequestsUpdate([]);
        return;
      }

      const receivedRequestsData = [];

      // Subscribe to each received request
      receivedRequests.forEach(requestId => {
        const requestRef = doc(db, "users", requestId);
        const unsubscribeRequest = onSnapshot(requestRef, (requestDoc) => {
          if (!isActive) return;

          if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            const requestInfo = {
              uid: requestId,
              email: requestData.email,
              fullName: requestData.fullName,
              profilePic: requestData.profilePic,
              status: requestData.status,
              lastSeen: requestData.lastSeen,
              bio: requestData.bio
            };

            const existingIndex = receivedRequestsData.findIndex(r => r.uid === requestId);
            if (existingIndex >= 0) {
              receivedRequestsData[existingIndex] = requestInfo;
            } else {
              receivedRequestsData.push(requestInfo);
            }

            onReceivedRequestsUpdate([...receivedRequestsData]);
          }
        }, (error) => {
          if (!isActive) return;
          console.error(`Error listening to request user ${requestId}:`, error);
        });

        unsubscribers.push(unsubscribeRequest);
      });
    }, (error) => {
      if (!isActive) return;
      console.error('Error in received friend requests subscription:', error);
      if (onError) onError(error);
      onReceivedRequestsUpdate([]);
    });

    return () => {
      isActive = false;
      unsubscribeUser();
      unsubscribers.forEach(unsub => unsub());
    };

  } catch (error) {
    console.error('Error setting up received friend requests subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

// =============================================
// USER PROFILE & BLOCKED USERS
// =============================================

/**
 * Subscribe to user profile updates
 */
export const subscribeToUserProfile = (userId, onProfileUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const userRef = doc(db, "users", userId);
    let isActive = true;

    const unsubscribe = onSnapshot(userRef, 
      (doc) => {
        if (!isActive) return;

        if (doc.exists()) {
          const userData = doc.data();
          onProfileUpdate({
            uid: userId,
            ...userData
          });
        } else {
          const error = new Error("User profile not found");
          if (onError) onError(error);
        }
      }, 
      (error) => {
        if (!isActive) return;
        console.error('Error in user profile subscription:', error);
        if (onError) onError(error);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };

  } catch (error) {
    console.error('Error setting up user profile subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Subscribe to blocked users list
 */
export const subscribeToBlockedUsers = (userId, onBlockedUpdate, onError) => {
  try {
    if (!userId) {
      const error = new Error('User ID is required');
      if (onError) onError(error);
      return () => {};
    }

    const userRef = doc(db, "users", userId);
    let isActive = true;
    let unsubscribers = [];

    const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
      if (!isActive) return;

      if (!userDoc.exists()) {
        const error = new Error("User not found");
        if (onError) onError(error);
        onBlockedUpdate([]);
        return;
      }

      const userData = userDoc.data();
      const blockedUsers = userData.blocked || [];

      // Clean up previous subscriptions
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];

      if (blockedUsers.length === 0) {
        onBlockedUpdate([]);
        return;
      }

      const blockedData = [];

      // Subscribe to each blocked user
      blockedUsers.forEach(blockedId => {
        const blockedRef = doc(db, "users", blockedId);
        const unsubscribeBlocked = onSnapshot(blockedRef, (blockedDoc) => {
          if (!isActive) return;

          if (blockedDoc.exists()) {
            const blockedUserData = blockedDoc.data();
            const blockedInfo = {
              uid: blockedId,
              email: blockedUserData.email,
              fullName: blockedUserData.fullName,
              profilePic: blockedUserData.profilePic,
              status: blockedUserData.status,
              lastSeen: blockedUserData.lastSeen
            };

            const existingIndex = blockedData.findIndex(b => b.uid === blockedId);
            if (existingIndex >= 0) {
              blockedData[existingIndex] = blockedInfo;
            } else {
              blockedData.push(blockedInfo);
            }

            onBlockedUpdate([...blockedData]);
          }
        });
        unsubscribers.push(unsubscribeBlocked);
      });
    }, (error) => {
      if (!isActive) return;
      console.error('Error in blocked users subscription:', error);
      if (onError) onError(error);
      onBlockedUpdate([]);
    });

    return () => {
      isActive = false;
      unsubscribeUser();
      unsubscribers.forEach(unsub => unsub());
    };

  } catch (error) {
    console.error('Error setting up blocked users subscription:', error);
    if (onError) onError(error);
    return () => {};
  }
};

// =============================================
// MASTER SUBSCRIPTION FUNCTION
// =============================================

/**
 * Subscribe to all real-time data at once
 */
export const subscribeToAllRealtimeData = (userId, callbacks) => {
  const { 
    onFriendsUpdate, 
    onChatsUpdate, 
    onProfileUpdate, 
    onRequestsUpdate, 
    onReceivedRequestsUpdate,
    onBlockedUpdate, 
    onError 
  } = callbacks;
  
  console.log('🚀 Starting all real-time subscriptions for user:', userId);
  
  const unsubscribeFriends = subscribeToFriends(userId, onFriendsUpdate, onError);
  const unsubscribeChats = subscribeToChats(userId, onChatsUpdate, onError);
  const unsubscribeProfile = subscribeToUserProfile(userId, onProfileUpdate, onError);
  const unsubscribeRequests = subscribeToFriendRequests(userId, onRequestsUpdate, onError);
  const unsubscribeReceivedRequests = subscribeToReceivedFriendRequests(userId, onReceivedRequestsUpdate, onError);
  const unsubscribeBlocked = subscribeToBlockedUsers(userId, onBlockedUpdate, onError);

  // Return combined cleanup function
  return () => {
    console.log('🧹 Cleaning up all real-time subscriptions');
    unsubscribeFriends();
    unsubscribeChats();
    unsubscribeProfile();
    unsubscribeRequests();
    unsubscribeReceivedRequests();
    unsubscribeBlocked();
  };
};