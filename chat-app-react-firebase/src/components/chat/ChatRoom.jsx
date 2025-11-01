import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import useUserStore from '../../stores/useUserStore';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { FaSmile, FaImage, FaTimes, FaTrash, FaExpand, FaDownload } from "react-icons/fa";
import useRealtimeStore from '../../stores/useRealtimeStore';

const ChatRoom = ({ selectedFriend, onOpenDetail, onBack, showBackButton = false }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', imageName: '' });
  const [contextMenu, setContextMenu] = useState({ isOpen: false, messageId: '', x: 0, y: 0 });
  const [friendDetails, setFriendDetails] = useState(null);
  const [currentUserDetails, setCurrentUserDetails] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { user } = useUserStore();
  const { subscribeToMessages, getFriendById, userProfile } = useRealtimeStore();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ isOpen: false, messageId: '', x: 0, y: 0 });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load current user details from realtime store
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
      // Fallback to basic user store data
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

  // Extract friend details from selectedFriend
  useEffect(() => {
    if (!selectedFriend || !user?.uid) {
      setFriendDetails(null);
      return;
    }

    try {
      let friendData = null;

      // Case 1: Direct friend object
      if (selectedFriend.uid) {
        friendData = {
          uid: selectedFriend.uid,
          name: selectedFriend.fullName || selectedFriend.name || 'Unknown User',
          profilePic: selectedFriend.profilePic,
          isOnline: selectedFriend.status === 'online',
          lastSeen: selectedFriend.lastSeen
        };
      }
      // Case 2: otherParticipant structure
      else if (selectedFriend.otherParticipant) {
        friendData = {
          uid: selectedFriend.otherParticipant.uid,
          name: selectedFriend.otherParticipant.name || 'Unknown User',
          profilePic: selectedFriend.otherParticipant.profilePic,
          isOnline: selectedFriend.otherParticipant.isOnline,
          lastSeen: selectedFriend.otherParticipant.lastSeen
        };
      }
      // Case 3: Find friend in realtime store using participantsArray
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

      // Case 4: If we still don't have friend data, try to get from realtime store using the ID
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
      console.error('Error extracting friend details:', error);
      setFriendDetails(null);
    }
  }, [selectedFriend, user?.uid, getFriendById]);

  // Load messages for the selected chat
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
          console.error('Error loading messages:', error);
          toast.error('Failed to load messages');
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      toast.error('Failed to load messages');
      setLoading(false);
    }
  }, [selectedFriend?.id, user?.uid, subscribeToMessages]);

  // Handle emoji click
  const handleEmojiClick = (emojiData) => {
    try {
      setMessageInput(prev => prev + emojiData.emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error handling emoji click:', error);
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.onerror = () => {
        toast.error('Failed to load image preview');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling image selection:', error);
      toast.error('Failed to select image');
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    try {
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // Convert image to base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle message context menu (right-click)
  const handleMessageContextMenu = (e, message) => {
    try {
      e.preventDefault();

      // Only allow delete for own messages
      if (message.senderId === user.uid) {
        setContextMenu({
          isOpen: true,
          messageId: message.id,
          x: e.clientX,
          y: e.clientY
        });
      }
    } catch (error) {
      console.error('Error handling context menu:', error);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      if (!selectedFriend?.id) {
        toast.error('No chat selected');
        return;
      }

      const messageRef = doc(db, "chats", selectedFriend.id, "messages", messageId);
      await deleteDoc(messageRef);

      // Update last message if needed
      const remainingMessages = messages.filter(msg => msg.id !== messageId);
      if (remainingMessages.length > 0) {
        const lastMessage = remainingMessages[remainingMessages.length - 1];
        const chatRef = doc(db, "chats", selectedFriend.id);
        await updateDoc(chatRef, {
          lastMessage: lastMessage.type === 'image' ? '📷 Image' : lastMessage.content,
          lastMessageAt: lastMessage.timestamp
        });
      }

      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setContextMenu({ isOpen: false, messageId: '', x: 0, y: 0 });
    }
  };

  // Open image in modal
  const handleImageClick = (imageUrl, messageId = '') => {
    try {
      setImageModal({
        isOpen: true,
        imageUrl,
        imageName: `chat-image-${messageId || Date.now()}`
      });
    } catch (error) {
      console.error('Error opening image modal:', error);
    }
  };

  // Close image modal
  const handleCloseImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', imageName: '' });
  };

  // Handle background click to close modal
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseImageModal();
    }
  };

  // Handle download image
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
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  // Handle download from modal
  const handleModalDownload = () => {
    handleDownloadImage(imageModal.imageUrl, imageModal.imageName);
  };

  const handleSendMessage = async () => {
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

      const chatRef = doc(db, "chats", selectedFriend.id);
      await updateDoc(chatRef, {
        lastMessage: messageType === 'image' ? '📷 Image' : messageContent,
        lastMessageAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setMessageInput('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting message time:', error);
      return '';
    }
  };

  const formatMessageDate = (timestamp) => {
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
      console.error('Error formatting message date:', error);
      return '';
    }
  };

  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    try {
      const currentDate = currentMessage.timestamp?.toDate?.() || new Date(currentMessage.timestamp);
      const previousDate = previousMessage.timestamp?.toDate?.() || new Date(previousMessage.timestamp);
      
      if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) return true;
      
      return currentDate.toDateString() !== previousDate.toDateString();
    } catch (error) {
      console.error('Error checking date difference:', error);
      return true;
    }
  };

  const getChatName = () => {
    return friendDetails?.name || selectedFriend?.name || 'Unknown User';
  };

  const getUserAvatar = (userId, userName, profilePic) => {
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
  };

  const getCurrentUserAvatar = () => {
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
  };

  const getFriendAvatar = () => {
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
  };

  const getOnlineStatus = () => {
    if (!friendDetails) return 'Offline';
    return friendDetails.isOnline ? 'Online' : 'Offline';
  };

  if (!selectedFriend) {
    return (
      <section className='flex-1 flex flex-col bg-white items-center justify-center h-full'>
        <div className='text-center p-8'>
          <div className='w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
            </svg>
          </div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No Chat Selected</h3>
          <p className='text-gray-500 text-sm'>Select a conversation to start messaging</p>
        </div>
      </section>
    );
  }

  return (
    <section className='flex-1 flex flex-col bg-white relative h-full'>
      {/* Chat Header */}
      <div className='border-b border-gray-200 p-4 bg-white'>
        <div className='flex items-center space-x-3'>
          {/* Back Button for Mobile */}
          {showBackButton && (
            <button
              onClick={onBack}
              className='p-2 text-gray-500 hover:text-gray-700 transition-colors lg:hidden'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
              </svg>
            </button>
          )}

          <div
            onClick={onOpenDetail}
            className='flex items-center space-x-3 flex-1 cursor-pointer'
          >
            {getFriendAvatar()}
            <div className='flex-1'>
              <h3 className='font-semibold text-gray-800'>{getChatName()}</h3>
              <p className='text-xs text-gray-500'>
                {getOnlineStatus()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center space-x-2'>
            <button
              onClick={onOpenDetail}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors lg:hidden'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
        {loading ? (
          <div className='flex items-center justify-center h-full'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        ) : messages.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                </svg>
              </div>
              <p className='text-gray-500 text-sm'>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {messages.map((message, index) => {
              const showDate = shouldShowDate(message, messages[index - 1]);
              const isOwnMessage = message.senderId === user.uid;
              const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className='flex justify-center my-6'>
                      <span className='text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full'>
                        {formatMessageDate(message.timestamp)}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={`flex items-end space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    onContextMenu={(e) => handleMessageContextMenu(e, message)}
                  >
                    {/* Other user's avatar (left side) */}
                    {!isOwnMessage && showAvatar && (
                      <div className="flex-shrink-0">
                        {getFriendAvatar()}
                      </div>
                    )}

                    {/* Spacer for own messages to align properly */}
                    {isOwnMessage && !showAvatar && (
                      <div className="w-8"></div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                      {/* Message content */}
                      <div
                        className={`px-4 py-2 rounded-2xl relative group ${
                          isOwnMessage
                            ? 'bg-black/90 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                        }`}
                      >
                        {/* Image message */}
                        {message.type === 'image' && message.image && (
                          <div className="mb-2 relative">
                            <img
                              src={message.image}
                              alt="Sent image"
                              className="max-w-full h-auto rounded-lg max-h-64 object-cover cursor-pointer"
                              onClick={() => handleImageClick(message.image, message.id)}
                              onError={(e) => {
                                console.error('Error loading image:', message.id);
                                e.target.style.display = 'none';
                              }}
                            />
                            {/* Expand icon overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleImageClick(message.image, message.id)}
                                className="bg-black bg-opacity-50 cursor-pointer text-white p-1 rounded-full hover:bg-opacity-70"
                              >
                                <FaExpand className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Download icon overlay */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadImage(message.image, `chat-image-${message.id}`);
                                }}
                                className="bg-black bg-opacity-50 cursor-pointer text-white p-1 rounded-full hover:bg-opacity-70"
                                title="Download image"
                              >
                                <FaDownload className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Text message */}
                        {message.content && message.type !== 'image' && (
                          <p className='text-sm whitespace-pre-wrap break-words'>{message.content}</p>
                        )}

                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>

                        {/* Delete button (only for own messages) */}
                        {isOwnMessage && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-2 -right-2 cursor-pointer bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Delete message"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Own avatar (right side) */}
                    {isOwnMessage && showAvatar && (
                      <div className="flex-shrink-0 order-3">
                        {getCurrentUserAvatar()}
                      </div>
                    )}

                    {/* Spacer for other user's messages to align properly */}
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-8"></div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-xs h-auto rounded-lg max-h-32 object-cover"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
          >
            <FaTrash className="w-4 h-4" />
            <span>Delete Message</span>
          </button>
        </div>
      )}

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
                console.error('Error loading modal image:', imageModal.imageUrl);
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
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className='border-t border-gray-200 p-4 bg-white'>
        <div className='flex items-end space-x-3'>
          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0'
            >
              <FaSmile className='w-5 h-5' />
            </button>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Image Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0'
          >
            <FaImage className='w-5 h-5' />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Message Input */}
          <div className='flex-1 bg-gray-100 rounded-2xl px-4 py-2 min-h-[44px] max-h-32 overflow-y-auto'>
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Type a message...'
              className='w-full bg-transparent border-none focus:outline-none text-sm resize-none max-h-24'
              rows="1"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!messageInput.trim() && !selectedImage) || sending}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              (messageInput.trim() || selectedImage) && !sending
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
            ) : (
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </section>
  );
};

export default ChatRoom;