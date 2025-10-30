// UserProfileModal.jsx - Updated with enhanced UI and all user data
import React, { useState, useRef } from 'react'
import { updateUserProfile } from '../../services/user'
import useUserStore from '../../stores/useUserStore'
import { toast } from 'react-hot-toast'
import { 
  FaCamera, 
  FaTimes, 
  FaUserEdit, 
  FaSave, 
  FaEnvelope, 
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaUserFriends,
  FaCog,
  FaImage,
  FaEdit
} from "react-icons/fa"

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    profilePic: user?.profilePic || ''
  })

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not available'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Not available'
    }
  }

  // Handle image selection and convert to base64
  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target.result
        setImagePreview(base64String)
        setFormData(prev => ({
          ...prev,
          profilePic: base64String
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData(prev => ({
      ...prev,
      profilePic: user?.profilePic || ''
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    setLoading(true)
    try {
      const result = await updateUserProfile(user.uid, {
        fullName: formData.fullName.trim(),
        bio: formData.bio.trim(),
        profilePic: formData.profilePic
      })

      if (result.success) {
        setUser({
          ...user,
          fullName: formData.fullName.trim(),
          bio: formData.bio.trim(),
          profilePic: formData.profilePic
        })
        
        toast.success('Profile updated successfully')
        setIsEditing(false)
        setImagePreview(null)
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      fullName: user?.fullName || '',
      bio: user?.bio || '',
      profilePic: user?.profilePic || ''
    })
    setImagePreview(null)
    setIsEditing(false)
    setActiveTab('profile')
    onClose()
  }

  // Handle background click to close modal
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Get status color and text
  const getStatusInfo = () => {
    switch (user?.status) {
      case 'online':
        return { color: 'bg-green-500', text: 'Online' }
      case 'away':
        return { color: 'bg-yellow-500', text: 'Away' }
      case 'offline':
        return { color: 'bg-gray-500', text: 'Offline' }
      default:
        return { color: 'bg-gray-500', text: 'Offline' }
    }
  }

  const statusInfo = getStatusInfo()

  // Get avatar content
  const getAvatarContent = (size = 'lg') => {
    const displayImage = imagePreview || formData.profilePic || user?.profilePic
    const sizeClasses = {
      sm: 'w-16 h-16 text-lg',
      md: 'w-20 h-20 text-xl',
      lg: 'w-32 h-32 text-2xl'
    }
    
    if (displayImage) {
      return (
        <img 
          src={displayImage} 
          alt={formData.fullName || user?.fullName || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover border-4 border-white shadow-lg`}
        />
      )
    }
    
    const avatarText = (formData.fullName || user?.fullName || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg`}>
        <span className="font-bold">{avatarText}</span>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div id="user-profile-modal"
      className="fixed inset-0  bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-md max-w-4xl w-full  overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-black p-6 text-white">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {getAvatarContent('lg')}
              
             
              {/* Edit Photo Button */}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 group left-0 right-0 text-white px-4 py-2 rounded-full shadow-lg hover:bg-black/60  transition-colors flex items-center space-x-2 text-sm w-32 h-32 justify-center"
                >
                  <FaCamera className="w-8 h-8 hidden group-hover:block" />
                </button>
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-2xl font-bold">
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Enter your name"
                    />
                  ) : (
                    formData.fullName || user?.fullName || 'User'
                  )}
                </h3>
                {user?.isVerified && (
                  <FaCheckCircle className="w-5 h-5 text-blue-300" title="Verified" />
                )}
              </div>
              <p className="text-blue-100 text-sm">
                {user?.email}
              </p>
            </div>
          </div>

          {/* File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile' 
                   ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUserEdit className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center space-x-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'account' 
                  ? 'border-black text-black' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaCog className="w-4 h-4" />
              <span>Account Info</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Bio Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  About
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                    {formData.bio || "Hey there! I'm using ChatApp 💬"}
                  </p>
                )}
              </div>

              {/* Remove Image Button */}
              {isEditing && imagePreview && (
                <div className="flex justify-center">
                  <button
                    onClick={handleRemoveImage}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                    <span>Remove New Photo</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Account Details</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaEnvelope className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaCheckCircle className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Verification</p>
                      <p className="text-sm text-gray-600">
                        {user?.isVerified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaUserFriends className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">User ID</p>
                      <p className="text-sm text-gray-600 font-mono truncate">{user?.uid}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Activity</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Member Since</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(user?.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FaClock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(user?.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Status</p>
                      <p className="text-sm text-gray-600 capitalize">{user?.status || 'offline'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{user?.friends?.length || 0}</p>
                    <p className="text-sm text-gray-600">Friends</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{user?.sentRequests?.length || 0}</p>
                    <p className="text-sm text-gray-600">Sent Requests</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{user?.receivedRequests?.length || 0}</p>
                    <p className="text-sm text-gray-600">Received Requests</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{user?.blocked?.length || 0}</p>
                    <p className="text-sm text-gray-600">Blocked Users</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FaSave className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      fullName: user?.fullName || '',
                      bio: user?.bio || '',
                      profilePic: user?.profilePic || ''
                    })
                    setImagePreview(null)
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal