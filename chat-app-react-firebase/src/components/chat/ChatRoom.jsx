import React from 'react';
import { FaSmile, FaImage, FaTimes, FaTrash, FaExpand, FaDownload } from "react-icons/fa";
import EmojiPicker from 'emoji-picker-react';
import { useChatRoom } from '../../hooks/chat/useChatRoom';

const ChatRoom = ({ selectedFriend, onOpenDetail, onBack, showBackButton = false }) => {
  const {
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
    getOnlineStatus
  } = useChatRoom(selectedFriend, onOpenDetail, onBack, showBackButton);

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
      <div className='border-b border-gray-200 p-4 bg-white'>
        <div className='flex items-center space-x-3'>
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
                  {showDate && (
                    <div className='flex justify-center my-6'>
                      <span className='text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full'>
                        {formatMessageDate(message.timestamp)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    {!isOwnMessage && showAvatar && (
                      <div className="flex-shrink-0">
                        {getFriendAvatar()}
                      </div>
                    )}

                    {isOwnMessage && !showAvatar && (
                      <div className="w-8"></div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl relative group ${
                          isOwnMessage
                            ? 'bg-black/90 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                        }`}
                      >
                        {message.type === 'image' && message.image && (
                          <div className="mb-2 relative">
                            <img
                              src={message.image}
                              alt="Sent image"
                              className="max-w-full h-auto rounded-lg max-h-64 object-cover cursor-pointer"
                              onClick={() => handleImageClick(message.image, message.id)}
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleImageClick(message.image, message.id)}
                                className="bg-black bg-opacity-50 cursor-pointer text-white p-1 rounded-full hover:bg-opacity-70"
                              >
                                <FaExpand className="w-3 h-3" />
                              </button>
                            </div>
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

                        {message.content && message.type !== 'image' && (
                          <p className='text-sm whitespace-pre-wrap break-words'>{message.content}</p>
                        )}

                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>

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

                    {isOwnMessage && showAvatar && (
                      <div className="flex-shrink-0 order-3">
                        {getCurrentUserAvatar()}
                      </div>
                    )}

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
            />
            
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

      <div className='border-t border-gray-200 p-4 bg-white'>
        <div className='flex items-end space-x-3'>
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0'
            >
              <FaSmile className='w-5 h-5' />
            </button>
            
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