import { create } from "zustand";
import { subscribeToFriendsListWithRealtimeUpdates } from "../services/friend";

const useFriendsStore = create((set, get) => ({
  // State
  friends: [],
  loading: false,
  error: null,
  isSubscribed: false,

  // Actions
  clearFriends: () => set({ 
    friends: [], 
    error: null, 
    loading: false 
  }),

  // Get specific friend by ID
  getFriendById: (friendId) => {
    const { friends } = get();
    return friends.find(friend => friend.uid === friendId) || null;
  },

  // Check if user is friend
  isFriend: (userId) => {
    const { friends } = get();
    return friends.some(friend => friend.uid === userId);
  },

  // Get online friends
  getOnlineFriends: () => {
    const { friends } = get();
    return friends.filter(friend => friend.status === 'online');
  },

  // Get offline friends
  getOfflineFriends: () => {
    const { friends } = get();
    return friends.filter(friend => friend.status === 'offline');
  },

  // Real-time subscription to friends list
  subscribeToFriends: (userId) => {
    if (!userId) {
      console.error('User ID is required for friends subscription');
      return () => {};
    }

    const { isSubscribed } = get();
    if (isSubscribed) {
      console.log('Already subscribed to friends list');
      return () => {};
    }

    set({ loading: true, isSubscribed: true });

    const unsubscribe = subscribeToFriendsListWithRealtimeUpdates(
      userId, 
      (friends) => {
        set({ 
          friends, 
          loading: false,
          error: null 
        });
      }, 
      (error) => {
        console.error('Friends subscription error:', error);
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

export default useFriendsStore;