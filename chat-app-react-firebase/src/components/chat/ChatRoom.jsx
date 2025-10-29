import React, { useState, useRef } from 'react'
import EmojiPicker from 'emoji-picker-react'

const ChatRoom = ({ onOpenDetail, onBack, showBackButton = false }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'them',
      content: "I can refer to the project structure and board some mistakes.",
      time: '10:30 AM'
    },
    {
      id: 2,
      sender: 'them',
      content: "There are some bugs in that project.",
      time: '10:31 AM'
    },
    {
      id: 3,
      sender: 'them',
      content: "Yes there are many bugs in that project.",
      time: '10:32 AM'
    },
    {
      id: 4,
      sender: 'me',
      content: "Draw Recording",
      time: '10:33 AM'
    },
    {
      id: 5,
      sender: 'them',
      content: "Help, I'm Fine. And You?",
      time: '10:34 AM'
    }
  ])

  const [messageInput, setMessageInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef(null)

  const handleEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji)
  }

  const handleSendMessage = () => {
    if (messageInput.trim() === '') return

    const newMessage = {
      id: messages.length + 1,
      sender: 'me',
      content: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMessage])
    setMessageInput('')
    setShowEmojiPicker(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Close emoji picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <section className='flex-1 flex flex-col bg-white relative h-full'>
      {/* Chat Header */}
      <div className='border-b border-gray-200 p-4'>
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
            <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center'>
              <span className='text-white text-sm font-medium'>TR</span>
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold text-gray-800'>Theme Vanhorn</h3>
              <p className='text-xs text-gray-500'>Online</p>
            </div>
          </div>

          {/* Detail Button for Mobile */}
          <button 
            onClick={onOpenDetail}
            className='p-2 text-gray-500 hover:text-gray-700 transition-colors lg:hidden'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        <div className='text-center'>
          <span className='text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>
            Today
          </span>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'me'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className='text-sm whitespace-pre-wrap'>{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className='absolute bottom-16 left-4 z-10 shadow-xl rounded-lg overflow-hidden'
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={350}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            searchDisabled={false}
          />
        </div>
      )}

      {/* Message Input */}
      <div className='border-t border-gray-200 p-4'>
        <div className='flex items-end space-x-3'>
          {/* Emoji Button */}
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className='p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors flex-shrink-0'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
              <path d="M8.5 10a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 8.5 10zM15.5 10a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 15.5 10z"/>
              <path d="M12 18c-3 0-4-3-4-3h8s-1 3-4 3z"/>
            </svg>
          </button>

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
            disabled={!messageInput.trim()}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              messageInput.trim() 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatRoom
