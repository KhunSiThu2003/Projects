import React, { useState, useEffect } from 'react'
import UserInfo from './UserInfo'
import {
  FaUserFriends,
  FaSearch,
  FaUserPlus,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaEllipsisH,
  FaRegCommentDots,
  FaUserLock,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaEdit,
  FaSave,
  FaTimesCircle,
  FaTrash,
  FaCamera,
  FaSpinner, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard
} from 'react-icons/fa'

import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import useCookie from 'react-use-cookie'
import { setUserOffline, updateUserProfile, getUserProfile, deleteUserAccount } from '../../services/user'

const SideBar = ({ setShowList, activeView }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bio: '',
    profilePic: ''
  })
  const [originalData, setOriginalData] = useState({})
  const navigate = useNavigate()
  const { user, setUser, removeUser } = useUserStore()
  const {
    receivedFriendRequests,
    chats,
    clearAllData
  } = useRealtimeStore()
  const [, setUserCookie] = useCookie("user")

  useEffect(() => {
    if (showProfileModal) {
      loadUserData()
    }
  }, [showProfileModal])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const result = await getUserProfile(user?.uid)

      if (result.success) {
        const userData = result.user
        const userInfo = {
          fullName: userData.fullName || '',
          email: userData.email || '',
          bio: userData.bio || '',
          profilePic: userData.profilePic || ''
        }

        setFormData(userInfo)
        setOriginalData(userInfo)
      } else {
        toast.error('Failed to load user data')
      }
    } catch (error) {
      toast.error('Error loading profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenProfile = () => {
    setShowProfileModal(true)
  }

  const handleCloseProfile = () => {
    setShowProfileModal(false)
    setIsEditing(false)
    setFormData(originalData)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true)

      if (!formData.fullName.trim()) {
        toast.error('Full name is required')
        return
      }

      if (!formData.email.trim()) {
        toast.error('Email is required')
        return
      }

      const updates = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        ...(formData.profilePic && { profilePic: formData.profilePic })
      }

      const result = await updateUserProfile(user?.uid, updates)

      if (result.success) {
        toast.success('Profile updated successfully!')
        setOriginalData(formData)
        setIsEditing(false)

        const updatedUser = await getUserProfile(user?.uid)
        if (updatedUser.success) {
          setUser(updatedUser.user)
        }
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Error updating profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData(originalData)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePic: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteAccount = async () => {
    if (isDeleting) return

    setIsDeleting(true)

    try {

      const res = await deleteUserAccount(user?.uid);

      if (!res.success) {
        toast.error(res.error || 'Failed to delete account')
        return
      }

      setShowDeleteModal(false)
      setShowProfileModal(false)

      clearAllData()
      removeUser()
      setUserCookie('')
      navigate('/')

    } catch (error) {
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const getUnreadMessagesCount = () => {
    if (!chats || !Array.isArray(chats)) return 0;

    return chats.reduce((total, chat) => {
      const unreadCount = chat.unreadCount?.[user?.uid] || 0;
      return total + unreadCount;
    }, 0);
  };

  const getNotificationCounts = () => {
    const unreadMessagesCount = getUnreadMessagesCount();
    const receivedRequestsCount = receivedFriendRequests.length;

    return {
      chats: unreadMessagesCount,
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
    if (window.innerWidth < 900) {
      setIsMobileOpen(false)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
  }

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      if (user?.uid) {
        await setUserOffline(user.uid);
      }

      clearAllData();
      removeUser();
      setUserCookie('', { days: 0 });

      toast.success('Logged out successfully')
      setShowLogoutModal(false)
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Logout failed. Please try again.')
      setShowLogoutModal(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && !event.target.closest('.sidebar-container')) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileOpen])

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showLogoutModal) {
          handleCancelLogout()
        } else if (showProfileModal) {
          handleCloseProfile()
        } else if (showDeleteModal) {
          setShowDeleteModal(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [showLogoutModal, showProfileModal, showDeleteModal])

  const totalNotifications = Object.values(notificationCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Mobile Header */}
      <div className='lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 py-2 pr-4 pl-2 shadow-sm'>
        <div className='flex items-center justify-between w-full '>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200'
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <UserInfo onOpenProfile={handleOpenProfile} />
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
          ${isExpanded ? 'lg:w-48' : ''}
        `}
      >

        {/* Desktop Header */}
        <div className='hidden lg:flex p-4 border-b border-gray-200 bg-white'>
          <UserInfo onOpenProfile={handleOpenProfile} />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-2 -right-4 w-4 h-8 pr-1 bg-gray-100 rounded-tr-full rounded-br-full shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-200 transition-colors duration-200"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <FaChevronLeft size={12} />
            ) : (
              <FaChevronRight size={12} />
            )}
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
                  <div className=" flex items-center justify-center w-6 h-6">
                    {item.icon}
                    {item.notification > 0 && (
                      <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-sm bg-red-500
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


                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            onClick={handleLogoutClick}
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

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm "
          onClick={handleCloseProfile}
        >
          <div
            className="bg-white rounded shadow-xl max-w-md w-full mx-auto max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Profile Header with Background */}
            <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-white">
              <div className="flex items-center justify-between absolute top-4 right-4">
                <button
                  onClick={handleCloseProfile}
                  className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Profile Info Header */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {formData.profilePic ? (
                    <img
                      src={formData.profilePic}
                      alt="Profile"
                      className="md:w-32 md:h-32 rounded-full object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="md:w-32 md:h-32 rounded-full bg-white/10 flex items-center justify-center text-white border-2 border-white/20">
                      <FaUser size={20} />
                    </div>
                  )}

                  {isEditing && (
                    <label className="absolute bottom-3 right-0 bg-white text-black p-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors duration-200 shadow-lg">
                      <FaCamera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{formData.fullName || 'User Name'}</h3>
                  <p className="text-white/70 text-sm">{formData.email || 'email@example.com'}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-black" size={24} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Personal Information Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Personal Information
                    </h4>

                    <div className="space-y-4">
                      {/* Name Field */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaUser className="text-gray-600" size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Full Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 text-gray-900"
                              placeholder="Enter your full name"
                            />
                          ) : (
                            <p className="text-gray-900">{formData.fullName || 'Not set'}</p>
                          )}
                        </div>
                      </div>

                      {/* Bio Field */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaIdCard className="text-gray-600" size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Bio
                          </label>
                          {isEditing ? (
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              rows={4}
                              maxLength={200}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 text-gray-900 resize-none"
                              placeholder="Tell us about yourself..."
                            />
                          ) : (
                            <p className="text-gray-900 whitespace-pre-wrap">{formData.bio || 'Not set'}</p>
                          )}
                          {isEditing && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formData.bio?.length || 0}/200 characters
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-3 md:space-x-4">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-black text-white rounded font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200"
                    >
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-red-600 bg-white border border-red-300 rounded font-semibold hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                    >

                      <span>Delete Account</span>
                      <FaExclamationTriangle className="w-4 h-4 text-red-600" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-black text-white rounded font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isLoading ? (
                        <FaSpinner className="animate-spin" size={14} />
                      ) : (
                        ""
                      )}
                      <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete your account? This will permanently:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                <li>Delete your profile and all data</li>
                <li>Remove all your chat messages</li>
                <li>Delete all friend connections</li>
                <li>Remove your account permanently</li>
              </ul>

              {/* Warning Tips */}
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <FaExclamationTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Warning: This action is permanent</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>All your data will be permanently deleted</li>
                      <li>You will lose all chat history</li>
                      <li>This cannot be reversed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col md:flex-row md:space-x-3 gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Account</span>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCancelLogout}
        >
          <div
            className="bg-white rounded shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Logout
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to logout?
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700">
                You will be signed out of your account. Any unsaved changes may be lost.
              </p>

              {/* Warning Tips */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <FaExclamationTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Before you leave:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Make sure you've saved important conversations</li>
                      <li>You can always log back in anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <span>Yes, Logout</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile spacer */}
      <div className='lg:hidden h-16' />
    </>
  )
}

export default SideBar