import React, { useState, useEffect } from 'react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { unblockUser } from '../../services/friend'
import useUserStore from '../../stores/useUserStore'
import { toast } from 'react-hot-toast'
import { FaLock, FaUserMinus, FaBan } from "react-icons/fa";

const BlockedList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [blockedUsers, setBlockedUsers] = useState([])
    const [filteredUsers, setFilteredUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const { user } = useUserStore()

    // Load blocked users from Firebase
    const loadBlockedUsers = async () => {
        try {
            setLoading(true)
            if (!user?.uid) {
                toast.error('User not found')
                return
            }

            const userRef = doc(db, "users", user.uid)
            const userDoc = await getDoc(userRef)

            if (!userDoc.exists()) {
                toast.error('User document not found')
                setBlockedUsers([])
                return
            }

            const userData = userDoc.data()
            const blockedUserIds = userData.blocked || []

            if (blockedUserIds.length === 0) {
                setBlockedUsers([])
                return
            }

            // Fetch details for each blocked user
            const blockedUsersPromises = blockedUserIds.map(async (blockedUserId) => {
                try {
                    const blockedUserRef = doc(db, "users", blockedUserId)
                    const blockedUserDoc = await getDoc(blockedUserRef)
                    
                    if (blockedUserDoc.exists()) {
                        const blockedUserData = blockedUserDoc.data()
                        return {
                            id: blockedUserId,
                            uid: blockedUserId,
                            name: blockedUserData.fullName || 'Unknown User',
                            username: `@${blockedUserData.email?.split('@')[0] || 'user'}`,
                            email: blockedUserData.email,
                            avatar: blockedUserData.fullName ? 
                                blockedUserData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
                            profilePic: blockedUserData.profilePic,
                            blockedDate: userData.blockedDates?.[blockedUserId] || new Date().toISOString().split('T')[0],
                            blockedReason: userData.blockedReasons?.[blockedUserId] || 'Not specified',
                            lastSeen: blockedUserData.lastSeen,
                            status: blockedUserData.status || 'offline'
                        }
                    }
                    return null
                } catch (error) {
                    console.error(`Error fetching blocked user ${blockedUserId}:`, error)
                    return null
                }
            })

            const blockedUsersData = await Promise.all(blockedUsersPromises)
            const validBlockedUsers = blockedUsersData.filter(user => user !== null)
            
            setBlockedUsers(validBlockedUsers)

        } catch (error) {
            console.error('Error loading blocked users:', error)
            toast.error('Failed to load blocked users')
            setBlockedUsers([])
        } finally {
            setLoading(false)
        }
    }

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
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.blockedReason?.toLowerCase().includes(searchTerm.toLowerCase())
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
                // Remove from local state immediately for better UX
                setBlockedUsers(prev => prev.filter(user => user.id !== userId))
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
            
            setBlockedUsers([])
            toast.success(`Unblocked ${successful.length} users`)
            
        } catch (error) {
            console.error('Error unblocking all users:', error)
            toast.error('Error unblocking all users')
        }
    }

    // Real-time listener for blocked users
    useEffect(() => {
        if (!user?.uid) return

        const userRef = doc(db, "users", user.uid)
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data()
                const blockedUserIds = userData.blocked || []
                
                // If blocked list changed, reload
                if (blockedUserIds.length !== blockedUsers.length) {
                    loadBlockedUsers()
                }
            }
        })

        return () => unsubscribe()
    }, [user?.uid])

    // Load blocked users on component mount
    useEffect(() => {
        loadBlockedUsers()
    }, [user?.uid])

    const getAvatarContent = (userData) => {
        if (userData.profilePic) {
            return (
                <img 
                    src={userData.profilePic} 
                    alt={userData.name}
                    className="w-14 h-14 rounded-full object-cover opacity-60"
                />
            )
        }
        return (
            <span className="text-white text-sm font-bold">
                {userData.avatar}
            </span>
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
                    <button
                        onClick={loadBlockedUsers}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
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
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg'
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
                    {blockedUsers.length > 0 && !loading && (
                        <div className='flex items-center justify-between mb-6'>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800'>
                                    Blocked Users ({blockedUsers.length})
                                </h3>
                                <p className='text-sm text-gray-500 mt-1'>
                                    These users cannot send you messages or friend requests
                                </p>
                            </div>
                           
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
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
                    ) : filteredUsers.length === 0 && blockedUsers.length === 0 ? (
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
                    ) : filteredUsers.length === 0 ? (
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
                            {filteredUsers.map((userData) => {
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
                                                    <div className='w-14 h-14 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center opacity-60'>
                                                        {getAvatarContent(userData)}
                                                    </div>
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
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                                                        <div className="flex items-center space-x-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>Blocked {formatBlockedDate(userData.blockedDate)}</span>
                                                        </div>
                                                        
                                                    </div>
                                                    
                                                    <p className="text-xs text-gray-500">
                                                        {reasonConfig.description}
                                                    </p>
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
        </div>
    )
}

export default BlockedList;