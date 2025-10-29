import React, { useState, useEffect } from 'react'
import ChatRoom from '../../components/chat/ChatRoom'
import ChatDetail from '../../components/chat/ChatDetail'
import ChatControl from '../../components/chat/ChatControl'

const ChatPage = () => {
  const [currentView, setCurrentView] = useState('chatcontrol') 
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024) // 1024px is typical tablet breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  const handleSelectChat = (friend) => {
    setSelectedFriend(friend)
    if (isMobile) {
      setCurrentView('chatRoom')
    }
  }

  const handleBackToList = () => {
    if (isMobile) {
      setCurrentView('chatcontrol')
    }
  }

  const handleOpenDetail = () => {
    if (isMobile) {
      setCurrentView('chatDetail')
    }
  }

  const handleBackToChat = () => {
    if (isMobile) {
      setCurrentView('chatRoom')
    }
  }

  // For desktop - show all three columns
  if (!isMobile) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <div className='w-110 flex-shrink-0'>
          <ChatControl onSelectChat={handleSelectChat} />
        </div>
        <div className='flex-1'>
          <ChatRoom 
            selectedFriend={selectedFriend}
            onOpenDetail={handleOpenDetail} 
          />
        </div>
        <div className='w-80 flex-shrink-0'>
          <ChatDetail selectedFriend={selectedFriend} />
        </div>
      </div>
    )
  }

  // For mobile/tablet - show one view at a time
  return (
    <div className='h-screen bg-gray-50 relative'>
      {/* Chat List View */}
      {currentView === 'chatcontrol' && (
        <div className='h-full'>
          <ChatControl onSelectChat={handleSelectChat} />
        </div>
      )}

      {/* Chat Room View */}
      {currentView === 'chatRoom' && (
        <div className='h-full'>
          <ChatRoom 
            selectedFriend={selectedFriend}
            onOpenDetail={handleOpenDetail}
            onBack={handleBackToList}
            showBackButton={true}
          />
        </div>
      )}

      {/* Chat Detail View */}
      {currentView === 'chatDetail' && (
        <div className='h-full'>
          <ChatDetail 
            selectedFriend={selectedFriend}
            onBack={handleBackToChat} 
          />
        </div>
      )}
    </div>
  )
}

export default ChatPage
