import { useState, useEffect, useCallback } from 'react';
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

export const useChatDetail = (selectedFriend, onBack, setSelectedChat) => {
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

    let unsubscribe = () => {};

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
    setImageModal({ isOpen: false, imageUrl: '', imageName: '' });
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
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextSibling;
              if (fallback && fallback.style) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div 
            className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center hidden"
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

  return {
    friendDetails,
    mediaMessages,
    loading,
    mediaLoading,
    actionLoading,
    activeTab,
    imageModal,
    setActiveTab,
    handleBlockUser,
    handleRemoveFriend,
    handleDeleteAllMessages,
    handleDownloadImage,
    handleImageClick,
    handleCloseImageModal,
    handleBackgroundClick,
    handleModalDownload,
    formatLastSeen,
    formatMediaDate,
    getAvatarContent
  };
};