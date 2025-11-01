import React, { useState, useEffect } from 'react'
import { unblockUser } from '../../services/friend'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import { toast } from 'react-hot-toast'
import { FaLock, FaUserMinus, FaBan } from "react-icons/fa";

const BlockedList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredUsers, setFilteredUsers] = useState([])
    const [actionLoading, setActionLoading] = useState({})
    const { user } = useUserStore()
    const { 
        blockedUsers, 
        loading, 
        error,
        subscribeToAllData 
    } = useRealtimeStore()

    // Setup realtime subscriptions
    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToAllData(user.uid)
            return unsubscribe
        }
    }, [user?.uid, subscribeToAllData])

    // Format last interaction time
    const formatLastInteraction = (lastSeen) => {
        if (!lastSeen) return 'Long time ago'
        
        try {
            const now = new Date()
            const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen)
            const diffMs = now - lastSeenDate
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)

            if (diffMins < 1) return 'Just now'
            if (diffMins < 60) return `${diffMins}m ago`
            if (diffHours < 24) return `${diffHours}h ago`
            if (diffDays < 7) return `${diffDays}d ago`
            
            return lastSeenDate.toLocaleDateString()
        } catch (error) {
            return 'Unknown'
        }
    }

    // Format blocked date
    const formatBlockedDate = (dateString) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            })
        } catch (error) {
            return 'Unknown date'
        }
    }

    // Get reason color and icon
    const getReasonConfig = (reason) => {
        const configs = {
            'Spam messages': { 
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                icon: '📧',
                description: 'User was sending spam or promotional messages'
            },
            'Harassment': { 
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: '🚫',
                description: 'User was engaging in harassing behavior'
            },
            'Inappropriate content': { 
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: '🔞',
                description: 'User was sharing inappropriate content'
            },
            'Unknown contact': { 
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: '❓',
                description: 'User was not recognized or unknown'
            },
            'Not specified': {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: '🔒',
                description: 'User was blocked for unspecified reasons'
            }
        }
        return configs[reason] || configs['Not specified']
    }

    // Search filter
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(blockedUsers)
        } else {
            const filtered = blockedUsers.filter(user =>
                user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            setFilteredUsers(filtered)
        }
    }, [searchTerm, blockedUsers])

    // Set loading state for specific action
    const setUserActionLoading = (userId, isLoading) => {
        setActionLoading(prev => ({
            ...prev,
            [userId]: isLoading
        }))
    }

    // Handle unblock user
    const handleUnblock = async (userId, userName) => {
        setUserActionLoading(userId, true)
        try {
            const result = await unblockUser(user.uid, userId)
            if (result.success) {
                toast.success(`Unblocked ${userName}`)
            } else {
                toast.error(result.error || 'Failed to unblock user')
            }
        } catch (error) {
            console.error('Error unblocking user:', error)
            toast.error('Error unblocking user')
        } finally {
            setUserActionLoading(userId, false)
        }
    }

    // Handle unblock all
    const handleUnblockAll = async () => {
        if (blockedUsers.length === 0) return
        
        try {
            const promises = blockedUsers.map(user => 
                unblockUser(user.uid, user.id)
            )
            
            const results = await Promise.allSettled(promises)
            const successful = results.filter(result => 
                result.status === 'fulfilled' && result.value.success
            )
            
            toast.success(`Unblocked ${successful.length} users`)
            
        } catch (error) {
            console.error('Error unblocking all users:', error)
            toast.error('Error unblocking all users')
        }
    }

    // Format blocked users data from realtime store
    const formatBlockedUsers = () => {
        return blockedUsers.map(userData => ({
            ...userData,
            id: userData.uid,
            name: userData.fullName || 'Unknown User',
            username: `@${userData.email?.split('@')[0] || 'user'}`,
            avatar: userData.fullName ? 
                userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
            blockedDate: userData.blockedDate || new Date().toISOString().split('T')[0],
            blockedReason: userData.blockedReason || 'Not specified',
            isOnline: userData.status === 'online'
        }))
    }

    const formattedBlockedUsers = formatBlockedUsers()
    const displayedUsers = searchTerm ? filteredUsers : formattedBlockedUsers

    const getAvatarContent = (userData) => {
        if (userData.profilePic || userData.photoURL) {
            return (
                <img 
                    src={userData.profilePic || userData.photoURL}
                    alt={userData.name}
                    className="w-14 h-14 rounded-full object-cover opacity-60"
                    onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                    }}
                />
            )
        }
        return (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-gray-400 to-gray-600 opacity-60">
                <span className="text-white text-sm font-bold">
                    {userData.avatar}
                </span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Blocked Users</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600">Error loading blocked users</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col h-full bg-white'>
            {/* Header */}
            <div className='p-6 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50/50'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Blocked Users</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Manage users you've blocked from contacting you
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className='relative'>
                    <div className='absolute z-40 inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </div>
                    <input
                        type='text'
                        placeholder='Search blocked users...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600 transition-colors duration-200'
                        >
                            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Blocked Users List */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>
                    {/* Stats Header */}
                    {formattedBlockedUsers.length > 0 && !loading && (
                        <div className='flex items-center justify-between mb-6'>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800'>
                                    Blocked Users ({formattedBlockedUsers.length})
                                </h3>
                                <p className='text-sm text-gray-500 mt-1'>
                                    These users cannot send you messages or friend requests
                                </p>
                            </div>
                            {formattedBlockedUsers.length > 1 && (
                                <button
                                    onClick={handleUnblockAll}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-all duration-200"
                                >
                                    Unblock All
                                </button>
                            )}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && formattedBlockedUsers.length === 0 ? (
                        <div className='space-y-4'>
                            {[1, 2, 3].map((skeleton) => (
                                <div key={skeleton} className='p-5 rounded-md border border-gray-100 bg-gray-50 animate-pulse'>
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-start space-x-4 flex-1'>
                                            <div className='w-14 h-14 bg-gray-200 rounded-full'></div>
                                            <div className='flex-1 space-y-3'>
                                                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                                <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                                                <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                                            </div>
                                        </div>
                                        <div className='w-24 h-9 bg-gray-200 rounded-lg'></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : displayedUsers.length === 0 && formattedBlockedUsers.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                <FaLock className='w-10 h-10 text-gray-500' />
                            </div>

                            <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                No Blocked Users
                            </h4>
                            <p className='text-gray-500 text-sm max-w-md mx-auto mb-6'>
                                Users you block won't be able to send you messages or friend requests. 
                                You can unblock them at any time from this list.
                            </p>
                        </div>
                    ) : displayedUsers.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                No users found
                            </h4>
                            <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6'>
                                Try adjusting your search terms
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className='px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-md transition-all duration-200 hover:bg-black hover:text-white hover:border-gray-300 font-medium'
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {displayedUsers.map((userData) => {
                                const isLoading = actionLoading[userData.id]
                                const reasonConfig = getReasonConfig(userData.blockedReason)
                                
                                return (
                                    <div
                                        key={userData.id}
                                        className='p-5 rounded-md border border-gray-100 bg-white hover:border-red-200 hover:shadow-lg transition-all duration-300 backdrop-blur-sm'
                                    >
                                        <div className='flex flex-col gap-3'>
                                            <div className='flex items-center space-x-4 flex-1 min-w-0'>
                                                {/* Avatar */}
                                                <div className='relative flex-shrink-0'>
                                                    {getAvatarContent(userData)}
                                                    <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm'>
                                                        <FaBan className='w-3 h-3 text-white' />
                                                    </div>
                                                </div>

                                                {/* User Info */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center justify-between mb-2'>
                                                        <div>
                                                            <h4 className='text-lg font-semibold text-gray-800'>
                                                                {userData.name}
                                                            </h4>
                                                            <p className='text-sm text-gray-500'>
                                                                {userData.email}
                                                            </p>
                                                        </div>
                                                        {userData.isOnline && (
                                                            <span className="text-xs font-medium text-green-500 animate-pulse">
                                                                Online
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                                                        <div className="flex items-center space-x-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>Blocked {formatBlockedDate(userData.blockedDate)}</span>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs border ${reasonConfig.color}`}>
                                                            {reasonConfig.icon} {userData.blockedReason}
                                                        </span>
                                                    </div>
                                                    
                                                    {userData.bio && userData.bio !== "Hey there! I'm using ChatApp 💬" && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {userData.bio}
                                                        </p>
                                                    )}
                                                    {userData.lastSeen && !userData.isOnline && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Last seen: {formatLastInteraction(userData.lastSeen)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unblock Button */}
                                            <div className='flex justify-end'>
                                                <button
                                                    onClick={() => handleUnblock(userData.id, userData.name)}
                                                    disabled={isLoading}
                                                    className={`
                                                        flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                                                        ${isLoading 
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                            : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                                                        }
                                                    `}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            <span>Unblocking...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Unblock</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading indicator for updates */}
            {loading && formattedBlockedUsers.length > 0 && (
                <div className="p-3 text-center border-t border-gray-200 bg-blue-50">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Updating blocked users...</p>
                </div>
            )}
        </div>
    )
}

export default BlockedList