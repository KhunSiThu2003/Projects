// ChatPage.jsx - Updated real-time chat listener
import React, { useState, useEffect, useCallback } from 'react'
import ChatRoom from '../../components/chat/ChatRoom'
import ChatDetail from '../../components/chat/ChatDetail'
import ChatSideBar from '../../components/chat/ChatSideBar'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import { setUserOffline, setupActivityTracking, cleanupActivityTracking } from '../../services/user'

const ChatPage = () => {
  const [currentView, setCurrentView] = useState('chatsidebar')
  const [selectedChat, setSelectedChat] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useUserStore()
  const { chats, subscribeToAllData, getChatById } = useRealtimeStore()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // Setup activity tracking when user is on chat page
  useEffect(() => {
    if (user?.uid) {
      setupActivityTracking(user.uid);
    }

    return () => {
      if (user?.uid) {
        cleanupActivityTracking(user.uid);
      }
    };
  }, [user?.uid]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToAllData(user.uid)
      return unsubscribe
    }
  }, [user?.uid, subscribeToAllData])

  // Handle chat selection from any component
  const handleSelectChat = useCallback((chat) => {
    setSelectedChat(chat)
    if (isMobile) {
      setCurrentView('chatRoom')
    }
  }, [isMobile])

  const handleBackToList = useCallback(() => {
    if (isMobile) {
      setCurrentView('chatsidebar')
    }
  }, [isMobile])

  const handleOpenDetail = useCallback(() => {
    if (isMobile) {
      setCurrentView('chatDetail')
    }
  }, [isMobile])

  const handleBackToChat = useCallback(() => {
    if (isMobile) {
      setCurrentView('chatRoom')
    }
  }, [isMobile])

  // Listen for real-time updates to selected chat using realtime store
  useEffect(() => {
    if (!selectedChat?.id) return

    // Get the latest chat data from the store whenever chats update
    const updatedChat = getChatById(selectedChat.id)
    if (updatedChat) {
      // Check if important data has changed
      const hasImportantChanges = 
        updatedChat.participants?.length !== selectedChat.participants?.length ||
        updatedChat.lastMessage !== selectedChat.lastMessage ||
        updatedChat.lastMessageAt?.toDate?.()?.getTime() !== selectedChat.lastMessageAt?.toDate?.()?.getTime() ||
        updatedChat.otherParticipant?.isOnline !== selectedChat.otherParticipant?.isOnline

      if (hasImportantChanges) {
        console.log('Chat data updated from realtime store, updating selectedChat')
        setSelectedChat(prev => ({
          ...prev,
          ...updatedChat,
          // Preserve the otherParticipant object if it exists and merge updates
          otherParticipant: updatedChat.otherParticipant || prev.otherParticipant
        }))
      }
    }
  }, [chats, selectedChat?.id, getChatById])

  // Alternative approach: More granular updates using store subscriptions
  useEffect(() => {
    if (!selectedChat?.id) return

    // This effect will run whenever the chats in the store update
    // and automatically keep the selectedChat in sync
    const currentChatInStore = getChatById(selectedChat.id)
    
    if (currentChatInStore && currentChatInStore !== selectedChat) {
      // Only update if there are meaningful changes
      const shouldUpdate = 
        currentChatInStore.lastMessage !== selectedChat.lastMessage ||
        currentChatInStore.lastMessageAt !== selectedChat.lastMessageAt ||
        currentChatInStore.otherParticipant?.isOnline !== selectedChat.otherParticipant?.isOnline

      if (shouldUpdate) {
        setSelectedChat(currentChatInStore)
      }
    }
  }, [chats, selectedChat, getChatById])

  // For desktop - show all three columns
  if (!isMobile) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <div className='w-110 flex-shrink-0 border-r border-gray-200'>
          <ChatSideBar setIsProfileModalOpen={setIsProfileModalOpen} onSelectChat={handleSelectChat} />
        </div>
        {selectedChat ? (
          <>
            <div className="flex-1">
              <ChatRoom
                selectedFriend={selectedChat}
                onOpenDetail={handleOpenDetail}
              />
            </div>
            <div className="w-80 flex-shrink-0 border-l border-gray-200">
              <ChatDetail setSelectedChat={setSelectedChat} selectedFriend={selectedChat} />
            </div>
          </>
        ) : (
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
        )}
      </div>
    )
  }

  // For mobile/tablet - show one view at a time
  return (
    <div className='h-screen bg-gray-50 relative'>
      {/* Chat List View */}
      {currentView === 'chatsidebar' && (
        <div className='h-full'>
          <ChatSideBar setIsProfileModalOpen={setIsProfileModalOpen} onSelectChat={handleSelectChat} />
        </div>
      )}

      {/* Chat Room View */}
      {currentView === 'chatRoom' && (
        <div className='h-full'>
          <ChatRoom
            selectedFriend={selectedChat}
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
            setSelectedChat={setSelectedChat}
            selectedFriend={selectedChat}
            onBack={handleBackToChat}
          />
        </div>
      )}
    </div>
  )
}

export default ChatPage