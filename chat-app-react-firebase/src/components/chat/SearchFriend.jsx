// SearchFriend.jsx - Complete fixed version
import React, { useState, useEffect } from 'react'
import { searchUsersByEmailOrName } from '../../services/user'
import {
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    checkFriendshipStatus,
} from '../../services/friend'
import { createOrGetChat } from '../../services/chatService'
import useUserStore from '../../stores/useUserStore'
import { toast } from 'react-hot-toast'
import { FaSearch, FaUserPlus } from "react-icons/fa";

const SearchFriend = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [loadingStates, setLoadingStates] = useState({})
    const [debounceTimer, setDebounceTimer] = useState(null)
    const { user } = useUserStore()

    // Set loading state for specific user action
    const setUserLoading = (userId, isLoading) => {
        setLoadingStates(prev => ({
            ...prev,
            [userId]: isLoading
        }))
    }

    // Enhanced status checking with better error handling
    const getFriendshipStatus = async (userData) => {
        try {
            const statusResult = await checkFriendshipStatus(user.uid, userData.uid)

            if (statusResult.success && statusResult.status) {
                const status = statusResult.status;

                // Priority order: blocked > friend > request_received > request_sent > add
                if (status.isBlocked) {
                    return 'blocked';
                } else if (status.isFriend) {
                    return 'friend';
                } else if (status.requestReceived) {
                    return 'request_received';
                } else if (status.requestSent) {
                    return 'request_sent';
                } else {
                    return 'add';
                }
            }
            return 'add';
        } catch (error) {
            console.error('Error checking friendship status:', error)
            return 'add';
        }
    }

    // Refresh user status with enhanced validation
    const refreshUserStatus = async (userId) => {
        try {
            const userData = searchResults.find(u => u.uid === userId);
            if (userData) {
                const newStatus = await getFriendshipStatus(userData);
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: newStatus }
                            : u
                    )
                );
            }
        } catch (error) {
            console.error('Error refreshing user status:', error)
        }
    }

    // Debounced search function with enhanced status handling
    const handleSearch = async (term) => {
        setSearchTerm(term)

        if (term.trim() === '') {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)

        // Clear previous timer
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }

        // Set new timer for debounced search
        const timer = setTimeout(async () => {
            try {
                const result = await searchUsersByEmailOrName(term, user.uid)

                if (result.success) {
                    // Get friendship status for each user with enhanced error handling
                    const usersWithStatus = await Promise.all(
                        result.users.map(async (userData) => {
                            try {
                                const status = await getFriendshipStatus(userData);
                                return {
                                    ...userData,
                                    status: status,
                                    isOnline: userData.status === 'online',
                                    avatar: userData.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                                }
                            } catch (error) {
                                console.error('Error checking friendship status:', error)
                                return {
                                    ...userData,
                                    status: 'add',
                                    isOnline: userData.status === 'online',
                                    avatar: userData.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                                }
                            }
                        })
                    )
                    setSearchResults(usersWithStatus)
                } else {
                    toast.error('Failed to search users')
                    setSearchResults([])
                }
            } catch (error) {
                console.error('Search error:', error)
                toast.error('Error searching users')
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 500)

        setDebounceTimer(timer)
    }

    // Handle start chat
    const handleStartChat = async (userData) => {
        setUserLoading(userData.uid, true)
        try {
            const chatResult = await createOrGetChat(user.uid, userData.uid)

            if (chatResult) {
                const chatData = {
                    id: chatResult.id,
                    otherParticipant: {
                        uid: userData.uid,
                        name: userData.fullName || userData.displayName || 'Unknown User',
                        profilePic: userData.profilePic,
                        isOnline: userData.isOnline,
                        lastSeen: userData.lastSeen
                    },
                    name: userData.fullName || userData.displayName || 'Unknown User',
                    lastMessage: chatResult.lastMessage || 'Start a conversation',
                    lastMessageAt: chatResult.lastMessageAt || new Date(),
                    participantsArray: [user.uid, userData.uid],
                    participants: {
                        [user.uid]: true,
                        [userData.uid]: true
                    },
                    isGroup: false
                }

                if (window.chatSelectCallback) {
                    window.chatSelectCallback(chatData)
                    toast.success(`Started chat with ${userData.fullName}`)
                } else {
                    toast.error('Chat selection not available')
                }
            } else {
                toast.error('Failed to start chat')
            }
        } catch (error) {
            console.error('Error starting chat:', error)
            toast.error('Failed to start chat')
        } finally {
            setUserLoading(userData.uid, false)
        }
    }

    const handleAddFriend = async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await sendFriendRequest(user.uid, userId)

            if (result.success) {
                // Update status immediately for better UX
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "request_sent" }
                            : u
                    )
                )

                // Refresh status after delay to ensure Firestore is updated
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                // Show specific error message
                if (result.error.includes('blocked')) {
                    toast.error('Cannot send friend request to blocked user')
                } else if (result.error.includes('already friends')) {
                    toast.error('You are already friends with this user')
                    // Refresh status to correct the UI
                    setTimeout(() => refreshUserStatus(userId), 1000)
                } else {
                    toast.error(result.error || 'Failed to send friend request')
                }
            }
        } catch (error) {
            console.error('Error adding friend:', error)
            toast.error('Failed to send friend request')
        } finally {
            setUserLoading(userId, false)
        }
    }

    const handleCancelRequest = async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await cancelFriendRequest(user.uid, userId)

            if (result.success) {
                // Update status immediately for better UX
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )

                // Refresh status after delay
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to cancel request')
                // Refresh status to correct the UI
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            console.error('Error canceling request:', error)
            toast.error('Failed to cancel request')
        } finally {
            setUserLoading(userId, false)
        }
    }

    const handleAcceptRequest = async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await acceptFriendRequest(user.uid, userId)

            if (result.success) {
                // Update status immediately for better UX
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "friend" }
                            : u
                    )
                )

                // Refresh status after delay
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to accept request')
                // Refresh status to correct the UI
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            console.error('Error accepting request:', error)
            toast.error('Failed to accept request')
        } finally {
            setUserLoading(userId, false)
        }
    }

    const handleDeclineRequest = async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await rejectFriendRequest(user.uid, userId)

            if (result.success) {
                // Update status immediately for better UX
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )

                // Refresh status after delay
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to decline request')
                // Refresh status to correct the UI
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            console.error('Error declining request:', error)
            toast.error('Failed to decline request')
        } finally {
            setUserLoading(userId, false)
        }
    }

    const handleUnfriend = async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await removeFriend(user.uid, userId)

            if (result.success) {
                // Update status immediately for better UX
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )

                // Refresh status after delay
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                // Handle specific error cases
                if (result.error.includes('not friends')) {
                    toast.error(`You are not friends with ${userName}`)
                    // Force refresh to correct the UI
                    setSearchResults(prev =>
                        prev.map(u =>
                            u.uid === userId
                                ? { ...u, status: "add" }
                                : u
                        )
                    )
                } else {
                    toast.error(result.error || 'Failed to remove friend')
                }
                // Refresh status to correct the UI
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            console.error('Error unfriending:', error)
            toast.error('Failed to remove friend')
        } finally {
            setUserLoading(userId, false)
        }
    }

    const handleUnblock = async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await unblockUser(user.uid, userId)

            if (result.success) {
                // Update status immediately for better UX
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )

                toast.success(`Unblocked ${userName}`)

                // Refresh status after delay
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to unblock user')
            }
        } catch (error) {
            console.error('Error unblocking user:', error)
            toast.error('Failed to unblock user')
        } finally {
            setUserLoading(userId, false)
        }
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer)
            }
        }
    }, [debounceTimer])

    // Get action buttons based on user status
    function getActionButtons(userData) {
        const isLoading = loadingStates[userData.uid]

        switch (userData.status) {
            case "add":
                return (
                    <button
                        onClick={() => handleAddFriend(userData.uid, userData.fullName)}
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
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <FaUserPlus className='w-4 h-4' />
                                <span>Add Friend</span>
                            </>
                        )}
                    </button>
                )

            case "request_sent":
                return (
                    <button
                        onClick={() => handleCancelRequest(userData.uid, userData.fullName)}
                        disabled={isLoading}
                        className={`
                            px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm
                            ${isLoading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-sm hover:shadow-md'
                            }
                        `}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Canceling...</span>
                            </div>
                        ) : (
                            'Cancel Request'
                        )}
                    </button>
                )

            case "request_received":
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleAcceptRequest(userData.uid, userData.fullName)}
                            disabled={isLoading}
                            className={`
                                px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm flex-1
                                ${isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm hover:shadow-md'
                                }
                            `}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Accepting...</span>
                                </div>
                            ) : (
                                'Accept'
                            )}
                        </button>
                        <button
                            onClick={() => handleDeclineRequest(userData.uid, userData.fullName)}
                            disabled={isLoading}
                            className={`
                                px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm flex-1
                                ${isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-sm hover:shadow-md'
                                }
                            `}
                        >
                            {isLoading ? '...' : 'Decline'}
                        </button>
                    </div>
                )

            case "friend":
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleStartChat(userData)}
                            disabled={isLoading}
                            className={`
                                px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm
                                ${isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md transform hover:scale-105'
                                }
                            `}
                        >
                            {isLoading ? 'Starting...' : 'Message'}
                        </button>
                        <button
                            onClick={() => handleUnfriend(userData.uid, userData.fullName)}
                            disabled={isLoading}
                            className={`
                                flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                                ${isLoading
                                    ? 'bg-red-200 text-red-400 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md transform hover:scale-105'
                                }
                            `}
                        >
                            <span>Unfriend</span>
                        </button>
                    </div>
                )

            case "blocked":
                return (
                    <button
                        onClick={() => handleUnblock(userData.uid, userData.fullName)}
                        disabled={isLoading}
                        className={`
                            px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm
                            ${isLoading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-sm hover:shadow-md'
                            }
                        `}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Unblocking...</span>
                            </div>
                        ) : (
                            'Unblock'
                        )}
                    </button>
                )

            default:
                return (
                    <button
                        onClick={() => handleAddFriend(userData.uid, userData.fullName)}
                        disabled={isLoading}
                        className={`
                            flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                            ${isLoading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                            }
                        `}
                    >
                        <span>Add Friend</span>
                    </button>
                )
        }
    }

    // Get avatar content
    const getAvatarContent = (userData) => {
        if (userData.profilePic) {
            return (
                <img
                    src={userData.profilePic}
                    alt={userData.fullName}
                    className="w-14 h-14 rounded-full object-cover shadow-sm"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
                    }}
                />
            )
        }
        return (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600 shadow-sm">
                <span className="text-white text-sm font-bold">
                    {userData.avatar}
                </span>
            </div>
        )
    }

    return (
        <div className='flex flex-col h-full bg-white'>
            {/* Header */}
            <div className='p-6 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50/50'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Search Friends</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Find and connect with people
                        </p>
                    </div>
                    <button
                        onClick={() => handleSearch(searchTerm)}
                        disabled={isSearching}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <svg className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Search Bar */}
                <div className='relative'>
                    <div className='absolute z-40 inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FaSearch className='h-4 w-4 text-gray-400' />
                    </div>
                    <input
                        type='text'
                        placeholder='Search by name or email...'
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => handleSearch('')}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-600 hover:text-gray-800 transition-colors duration-200'
                        >
                            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>
                    {/* Results Header */}
                    {searchTerm && (
                        <div className='flex items-center justify-between mb-6'>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800'>
                                    Search Results
                                </h3>
                                <p className='text-sm text-gray-500 mt-1'>
                                    {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                            <span className='text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium'>
                                {searchResults.length} results
                            </span>
                        </div>
                    )}

                    {/* Search States */}
                    {!searchTerm ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                <FaSearch className='w-10 h-10 text-gray-500' />
                            </div>
                            <h4 className='text-xl font-bold text-gray-700 mb-3 text-center'>
                                Find Friends
                            </h4>
                            <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6 text-center'>
                                Search for friends by their name or email to connect and start chatting
                            </p>
                        </div>
                    ) : isSearching ? (
                        <div className='space-y-4'>
                            {[1, 2, 3, 4].map((skeleton) => (
                                <div key={skeleton} className='flex items-center space-x-4 p-4 animate-pulse bg-gray-50 rounded-2xl'>
                                    <div className='w-14 h-14 bg-gray-200 rounded-full'></div>
                                    <div className='flex-1 space-y-3'>
                                        <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                        <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                                        <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                                    </div>
                                    <div className='w-20 h-9 bg-gray-200 rounded-lg'></div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                No users found
                            </h4>
                            <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6'>
                                Try searching with a different name or email address
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className='duration-200 w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md transition-all hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {searchResults.map((userData) => {
                                const isLoading = loadingStates[userData.uid]

                                return (
                                    <div
                                        key={userData.uid}
                                        className='p-5 rounded-md border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 backdrop-blur-sm'
                                    >
                                        <div className='flex flex-col gap-3'>
                                            <div className='flex items-center space-x-4 flex-1 min-w-0'>
                                                {/* Avatar */}
                                                <div className='relative flex-shrink-0'>
                                                    {getAvatarContent(userData)}
                                                    {/* Online status indicator */}
                                                    {userData.isOnline && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center justify-between mb-2'>
                                                        <h4 className='text-lg font-semibold text-gray-800 truncate'>
                                                            {userData.fullName}
                                                        </h4>
                                                        {userData.isOnline && (
                                                            <span className="text-xs font-medium text-green-500 animate-pulse">
                                                                Online
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className='text-sm text-gray-500 mb-2 truncate'>
                                                        {userData.email}
                                                    </p>
                                                    <p className='text-xs text-gray-400'>
                                                        {userData.bio || 'No bio available'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className='flex justify-end space-x-4 flex-shrink-0'>
                                                {getActionButtons(userData)}
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

export default SearchFriend