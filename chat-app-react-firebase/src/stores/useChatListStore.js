import { create } from "zustand";
import { subscribeToChatListWithRealtimeUpdates } from "../services/chatList";

const useChatListStore = create((set, get) => ({
  // State
  chats: [],
  loading: false,
  error: null,
  isSubscribed: false,

  // Actions
  clearChats: () => set({ 
    chats: [], 
    error: null, 
    loading: false 
  }),

  // Get specific chat by ID
  getChatById: (chatId) => {
    const { chats } = get();
    return chats.find(chat => chat.id === chatId) || null;
  },

  // Get chats with specific participant
  getChatsWithParticipant: (participantId) => {
    const { chats } = get();
    return chats.filter(chat => 
      chat.participantsData && chat.participantsData[participantId]
    );
  },

  // Get unread chats count
  getUnreadChatsCount: () => {
    const { chats } = get();
    return chats.filter(chat => chat.unreadCount && chat.unreadCount > 0).length;
  },

  // Real-time subscription to chat list
  subscribeToChats: (userId) => {
    if (!userId) {
      console.error('User ID is required for chat subscription');
      return () => {};
    }

    const { isSubscribed } = get();
    if (isSubscribed) {
      console.log('Already subscribed to chat list');
      return () => {};
    }

    set({ loading: true, isSubscribed: true });

    const unsubscribe = subscribeToChatListWithRealtimeUpdates(
      userId, 
      (chats) => {
        set({ 
          chats, 
          loading: false,
          error: null 
        });
      }, 
      (error) => {
        console.error('Chat subscription error:', error);
        set({ 
          error: error.message, 
          loading: false 
        });
      }
    );

    // Return unsubscribe function
    return () => {
      unsubscribe();
      set({ 
        isSubscribed: false,
        loading: false 
      });
    };
  }
}));

export default useChatListStore;