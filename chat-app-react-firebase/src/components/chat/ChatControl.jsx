import React, { useState } from 'react'
import FriendList from './FriendList'
import SearchFriend from './SearchFriend'
import FriendRequestList from './FriendRequestList'
import ChatList from './ChatList'
import BlockedList from './BlockedList'
import SideBar from './SideBar'

const ChatControl = ({ onSelectChat }) => {
  const [activeView, setActiveView] = useState("chats")

  const renderContent = () => {
    switch (activeView) {
      case "chats":
        return <ChatList onSelectChat={onSelectChat} />
      case "friends":
        return <FriendList onSelectChat={onSelectChat} />
      case "search":
        return <SearchFriend />
      case "request":
        return <FriendRequestList />
      case "blocked":
        return <BlockedList onSelectChat={onSelectChat} />
      default:
        return <FriendList onSelectChat={onSelectChat} />
    }
  }

  return (
    <div className='flex h-full bg-white border border-gray-200'>
      {/* Sidebar Navigation */}
      <SideBar setShowList={setActiveView} activeView={activeView} />
      
      {/* Main Content Area */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Header - Only show for non-friends views */}
        {activeView !== "chats" && (
          <div className='p-4 border-b border-gray-200 bg-white'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-gray-800 capitalize'>
                {activeView === "search" ? "Search Friends" : 
                 activeView === "request" ? "Friend Requests" : 
                 activeView}
              </h2>
              <button 
                onClick={() => setActiveView("chats")}
                className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <div className='flex-1 overflow-hidden'>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default ChatControl