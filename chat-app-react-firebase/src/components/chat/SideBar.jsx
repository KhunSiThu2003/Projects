// SideBar.jsx
import React, { useState } from 'react'
import UserInfo from './UserInfo'
import { 
  FaComments, 
  FaUserFriends, 
  FaSearch, 
  FaUserPlus, 
  FaBan,
  FaBars,
  FaTimes
} from 'react-icons/fa'

const SideBar = ({ setShowList, activeView }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    { key: "chats", icon: <FaComments size={18} />, label: "Chats", color: "blue" },
    { key: "friends", icon: <FaUserFriends size={18} />, label: "Friends", color: "green" },
    { key: "search", icon: <FaSearch size={18} />, label: "Search", color: "purple" },
    { key: "request", icon: <FaUserPlus size={18} />, label: "Requests", color: "orange" },
    { key: "blocked", icon: <FaBan size={16} />, label: "Blocked", color: "red" },
  ]

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50',
      green: isActive ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50',
      purple: isActive ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50',
      orange: isActive ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-orange-50',
      red: isActive ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-50'
    }
    return colors[color] || colors.blue
  }

  const handleMenuClick = (key) => {
    setShowList(key)
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className='lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 p-4 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors'
            >
              {isMobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
            <div className='flex items-center space-x-3'>
              <UserInfo />
              <div>
                <span className='text-sm font-semibold text-gray-800'>Messages</span>
                <p className='text-xs text-green-500'>Online</p>
              </div>
            </div>
          </div>
          
          {/* Active view indicator for mobile */}
          <div className='text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full capitalize font-medium'>
            {activeView}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className='lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-80 md:w-20
        bg-white
        border-r border-gray-100
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        shadow-xl lg:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Desktop Header */}
        <div className='hidden lg:block p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <UserInfo />
              <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
            </div>
            <div className='md:hidden block'>
              <h2 className='text-lg font-bold text-gray-800'>Messages</h2>
              <p className='text-sm text-green-500 font-medium'>Online</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className='flex-1 py-6 px-4'>
          <div className='space-y-1'>
            {menuItems.map((item) => {
              const isActive = activeView === item.key
              const colorClasses = getColorClasses(item.color, isActive)
              
              return (
                <button
                  key={item.key}
                  onClick={() => handleMenuClick(item.key)}
                  className={`
                    w-full flex items-center space-x-4
                    px-4 py-3
                    rounded mb-3
                    transition-all duration-200
                    group
                    font-medium
                    ${colorClasses}
                    ${isActive 
                      ? 'shadow-lg scale-[1.02]' 
                      : 'hover:scale-[1.02] hover:shadow-md'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center
                    transition-transform duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                  `}>
                    {item.icon}
                  </div>
                  <span className={`
                    text-sm font-semibold
                    md:hidden block
                    transition-all duration-200
                    ${isActive ? 'translate-x-0' : 'group-hover:translate-x-1'}
                  `}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator dot for mobile */}
                  {isActive && (
                    <div className='md:hidden ml-auto w-2 h-2 bg-white rounded-full' />
                  )}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Mobile spacer */}
      <div className='lg:hidden h-16' />
    </>
  )
}

export default SideBar