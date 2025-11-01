import React, { useEffect } from 'react';
import { useFriendList } from '../../hooks/chat/useFriendList';

const FriendList = ({ handleSetActiveView, onSelectChat }) => {
  const {
    user,
    friends,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    filteredFriends,
    onlineFriends,
    handleStartChat,
    handleUnfriend,
    subscribeToAllData
  } = useFriendList();

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToAllData(user.uid);
      return unsubscribe;
    }
  }, [user?.uid, subscribeToAllData]);

  if (loading && friends.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white lg:max-w-90">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Friends</h2>
              <p className="text-sm text-gray-500 mt-1">Your friends list</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((skeleton) => (
              <div key={skeleton} className="flex items-center space-x-4 p-4 animate-pulse bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white lg:max-w-90">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Friends</h2>
              <p className="text-sm text-gray-500 mt-1">Your friends list</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading friends</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative lg:max-w-90">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Friends</h2>
            <p className="text-sm text-gray-500 mt-1">Your friends list</p>
          </div>
          <button
            onClick={() => handleSetActiveView('search')}
            className=" px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Add Friend
          </button>
        </div>

        <div className="relative ">
          <div className="absolute inset-y-0 z-40 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
          />
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
            ? 'border-black text-black bg-white'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('all')}
        >
          All Friends
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'online'
            ? 'border-black text-black bg-white'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('online')}
        >
          Online
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'offline'
            ? 'border-black text-black bg-white'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('offline')}
        >
          Offline
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {activeTab === 'all' ? 'All Friends' : activeTab === 'online' ? 'Online Friends' : 'Offline Friends'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredFriends.length} friend{filteredFriends.length !== 1 ? 's' : ''} • {' '}
                {onlineFriends.length} online
              </p>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
              {filteredFriends.length} shown
            </span>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              <h4 className="text-md font-bold text-gray-700 mb-3 text-center">
                {searchQuery
                  ? 'No friends found'
                  : activeTab === 'all'
                    ? 'No friends yet'
                    : activeTab === 'online'
                      ? 'No friends online'
                      : 'No friends offline'
                }
              </h4>

              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6 text-center">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Add friends first to start conversations. Go to the "Search" tab to find and add friends.'
                }
              </p>


            </div>
          ) : (
            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.uid}
                  className="group p-4 rounded-md cursor-pointer transition-all duration-200 border border-gray-100 hover:bg-gray-50 hover:border-blue-100 hover:shadow-md"
                >
                  <div className="flex items-start space-x-3">
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
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {friend.fullName || friend.displayName || 'Unknown User'}
                          </h4>
                          {friend.isVerified && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            title="Send message"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChat(friend, onSelectChat);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>

                          <button
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove friend"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfriend(friend);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs capitalize mb-2 ${friend.status === 'online' ? 'text-green-600 font-medium' : 'text-gray-500'
                        }`}>
                        {friend.status === 'online' ? 'Online' : `Last seen: ${formatLastSeen(friend.lastSeen)}`}
                      </p>

                      {friend.bio && friend.bio !== "Hey there! I'm using ChatApp 💬" && (
                        <p className="text-xs text-gray-600 truncate leading-tight">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

export default FriendList;