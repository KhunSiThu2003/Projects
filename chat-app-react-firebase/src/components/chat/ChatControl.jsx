// ChatControl.jsx - Updated with React.memo to prevent unnecessary re-renders
import React, { useState, useCallback } from 'react'
import FriendList from './FriendList'
import SearchFriend from './SearchFriend'
import FriendRequestList from './FriendRequestList'
import ChatList from './ChatList'
import BlockedList from './BlockedList'
import SideBar from './SideBar'

const ChatControl = React.memo(({ onSelectChat,setIsProfileModalOpen }) => {
  const [activeView, setActiveView] = useState("chats")

  // Set global callback for chat selection from any component
  React.useEffect(() => {
    window.chatSelectCallback = onSelectChat
    return () => {
      window.chatSelectCallback = null
    }
  }, [onSelectChat])

  const handleSetActiveView = useCallback((view) => {
    setActiveView(view)
  }, [])

  const renderContent = useCallback(() => {
    switch (activeView) {
      case "chats":
        return <ChatList handleSetActiveView={handleSetActiveView} onSelectChat={onSelectChat} />
      case "friends":
        return <FriendList handleSetActiveView={handleSetActiveView} onSelectChat={onSelectChat} />
      case "search":
        return <SearchFriend handleSetActiveView={handleSetActiveView} />
      case "request":
        return <FriendRequestList handleSetActiveView={handleSetActiveView} />
      case "blocked":
        return <BlockedList handleSetActiveView={handleSetActiveView} onSelectChat={onSelectChat} />
      default:
        return <FriendList handleSetActiveView={handleSetActiveView} onSelectChat={onSelectChat} />
    }
  }, [activeView, onSelectChat])

  return (
    <div className='flex h-full bg-white border border-gray-200'>
      {/* Sidebar Navigation */}
      <SideBar setIsProfileModalOpen={setIsProfileModalOpen} setShowList={handleSetActiveView} activeView={activeView} />
      
      {/* Main Content Area */}
      <div className='flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 '>

        {/* Dynamic Content */}
        <div className='flex-1 overflow-hidden'>
          {renderContent()}
        </div>
      </div>
    </div>
  )
})

export default ChatControl