import React, { useState, useEffect, useCallback } from 'react';
import {
  doc,
  deleteDoc,
  writeBatch,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import useUserStore from '../../stores/useUserStore';
import useRealtimeStore from '../../stores/useRealtimeStore';
import { blockUser, removeFriend } from '../../services/friend';
import { toast } from 'react-hot-toast';
import { FaBan, FaUserMinus, FaImages, FaDownload, FaTrash, FaExpand, FaTimes } from "react-icons/fa";

const ChatDetail = React.memo(({ selectedFriend, onBack, setSelectedChat }) => {
  const [friendDetails, setFriendDetails] = useState(null);
  const [mediaMessages, setMediaMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('info');
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', imageName: '' });

  const { user } = useUserStore();
  const { friends, chats, getFriendById, getChatById, subscribeToMessages } = useRealtimeStore();

  const extractFriendDetails = useCallback((selectedFriend, getFriendById, user) => {
    if (!selectedFriend) return null;

    try {
      let friendId = null;
      let friendData = null;

      if (selectedFriend.otherParticipant?.uid) {
        friendId = selectedFriend.otherParticipant.uid;
      } else if (selectedFriend.uid) {
        friendId = selectedFriend.uid;
      } else if (selectedFriend.participantsArray && user?.uid) {
        friendId = selectedFriend.participantsArray.find(id => id !== user.uid);
      }

      if (!friendId) return null;

      const friendFromStore = getFriendById(friendId);
      if (friendFromStore) {
        return {
          id: friendId,
          name: friendFromStore.fullName || friendFromStore.displayName || 'Unknown User',
          email: friendFromStore.email,
          profilePic: friendFromStore.profilePic,
          bio: friendFromStore.bio,
          status: friendFromStore.status,
          lastSeen: friendFromStore.lastSeen,
          isOnline: friendFromStore.status === 'online'
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const loadFriendDetailsAndMedia = useCallback(async () => {
    if (!selectedFriend) {
      setFriendDetails(null);
      setMediaMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const friendData = extractFriendDetails(selectedFriend, getFriendById, user);
      setFriendDetails(friendData);
      await loadMediaMessages(selectedFriend.id);
    } catch (error) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [selectedFriend, getFriendById, user, extractFriendDetails]);

  useEffect(() => {
    loadFriendDetailsAndMedia();
  }, [loadFriendDetailsAndMedia]);

  useEffect(() => {
    if (!selectedFriend?.id || activeTab !== 'media') return;

    let unsubscribe = () => { };

    try {
      unsubscribe = subscribeToMessages(
        selectedFriend.id,
        (messagesData) => {
          const imageMessages = messagesData
            .filter(msg => msg && msg.type === 'image' && msg.image)
            .map(msg => ({
              ...msg,
              timestamp: msg.timestamp?.toDate?.() || new Date(msg.timestamp || Date.now())
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          setMediaMessages(imageMessages);
          setMediaLoading(false);
        },
        (error) => {
          toast.error('Failed to load media');
          setMediaMessages([]);
          setMediaLoading(false);
        }
      );
    } catch (error) {
      setMediaLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [selectedFriend?.id, activeTab, subscribeToMessages]);

  const loadMediaMessages = useCallback(async (chatId) => {
    if (!chatId) {
      setMediaMessages([]);
      setMediaLoading(false);
      return;
    }

    setMediaLoading(true);
    try {
      const chat = getChatById(chatId);

      if (chat?.messages && Array.isArray(chat.messages)) {
        const imageMessages = chat.messages
          .filter(msg => msg && msg.type === 'image' && msg.image)
          .map(msg => ({
            ...msg,
            timestamp: msg.timestamp?.toDate?.() || new Date(msg.timestamp || Date.now())
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        setMediaMessages(imageMessages);
        return;
      }

      setMediaMessages([]);

    } catch (error) {
      toast.error('Failed to load media');
      setMediaMessages([]);
    } finally {
      setMediaLoading(false);
    }
  }, [getChatById]);

  useEffect(() => {
    if (selectedFriend?.id && activeTab === 'media') {
      setMediaLoading(true);
    }
  }, [selectedFriend?.id, activeTab]);

  const setActionLoadingState = (action, isLoading) => {
    setActionLoading(prev => ({
      ...prev,
      [action]: isLoading
    }));
  };

  const handleBlockUser = async () => {
    if (!friendDetails) return;

    setActionLoadingState('block', true);
    try {
      const result = await blockUser(user.uid, friendDetails.id);
      if (result.success) {
        toast.success(`Blocked ${friendDetails.name}`);
        if (setSelectedChat) {
          setSelectedChat(null);
        }
        if (onBack) onBack();
      } else {
        toast.error(result.error || 'Failed to block user');
      }
    } catch (error) {
      toast.error('Failed to block user');
    } finally {
      setActionLoadingState('block', false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendDetails) return;

    setActionLoadingState('remove', true);
    try {
      const result = await removeFriend(user.uid, friendDetails.id);
      if (result.success) {
        toast.success(`Removed ${friendDetails.name} from friends`);
        if (setSelectedChat) {
          setSelectedChat(null);
        }
        if (onBack) onBack();
      } else {
        toast.error(result.error || 'Failed to remove friend');
      }
    } catch (error) {
      toast.error('Failed to remove friend');
    } finally {
      setActionLoadingState('remove', false);
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!selectedFriend?.id || !friendDetails) return;

    const confirmed = window.confirm(`Are you sure you want to delete all messages with ${friendDetails.name}? This action cannot be undone.`);
    if (!confirmed) return;

    setActionLoadingState('deleteAll', true);
    try {
      const messagesRef = collection(db, "chats", selectedFriend.id, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
      const messagesSnapshot = await getDocs(messagesQuery);

      if (messagesSnapshot.empty) {
        toast.error('No messages found to delete');
        return;
      }

      const batch = writeBatch(db);

      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      const chatRef = doc(db, "chats", selectedFriend.id);
      await updateDoc(chatRef, {
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        lastMessageType: 'text',
        updatedAt: serverTimestamp()
      });

      setMediaMessages([]);

      toast.success('All messages deleted successfully');
    } catch (error) {
      if (error.code === 'permission-denied') {
        toast.error('You do not have permission to delete these messages');
      } else if (error.code === 'not-found') {
        toast.error('Chat or messages not found');
      } else {
        toast.error('Failed to delete messages: ' + error.message);
      }
    } finally {
      setActionLoadingState('deleteAll', false);
    }
  };

  const handleDownloadImage = async (imageUrl, imageName = 'image') => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageName}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const handleImageClick = (imageUrl, messageId = '') => {
    setImageModal({
      isOpen: true,
      imageUrl,
      imageName: `chat-image-${messageId || Date.now()}`
    });
  };

  const handleCloseImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', imageName: ''     });
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseImageModal();
    }
  };

  const handleModalDownload = () => {
    handleDownloadImage(imageModal.imageUrl, imageModal.imageName);
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Long time ago';

    try {
      const now = new Date();
      const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);

      if (isNaN(lastSeenDate.getTime())) {
        return 'Long time ago';
      }

      const diffMs = now - lastSeenDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return lastSeenDate.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatMediaDate = (timestamp) => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const getAvatarContent = () => {
    if (!friendDetails) return null;

    if (friendDetails.profilePic) {
      return (
        <>
          <img
            src={friendDetails.profilePic}
            alt={friendDetails.name}
            className="w-20 h-20 rounded border border-gray-200 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextSibling;
              if (fallback && fallback.style) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div
            className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded border border-gray-200 flex items-center justify-center hidden"
            style={{ display: 'none' }}
          >
            <span className="text-white text-xl font-bold">
              {friendDetails.name ? friendDetails.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </span>
          </div>
        </>
      );
    }

    const avatarText = friendDetails.name ? friendDetails.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    return (
      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
        <span className="text-white text-xl font-bold">{avatarText}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className='w-full bg-white border-l border-gray-200 overflow-y-auto h-full'>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!friendDetails) {
    return (
      <section className='w-full bg-white border-l border-gray-200 overflow-y-auto h-full'>
        <div className="p-6 text-center">
          <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' />
            </svg>
          </div>
          <p className="text-gray-500">No user selected</p>
        </div>
      </section>
    );
  }

  return (
    <section className='w-full bg-white border-l border-gray-200 overflow-y-auto h-full'>
      <div className='p-4 border-b border-gray-200 flex items-center space-x-3 lg:hidden'>
        <button
          onClick={onBack}
          className='p-2 text-gray-500 hover:text-gray-700 transition-colors'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </button>
        <h2 className='text-lg font-semibold text-gray-800'>Profile</h2>
      </div>

      <div className='p-6 border-b border-gray-200'>
        <div className='text-center'>
          <div className='flex justify-center mb-4'>
            {getAvatarContent()}
          </div>
          <h2 className='text-xl font-semibold text-gray-800 mb-1'>{friendDetails.name}</h2>
          <div className='flex items-center justify-center space-x-2 mb-3'>
            

            <span className='text-sm text-gray-500'>
              {friendDetails.isOnline ? 'Online' : `Last seen ${formatLastSeen(friendDetails.lastSeen)}`}
            </span>
          </div>
          <p className='text-sm text-gray-600 mb-4'>{friendDetails.bio || "Hey there! I'm using ChatApp 💬"}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'media' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Media
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'info' ? (
          <>
            <div className='p-6 border-b border-gray-200'>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4'>
                Contact Information
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-800'>{friendDetails.name}</p>
                    <p className='text-xs text-gray-500'>Display Name</p>
                  </div>
                </div>

                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-800'>{friendDetails.email}</p>
                    <p className='text-xs text-gray-500'>Email</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-6 space-y-3'>
              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4'>
                Chat Actions
              </h3>

              <button
                onClick={handleDeleteAllMessages}
                disabled={actionLoading.deleteAll}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading.deleteAll ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaTrash className="w-4 h-4" />
                )}
                <span>Delete All Messages</span>
              </button>

              <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-6'>
                Relationship Actions
              </h3>

              <button
                onClick={handleRemoveFriend}
                disabled={actionLoading.remove}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading.remove ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaUserMinus className="w-4 h-4" />
                )}
                <span>Remove Friend</span>
              </button>

              <button
                onClick={handleBlockUser}
                disabled={actionLoading.block}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading.block ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaBan className="w-4 h-4" />
                )}
                <span>Block User</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-6">
            <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4'>
              Shared Media
            </h3>

            {mediaLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                  <div key={skeleton} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : mediaMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaImages className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No Media Shared</h4>
                <p className="text-gray-500 text-sm">
                  {selectedFriend?.id ?
                    "No images shared in this chat yet" :
                    "Unable to load media"
                  }
                </p>
                {selectedFriend?.id && (
                  <button
                    onClick={() => loadMediaMessages(selectedFriend.id)}
                    className="mt-4 px-4 py-2 bg-black text-white rounded transition-colors text-sm"
                  >
                    Refresh Media
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaMessages.map((message) => (
                  <div key={message.id} className="relative group aspect-square">
                    <img
                      src={message.image}
                      alt="Shared media"
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(message.image, message.id)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    {/* Expand icon overlay */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleImageClick(message.image, message.id)}
                        className="bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                      >
                        <FaExpand className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Download button overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(message.image, `chat-image-${message.id}`);
                      }}
                      className="absolute top-1 left-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                      title="Download image"
                    >
                      <FaDownload className="w-3 h-3" />
                    </button>

                    {/* Timestamp overlay */}
                    <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatMediaDate(message.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={handleBackgroundClick}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imageModal.imageUrl}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                toast.error('Failed to load image');
                handleCloseImageModal();
              }}
            />

            {/* Download Button */}
            <button
              onClick={handleModalDownload}
              className="absolute bottom-4 right-4 cursor-pointer bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-colors"
              title="Download image"
            >
              <FaDownload className="w-5 h-5" />
            </button>

            {/* Close Button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 cursor-pointer bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-colors"
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Warning Section */}
      <div className="p-6 border-t border-gray-200 bg-yellow-50">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-yellow-800 font-medium mb-1">Important</p>
            <p className="text-xs text-yellow-700">
              Blocking or removing a friend will close this chat. You can manage blocked users from the Blocked Users section.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ChatDetail;