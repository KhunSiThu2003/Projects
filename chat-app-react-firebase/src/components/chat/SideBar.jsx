// SideBar.jsx - Updated with proper unread message count
import React, { useState, useEffect } from 'react'
import UserInfo from './UserInfo'
import {
  FaUserFriends,
  FaSearch,
  FaUserPlus,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaCog,
  FaEllipsisH,
  FaRegCommentDots,
  FaUserLock
} from 'react-icons/fa'

import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import useCookie from 'react-use-cookie'

const SideBar = ({ setShowList, activeView, setIsProfileModalOpen }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useUserStore()
  const { 
    receivedFriendRequests, 
    chats,
    subscribeToAllData 
  } = useRealtimeStore()
  const [, setUserCookie] = useCookie("user")

  // Setup realtime subscriptions
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToAllData(user.uid)
      return unsubscribe
    }
  }, [user?.uid, subscribeToAllData])

  // Calculate unread messages count properly
  const getUnreadMessagesCount = () => {
    if (!chats || !Array.isArray(chats)) return 0;
    
    return chats.reduce((total, chat) => {
      // Check if chat has unreadCount object and get the count for current user
      const unreadCount = chat.unreadCount?.[user?.uid] || 0;
      return total + unreadCount;
    }, 0);
  };

  // Alternative method: Count chats with unread messages
  const getUnreadChatsCount = () => {
    if (!chats || !Array.isArray(chats)) return 0;
    
    return chats.filter(chat => {
      const unreadCount = chat.unreadCount?.[user?.uid] || 0;
      return unreadCount > 0;
    }).length;
  };

  // Calculate real-time notification counts
  const getNotificationCounts = () => {
    const unreadMessagesCount = getUnreadMessagesCount();
    const unreadChatsCount = getUnreadChatsCount();
    const receivedRequestsCount = receivedFriendRequests.length;

    console.log('Notification counts:', {
      unreadMessages: unreadMessagesCount,
      unreadChats: unreadChatsCount,
      receivedRequests: receivedRequestsCount,
      chats: chats?.length || 0
    });

    return {
      chats: unreadMessagesCount, // Total unread messages across all chats
      request: receivedRequestsCount,
      friends: 0,
      search: 0,
      blocked: 0
    };
  };

  const notificationCounts = getNotificationCounts();

  const menuItems = [
    {
      key: "chats",
      icon: <FaRegCommentDots size={20} />,
      label: "Chats",
      notification: notificationCounts.chats,
    },
    {
      key: "friends",
      icon: <FaUserFriends size={20} />,
      label: "Friends",
      notification: notificationCounts.friends,
    },
    {
      key: "search",
      icon: <FaSearch size={20} />,
      label: "Search",
      notification: notificationCounts.search,
    },
    {
      key: "request",
      icon: <FaUserPlus size={20} />,
      label: "Requests",
      notification: notificationCounts.request,
    },
    {
      key: "blocked",
      icon: <FaUserLock size={20} />,
      label: "Blocked",
      notification: notificationCounts.blocked,
    }
  ];

  const handleMenuClick = (key) => {
    setShowList(key)
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      const result = null ;
      if (result.success) {
        setUserCookie('', { days: 0 })
        setUser(null)
        toast.success('Logged out successfully')
        navigate('/')
      } else {
        throw new Error(result.error || 'Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error(error.message || 'Logout failed. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && !event.target.closest('.sidebar-container')) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileOpen])

  // Get total notification count for mobile header
  const totalNotifications = Object.values(notificationCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Mobile Header */}
      <div className='lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-4 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200'
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
            <UserInfo setIsProfileModalOpen={setIsProfileModalOpen} />
          </div>

          {/* Active view indicator with notifications */}
          <div className='flex items-center space-x-2'>
            {totalNotifications > 0 && (
              <span className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></span>
            )}
            <div className='text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full capitalize flex items-center gap-2'>
              {activeView === 'request' ? 'Requests' : activeView}
              {notificationCounts[activeView] > 0 && (
                <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {notificationCounts[activeView]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/70 bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          sidebar-container
          fixed inset-y-0 left-0 z-50
          w-64
          bg-white
          border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          shadow-2xl
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          
          lg:static lg:translate-x-0 
          lg:w-20
          lg:transition-all lg:duration-300
          lg:shadow-lg
          ${isExpanded ? 'lg:w-64' : ''}
        `}
      >

        {/* Desktop Header */}
        <div className='hidden lg:flex p-4 border-b border-gray-200 bg-white'>
          <div className='flex items-center space-x-3 w-full min-w-0'>
            <UserInfo setIsProfileModalOpen={setIsProfileModalOpen} />
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className='text-lg font-bold text-gray-800 truncate'>
                {user?.fullName || 'User'}
              </h2>
              <p className='text-sm text-green-500 font-medium'>Online</p>
              {totalNotifications > 0 && (
                <p className='text-xs text-gray-500 mt-1'>
                  {totalNotifications} new notification{totalNotifications !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden lg:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <FaEllipsisH size={16} />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className='flex-1 py-4 px-3'>
          <div className='space-y-2'>
            {menuItems.map((item) => {
              const isActive = activeView === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleMenuClick(item.key)}
                  className={`
                    relative flex items-center w-full px-4 py-3 rounded-lg font-medium
                    transition-all duration-200 ease-in-out
                    border-2
                    ${isActive
                      ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-black hover:border-gray-300'
                    }
                  `}
                  title={item.label}
                >
                  {/* Icon + Badge */}
                  <div className="relative flex items-center justify-center w-6 h-6">
                    {item.icon}
                    {item.notification > 0 && (
                      <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-sm ${
                        isActive ? 'bg-white text-black border border-gray-300' : 'bg-red-500'
                      }`}>
                        {item.notification > 9 ? '9+' : item.notification}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      ml-3 text-sm font-semibold transition-all duration-300
                      whitespace-nowrap
                      lg:opacity-0 lg:max-w-0
                      ${isMobileOpen ? 'opacity-100 max-w-[200px]' : ''}
                      ${isExpanded ? 'lg:opacity-100 lg:max-w-[200px]' : ''}
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Notification count for expanded view */}
                  {(isMobileOpen || isExpanded) && item.notification > 0 && (
                    <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center ${
                      isActive ? 'bg-white text-black' : 'bg-red-500 text-white'
                    }`}>
                      {item.notification}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              relative flex items-center w-full px-4 py-3 rounded-lg font-medium
              transition-all duration-200 ease-in-out
              border-2
              text-red-600 border-gray-200 hover:border-red-500 hover:bg-red-50
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Logout"
          >
            {/* Icon */}
            <div className="relative flex items-center justify-center w-6 h-6">
              <FaSignOutAlt
                size={18}
                className={`transition-transform duration-300 ${isLoggingOut ? 'animate-spin' : ''}`}
              />
            </div>

            {/* Label */}
            <span
              className={`
                ml-3 text-sm font-semibold transition-all duration-300
                whitespace-nowrap
                lg:opacity-0 lg:max-w-0
                ${isMobileOpen ? 'opacity-100 max-w-[200px]' : ''}
                ${isExpanded ? 'lg:opacity-100 lg:max-w-[200px]' : ''}
              `}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile spacer */}
      <div className='lg:hidden h-16' />
    </>
  )
}

export default SideBar