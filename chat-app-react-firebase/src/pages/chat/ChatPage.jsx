// ChatPage.jsx - Updated without group chat features
import React, { useState, useEffect, useCallback } from 'react'
import ChatRoom from '../../components/chat/ChatRoom'
import ChatDetail from '../../components/chat/ChatDetail'
import ChatControl from '../../components/chat/ChatControl'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import useUserStore from '../../stores/useUserStore'
import { setUserOffline, setupActivityTracking, cleanupActivityTracking } from '../../services/user'

import UserProfileModal from '../../components/chat/UserProfileModal';

const ChatPage = () => {
  const [currentView, setCurrentView] = useState('chatcontrol')
  const [selectedChat, setSelectedChat] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useUserStore()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Check screen size on mount and resize
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

  // Handle chat selection from any component
  const handleSelectChat = useCallback((chat) => {
    console.log('Chat selected:', chat)
    setSelectedChat(chat)
    if (isMobile) {
      setCurrentView('chatRoom')
    }
  }, [isMobile])

  const handleBackToList = useCallback(() => {
    if (isMobile) {
      setCurrentView('chatcontrol')
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

  // Listen for real-time updates to selected chat - OPTIMIZED VERSION
  useEffect(() => {
    if (!selectedChat?.id) return

    const chatRef = doc(db, "chats", selectedChat.id)
    const unsubscribe = onSnapshot(chatRef,
      (doc) => {
        if (doc.exists()) {
          const chatData = doc.data()

          // Only update if it's not just a message update
          // Check if important metadata changed (not just lastMessage)
          const hasImportantChanges =
            chatData.participants?.length !== selectedChat.participants?.length;

          if (hasImportantChanges) {
            console.log('Important chat data changed, updating selectedChat')
            setSelectedChat(prev => ({
              ...prev,
              ...chatData
            }))
          }
          // Otherwise, ignore the update to prevent unnecessary re-renders
        }
      },
      (error) => {
        console.error('Error in chat listener:', error)
      }
    )

    return () => unsubscribe()
  }, [selectedChat?.id])

  // For desktop - show all three columns
  if (!isMobile) {
    return (
      <div className='flex h-screen bg-gray-50'>

        {/* Profile Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />

        <div className='w-110 flex-shrink-0 border-r border-gray-200'>
          <ChatControl setIsProfileModalOpen={setIsProfileModalOpen} onSelectChat={handleSelectChat} />
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
      {/* Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      {/* Chat List View */}
      {currentView === 'chatcontrol' && (
        <div className='h-full'>
          <ChatControl setIsProfileModalOpen={setIsProfileModalOpen} onSelectChat={handleSelectChat} />
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