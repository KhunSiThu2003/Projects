import React, { useEffect, useState, useMemo } from 'react';
import useRealtimeStore from '../../stores/useRealtimeStore';
import useUserStore from '../../stores/useUserStore';
import { createOrGetChat } from '../../services/chatService'; // You'll need to create this

const FriendList = ({ handleSetActiveView, onSelectChat }) => {
  const {
    friends,
    getOnlineFriends,
    getOfflineFriends,
    loading,
    error,
    subscribeToAllData
  } = useRealtimeStore();

  const {user} = useUserStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userId = user.uid;

  // Setup realtime subscriptions
  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToAllData(userId);
      return unsubscribe;
    }
  }, [userId, subscribeToAllData]);

  const getFilteredFriends = () => {
    switch (activeTab) {
      case 'online':
        return getOnlineFriends();
      case 'offline':
        return getOfflineFriends();
      default:
        return friends;
    }
  };

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    const tabFiltered = getFilteredFriends();
    if (!searchQuery.trim()) return tabFiltered;

    const query = searchQuery.toLowerCase();
    return tabFiltered.filter(friend => 
      (friend.fullName || friend.displayName || '').toLowerCase().includes(query) ||
      (friend.email || '').toLowerCase().includes(query) ||
      (friend.bio || '').toLowerCase().includes(query)
    );
  }, [friends, activeTab, searchQuery]);

  const onlineFriends = getOnlineFriends();
  const offlineFriends = getOfflineFriends();

  // Format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return lastSeenDate.toLocaleDateString();
  };

  const handleStartChat = async (friend) => {
    try {
      // Create or get existing chat
      const chat = await createOrGetChat(userId, friend.uid);
      
      if (onSelectChat && chat) {
        // Create a proper chat object for the friend
        const chatData = {
          id: chat.id,
          otherParticipant: {
            uid: friend.uid,
            name: friend.fullName || friend.displayName,
            profilePic: friend.profilePic,
            isOnline: friend.status === 'online',
            lastSeen: friend.lastSeen
          },
          name: friend.fullName || friend.displayName,
          lastMessage: chat.lastMessage || 'Start a conversation',
          lastMessageAt: chat.lastMessageAt,
          participantsArray: chat.participantsArray,
          participantsData: chat.participantsData
        };
        onSelectChat(chatData);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (loading && friends.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Friends</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading friends...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Friends</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Error loading friends</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Friends</h2>
          <button
            onClick={() => handleSetActiveView('search')}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Friend
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Stats and Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              All: {friends.length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Online: {onlineFriends.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button 
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-blue-500 text-blue-600 bg-white' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'online' 
              ? 'border-blue-500 text-blue-600 bg-white' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('online')}
        >
          Online
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'offline' 
              ? 'border-blue-500 text-blue-600 bg-white' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('offline')}
        >
          Offline
        </button>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">
              {searchQuery 
                ? 'No friends found' 
                : activeTab === 'all' 
                ? 'No friends yet' 
                : activeTab === 'online' 
                ? 'No friends online' 
                : 'No friends offline'
              }
            </p>
            <p className="text-sm text-gray-400">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : activeTab === 'all' && 'Start adding friends to see them here!'
              }
            </p>
            {!searchQuery && activeTab === 'all' && (
              <button
                onClick={() => handleSetActiveView('search')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Add Friends
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredFriends.map(friend => (
              <li 
                key={friend.uid} 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleStartChat(friend)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar with status indicator */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={friend.profilePic || friend.photoURL || 'https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg'} 
                      alt={friend.fullName || friend.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://t3.ftcdn.net/jpg/06/19/26/46/360_F_619264680_x2PBdGLF54sFe7kTBtAvZnPyXgvaRw0Y.jpg';
                      }}
                    />
                    <div 
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>

                  {/* Friend info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {friend.fullName || friend.displayName || 'Unknown User'}
                      </h3>
                      {friend.isVerified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-xs capitalize ${
                      friend.status === 'online' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {friend.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                    {friend.status !== 'online' && friend.lastSeen && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last seen: {formatLastSeen(friend.lastSeen)}
                      </p>
                    )}
                    {friend.bio && friend.bio !== "Hey there! I'm using ChatApp 💬" && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {friend.bio}
                      </p>
                    )}
                  </div>

                  {/* Message Action */}
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Send message"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(friend);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Loading indicator for updates */}
      {loading && friends.length > 0 && (
        <div className="p-3 text-center border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-xs text-blue-600 mt-1">Updating friends...</p>
        </div>
      )}
    </div>
  );
};

export default FriendList;