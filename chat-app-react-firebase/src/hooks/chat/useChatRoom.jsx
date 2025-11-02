import { useState, useRef, useEffect, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useUserStore from '../../stores/useUserStore';
import useRealtimeStore from '../../stores/useRealtimeStore';

export const useChatRoom = (selectedFriend, onOpenDetail, onBack, showBackButton = false) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', imageName: '' });
  const [friendDetails, setFriendDetails] = useState(null);
  const [currentUserDetails, setCurrentUserDetails] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { user } = useUserStore();
  const { subscribeToMessages, getFriendById, userProfile } = useRealtimeStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userProfile) {
      setCurrentUserDetails({
        uid: user.uid,
        name: userProfile.fullName || user.displayName || 'You',
        profilePic: userProfile.profilePic,
        email: userProfile.email,
        bio: userProfile.bio,
        status: userProfile.status,
        lastSeen: userProfile.lastSeen
      });
    } else {
      setCurrentUserDetails({
        uid: user.uid,
        name: user.fullName || user.displayName || 'You',
        profilePic: user.profilePic,
        email: user.email,
        bio: user.bio,
        status: user.status,
        lastSeen: user.lastSeen
      });
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (!selectedFriend || !user?.uid) {
      setFriendDetails(null);
      return;
    }

    try {
      let friendData = null;

      if (selectedFriend.uid) {
        friendData = {
          uid: selectedFriend.uid,
          name: selectedFriend.fullName || selectedFriend.name || 'Unknown User',
          profilePic: selectedFriend.profilePic,
          isOnline: selectedFriend.status === 'online',
          lastSeen: selectedFriend.lastSeen
        };
      }
      else if (selectedFriend.otherParticipant) {
        friendData = {
          uid: selectedFriend.otherParticipant.uid,
          name: selectedFriend.otherParticipant.name || 'Unknown User',
          profilePic: selectedFriend.otherParticipant.profilePic,
          isOnline: selectedFriend.otherParticipant.isOnline,
          lastSeen: selectedFriend.otherParticipant.lastSeen
        };
      }
      else if (selectedFriend.participantsArray) {
        const otherParticipantId = selectedFriend.participantsArray.find(id => id !== user.uid);
        if (otherParticipantId) {
          const friendFromStore = getFriendById(otherParticipantId);
          if (friendFromStore) {
            friendData = {
              uid: friendFromStore.uid,
              name: friendFromStore.fullName || 'Unknown User',
              profilePic: friendFromStore.profilePic,
              isOnline: friendFromStore.status === 'online',
              lastSeen: friendFromStore.lastSeen
            };
          }
        }
      }

      if (!friendData && selectedFriend.id) {
        const otherParticipantId = selectedFriend.participantsArray?.find(id => id !== user.uid);
        if (otherParticipantId) {
          const friendFromStore = getFriendById(otherParticipantId);
          if (friendFromStore) {
            friendData = {
              uid: friendFromStore.uid,
              name: friendFromStore.fullName || 'Unknown User',
              profilePic: friendFromStore.profilePic,
              isOnline: friendFromStore.status === 'online',
              lastSeen: friendFromStore.lastSeen
            };
          }
        }
      }

      setFriendDetails(friendData);
    } catch (error) {
      setFriendDetails(null);
    }
  }, [selectedFriend, user?.uid, getFriendById]);

  useEffect(() => {
    if (!selectedFriend?.id || !user?.uid) return;

    setLoading(true);

    try {
      const chatId = selectedFriend.id;

      const unsubscribe = subscribeToMessages(
        chatId,
        (messagesData) => {
          setMessages(messagesData);
          setLoading(false);
        },
        (error) => {
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      setLoading(false);
    }
  }, [selectedFriend?.id, user?.uid, subscribeToMessages]);

  // Reset unread count when viewing a chat
  useEffect(() => {
    if (!selectedFriend?.id || !user?.uid) return;

    const resetUnreadCount = async () => {
      try {
        const chatRef = doc(db, "chats", selectedFriend.id);
        await updateDoc(chatRef, {
          [`unreadCount.${user.uid}`]: 0
        });
      } catch (error) {
        // Silently fail if there's an error
      }
    };

    resetUnreadCount();
  }, [selectedFriend?.id, user?.uid]);

  const handleEmojiClick = useCallback((emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  }, []);

  const handleImageSelect = useCallback((event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const imageToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }, []);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      if (!selectedFriend?.id) {
        return;
      }

      const messageRef = doc(db, "chats", selectedFriend.id, "messages", messageId);
      await deleteDoc(messageRef);

      const remainingMessages = messages.filter(msg => msg.id !== messageId);
      if (remainingMessages.length > 0) {
        const lastMessage = remainingMessages[remainingMessages.length - 1];
        const chatRef = doc(db, "chats", selectedFriend.id);
        await updateDoc(chatRef, {
          lastMessage: lastMessage.type === 'image' ? '📷 Image' : lastMessage.content,
          lastMessageAt: lastMessage.timestamp
        });
      }
    } catch (error) {
    }
  }, [selectedFriend?.id, messages]);

  const handleImageClick = useCallback((imageUrl, messageId = '') => {
    setImageModal({
      isOpen: true,
      imageUrl,
      imageName: `chat-image-${messageId || Date.now()}`
    });
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setImageModal({ isOpen: false, imageUrl: '', imageName: '' });
  }, []);

  const handleBackgroundClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleCloseImageModal();
    }
  }, [handleCloseImageModal]);

  const handleDownloadImage = useCallback(async (imageUrl, imageName = 'image') => {
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
    }
  }, []);

  const handleModalDownload = useCallback(() => {
    handleDownloadImage(imageModal.imageUrl, imageModal.imageName);
  }, [imageModal.imageUrl, imageModal.imageName, handleDownloadImage]);

  const handleSendMessage = useCallback(async () => {
    if ((messageInput.trim() === '' && !selectedImage) || !selectedFriend?.id || !user?.uid) {
      return;
    }

    setSending(true);
    try {
      const messagesRef = collection(db, "chats", selectedFriend.id, "messages");

      let messageContent = messageInput.trim();
      let messageType = 'text';
      let imageData = null;

      if (selectedImage) {
        messageType = 'image';
        imageData = await imageToBase64(selectedImage);
        messageContent = '📷 Image';
      }

      const messageData = {
        content: messageContent,
        type: messageType,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        ...(imageData && { image: imageData })
      };

      await addDoc(messagesRef, messageData);

      // Get the other participant's ID to increment their unread count
      const otherParticipantId = selectedFriend.participantsArray?.find(id => id !== user.uid);
      
      const chatRef = doc(db, "chats", selectedFriend.id);
      const updateData = {
        lastMessage: messageType === 'image' ? '📷 Image' : messageContent,
        lastMessageAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Increment unread count for the recipient
      if (otherParticipantId) {
        updateData[`unreadCount.${otherParticipantId}`] = increment(1);
      }
      
      await updateDoc(chatRef, updateData);

      setMessageInput('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
    } finally {
      setSending(false);
    }
  }, [messageInput, selectedImage, selectedFriend?.id, user?.uid, imageToBase64]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const formatMessageTime = useCallback((timestamp) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  }, []);

  const formatMessageDate = useCallback((timestamp) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
      if (diffDays < 365) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return '';
    }
  }, []);

  const shouldShowDate = useCallback((currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    try {
      const currentDate = currentMessage.timestamp?.toDate?.() || new Date(currentMessage.timestamp);
      const previousDate = previousMessage.timestamp?.toDate?.() || new Date(previousMessage.timestamp);
      
      if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) return true;
      
      return currentDate.toDateString() !== previousDate.toDateString();
    } catch (error) {
      return true;
    }
  }, []);

  const getChatName = useCallback(() => {
    return friendDetails?.name || selectedFriend?.name || 'Unknown User';
  }, [friendDetails, selectedFriend]);

  const getUserAvatar = useCallback((userId, userName, profilePic) => {
    if (profilePic) {
      return (
        <img
          src={profilePic}
          alt={userName}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      );
    }
    
    const avatarText = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userId === user.uid ? 'bg-blue-500' : 'bg-gray-500'}`}>
        <span className="text-white text-xs font-medium">
          {avatarText}
        </span>
      </div>
    );
  }, [user.uid]);

  const getCurrentUserAvatar = useCallback(() => {
    if (!currentUserDetails) {
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
          <span className="text-white text-xs font-medium">Y</span>
        </div>
      );
    }
    
    return getUserAvatar(
      currentUserDetails.uid,
      currentUserDetails.name,
      currentUserDetails.profilePic
    );
  }, [currentUserDetails, getUserAvatar]);

  const getFriendAvatar = useCallback(() => {
    if (!friendDetails) {
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-500">
          <span className="text-white text-xs font-medium">U</span>
        </div>
      );
    }
    
    return getUserAvatar(
      friendDetails.uid,
      friendDetails.name,
      friendDetails.profilePic
    );
  }, [friendDetails, getUserAvatar]);

  const getOnlineStatus = useCallback(() => {
    if (!friendDetails) return 'Offline';
    return friendDetails.isOnline ? 'Online' : 'Offline';
  }, [friendDetails]);

  return {
    messages,
    messageInput,
    setMessageInput,
    loading,
    sending,
    showEmojiPicker,
    setShowEmojiPicker,
    selectedImage,
    imagePreview,
    imageModal,
    friendDetails,
    currentUserDetails,
    messagesEndRef,
    fileInputRef,
    user,
    handleEmojiClick,
    handleImageSelect,
    handleRemoveImage,
    handleDeleteMessage,
    handleImageClick,
    handleCloseImageModal,
    handleBackgroundClick,
    handleDownloadImage,
    handleModalDownload,
    handleSendMessage,
    handleKeyPress,
    formatMessageTime,
    formatMessageDate,
    shouldShowDate,
    getChatName,
    getCurrentUserAvatar,
    getFriendAvatar,
    getOnlineStatus,
    getUserAvatar
  };
};