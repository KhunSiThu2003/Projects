import { create } from "zustand";
import { 
  subscribeToFriends, 
  subscribeToChats, 
  subscribeToUserProfile,
  subscribeToFriendRequests,
  subscribeToReceivedFriendRequests,
  subscribeToBlockedUsers,
  subscribeToAllRealtimeData,
  subscribeToChatMessages,
  subscribeToAllChatMessages 
} from "../services/realtimeSubscriptions";

const useRealtimeStore = create((set, get) => ({
  // State
  friends: [],
  chats: [],
  userProfile: null,
  friendRequests: { sent: [], received: [] },
  receivedFriendRequests: [],
  blockedUsers: [],
  loading: false,
  error: null,
  isSubscribed: false,

  // Actions
  clearAllData: () => set({ 
    friends: [], 
    chats: [], 
    userProfile: null,
    friendRequests: { sent: [], received: [] },
    receivedFriendRequests: [],
    blockedUsers: [],
    error: null, 
    loading: false 
  }),

  // Friends actions
  getFriendById: (friendId) => {
    const { friends } = get();
    return friends.find(friend => friend.uid === friendId) || null;
  },

  isFriend: (userId) => {
    const { friends } = get();
    return friends.some(friend => friend.uid === userId);
  },

  getOnlineFriends: () => {
    const { friends } = get();
    return friends.filter(friend => friend.status === 'online');
  },

  getOfflineFriends: () => {
    const { friends } = get();
    return friends.filter(friend => friend.status === 'offline');
  },

  // Chats actions
// Add these methods to your useRealtimeStore.js

// Enhanced chat actions
getChatById: (chatId) => {
  const { chats } = get();
  return chats.find(chat => chat.id === chatId) || null;
},

updateChat: (chatId, updates) => {
  set(state => ({
    chats: state.chats.map(chat => 
      chat.id === chatId 
        ? { ...chat, ...updates }
        : chat
    )
  }));
},

updateChatParticipantStatus: (chatId, participantId, status, lastSeen) => {
  set(state => ({
    chats: state.chats.map(chat => {
      if (chat.id !== chatId) return chat;
      
      // Update otherParticipant status if this is the participant
      if (chat.otherParticipant?.uid === participantId) {
        return {
          ...chat,
          otherParticipant: {
            ...chat.otherParticipant,
            isOnline: status === 'online',
            lastSeen: lastSeen
          }
        };
      }
      
      return chat;
    })
  }));
},

// Update last message for a chat
updateChatLastMessage: (chatId, lastMessage, lastMessageAt) => {
  set(state => ({
    chats: state.chats.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            lastMessage,
            lastMessageAt,
            lastUpdated: lastMessageAt || serverTimestamp()
          }
        : chat
    ).sort((a, b) => {
      // Re-sort chats by last update time
      const timeA = a.lastUpdated?.toDate?.() || a.lastMessageAt?.toDate?.() || new Date(0);
      const timeB = b.lastUpdated?.toDate?.() || b.lastMessageAt?.toDate?.() || new Date(0);
      return timeB - timeA;
    })
  }));
},

  getChatsWithParticipant: (participantId) => {
    const { chats } = get();
    return chats.filter(chat => 
      chat.participantsData && chat.participantsData[participantId]
    );
  },

  getUnreadChatsCount: () => {
    const { chats } = get();
    return chats.filter(chat => chat.unreadCount && chat.unreadCount > 0).length;
  },

  getMessagesByChatId: (chatId) => {
  const { chats } = get();
  const chat = chats.find(chat => chat.id === chatId);
  return chat?.messages || [];
},

subscribeToMessages: (chatId, onMessagesUpdate, onError) => {
  return subscribeToChatMessages(chatId, onMessagesUpdate, onError);
},

subscribeToAllMessages: (userId, onMessagesUpdate, onError) => {
  return subscribeToAllChatMessages(userId, onMessagesUpdate, onError);
},

updateChatMessages: (chatId, messages) => {
  set(state => ({
    chats: state.chats.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: messages }
        : chat
    )
  }));
},

  // Friend requests actions
  hasPendingRequests: () => {
    const { friendRequests } = get();
    return friendRequests.received.length > 0;
  },

  getPendingRequestsCount: () => {
    const { friendRequests } = get();
    return friendRequests.received.length;
  },

  // Received friend requests actions
  hasReceivedRequests: () => {
    const { receivedFriendRequests } = get();
    return receivedFriendRequests.length > 0;
  },

  getReceivedRequestsCount: () => {
    const { receivedFriendRequests } = get();
    return receivedFriendRequests.length;
  },

  getReceivedRequestById: (userId) => {
    const { receivedFriendRequests } = get();
    return receivedFriendRequests.find(request => request.uid === userId) || null;
  },

  // Blocked users actions
  isUserBlocked: (userId) => {
    const { blockedUsers } = get();
    return blockedUsers.some(user => user.uid === userId);
  },

  // Real-time subscription to all data
  subscribeToAllData: (userId) => {
    if (!userId) {
      console.error('User ID is required for real-time subscription');
      return () => {};
    }

    const { isSubscribed } = get();
    if (isSubscribed) {
      console.log('Already subscribed to real-time data');
      return () => {};
    }

    set({ loading: true, isSubscribed: true });

    const checkAllDataLoaded = (state) => {
      return state.friends.length >= 0 && 
             state.chats.length >= 0 && 
             state.userProfile && 
             state.friendRequests && 
             state.receivedFriendRequests.length >= 0 &&
             state.blockedUsers.length >= 0;
    };

    const unsubscribe = subscribeToAllRealtimeData(userId, {
      onFriendsUpdate: (friends) => {
        set(state => ({ 
          friends, 
          loading: checkAllDataLoaded({ ...state, friends }) ? false : true 
        }));
      },
      onChatsUpdate: (chats) => {
        set(state => ({ 
          chats, 
          loading: checkAllDataLoaded({ ...state, chats }) ? false : true 
        }));
      },
      onProfileUpdate: (userProfile) => {
        set(state => ({ 
          userProfile, 
          loading: checkAllDataLoaded({ ...state, userProfile }) ? false : true 
        }));
      },
      onRequestsUpdate: (friendRequests) => {
        set(state => ({ 
          friendRequests, 
          loading: checkAllDataLoaded({ ...state, friendRequests }) ? false : true 
        }));
      },
      onReceivedRequestsUpdate: (receivedFriendRequests) => {
        set(state => ({ 
          receivedFriendRequests, 
          loading: checkAllDataLoaded({ ...state, receivedFriendRequests }) ? false : true 
        }));
      },
      onBlockedUpdate: (blockedUsers) => {
        set(state => ({ 
          blockedUsers, 
          loading: checkAllDataLoaded({ ...state, blockedUsers }) ? false : true 
        }));
      },
      onError: (error) => {
        console.error('Real-time subscription error:', error);
        set({ 
          error: error.message, 
          loading: false 
        });
      }
    });

    // Return unsubscribe function
    return () => {
      unsubscribe();
      set({ 
        isSubscribed: false,
        loading: false 
      });
    };
  },

  // Individual subscriptions (if needed)
  subscribeToFriends: (userId) => {
    return subscribeToFriends(userId, 
      (friends) => set({ friends }),
      (error) => set({ error: error.message })
    );
  },

  subscribeToChats: (userId) => {
    return subscribeToChats(userId, 
      (chats) => set({ chats }),
      (error) => set({ error: error.message })
    );
  },

  subscribeToFriendRequests: (userId) => {
    return subscribeToFriendRequests(userId, 
      (friendRequests) => set({ friendRequests }),
      (error) => set({ error: error.message })
    );
  },

  subscribeToReceivedFriendRequests: (userId) => {
    return subscribeToReceivedFriendRequests(userId, 
      (receivedFriendRequests) => set({ receivedFriendRequests }),
      (error) => set({ error: error.message })
    );
  }
}));

export default useRealtimeStore;