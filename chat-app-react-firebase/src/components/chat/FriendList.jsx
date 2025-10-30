import React, { useState, useEffect } from 'react'
import { getFriendsList, removeFriend, getOrCreateChatRoom } from '../../services/friend'
import useUserStore from '../../stores/useUserStore'
import { toast } from 'react-hot-toast'
import { FaUserFriends, FaUserMinus, FaComments } from "react-icons/fa";


const FriendList = ({ onSelectChat, handleSetActiveView }) => {
    const [friends, setFriends] = useState([])
    const [filteredFriends, setFilteredFriends] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const { user } = useUserStore()

    // Load friends list
    const loadFriends = async () => {
        try {
            setLoading(true)
            const result = await getFriendsList(user.uid)

            if (result.success) {
                const friendsWithStatus = result.friends.map(friend => ({
                    ...friend,
                    active: friend.status === 'online',
                    lastSeen: formatLastSeen(friend.lastSeen),
                    avatar: friend.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                }))

                setFriends(friendsWithStatus)
                setFilteredFriends(friendsWithStatus)
            } else {
                toast.error('Failed to load friends')
                setFriends([])
                setFilteredFriends([])
            }
        } catch (error) {
            console.error('Error loading friends:', error)
            toast.error('Error loading friends list')
            setFriends([])
            setFilteredFriends([])
        } finally {
            setLoading(false)
        }
    }

    // Format last seen time
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Long time ago'

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
    }

    // Search filter
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredFriends(friends)
        } else {
            const filtered = friends.filter(friend =>
                friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                friend.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                friend.bio?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredFriends(filtered)
        }
    }, [searchTerm, friends])

    // Load friends on component mount
    useEffect(() => {
        if (user?.uid) {
            loadFriends()
        }
    }, [user?.uid])

    // Set loading state for specific action
    const setUserActionLoading = (userId, isLoading) => {
        setActionLoading(prev => ({
            ...prev,
            [userId]: isLoading
        }))
    }

    // Handle remove friend
    const handleRemoveFriend = async (friendId, friendName) => {
        setUserActionLoading(friendId, true)
        try {
            const result = await removeFriend(user.uid, friendId)
            if (result.success) {
                setFriends(prev => prev.filter(friend => friend.uid !== friendId))
                toast.success(`Removed ${friendName} from friends`)
            }
        } catch (error) {
            console.error('Error removing friend:', error)
        } finally {
            setUserActionLoading(friendId, false)
        }
    }

    // Handle start chat
    const handleStartChat = async (friend) => {
        setUserActionLoading(friend.uid, true)
        try {
            const chatResult = await getOrCreateChatRoom(user.uid, friend.uid)
            if (chatResult.success) {
                const chatData = {
                    id: chatResult.chatId,
                    otherParticipant: {
                        uid: friend.uid,
                        name: friend.fullName,
                        isOnline: friend.active
                    },
                    lastMessage: "Start a conversation",
                    lastMessageAt: new Date(),
                    participants: [user.uid, friend.uid],
                    isGroup: false
                }

                if (onSelectChat) {
                    onSelectChat(chatData)
                }
            }
        } catch (error) {
            console.error('Error starting chat:', error)
            toast.error('Failed to start chat')
        } finally {
            setUserActionLoading(friend.uid, false)
        }
    }

    // Get avatar content
    const getAvatarContent = (friend) => {
        if (friend.profilePic) {
            return (
                <img
                    src={friend.profilePic}
                    alt={friend.fullName}
                    className="w-14 h-14 rounded-full object-cover shadow-sm"
                />
            )
        }
        return (
            <span className="text-white text-sm font-bold">
                {friend.avatar}
            </span>
        )
    }

    // Refresh friends list
    const handleRefresh = () => {
        loadFriends()
    }

    return (
        <div className='flex flex-col h-full bg-white'>
            {/* Header */}
            <div className='p-6 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50/50'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Friends</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Connect and chat with your friends
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
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
                        placeholder='Search friend conversations...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-600 hover:text-gray-600 transition-colors duration-200'
                        >
                            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Friends List */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>
                    {/* Stats Header */}
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>
                                Your Friends
                            </h3>
                            <p className='text-sm text-gray-500 mt-1'>
                                {friends.length} friend{friends.length !== 1 ? 's' : ''} • {' '}
                                {friends.filter(f => f.active).length} online
                            </p>
                        </div>
                        <span className='text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium'>
                            {filteredFriends.length} shown
                        </span>
                    </div>

                    {/* Loading State */}
                    {loading ? (
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
                    ) : filteredFriends.length === 0 ? (
                        <div className='text-center py-16'>
                            {searchTerm ? (
                                <>

                                    <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                        <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                    </div>

                                    <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                        No friends found
                                    </h4>
                                    <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6'>
                                        Try adjusting your search terms
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className=' duration-200 w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md  transition-all hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium '
                                    >
                                        Clear Search
                                    </button>
                                </>
                            ) : (

                                <>
                                    {/* Icon / Illustration */}
                                    <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                        <FaUserFriends className='w-10 h-10 text-gray-500' />
                                    </div>

                                    {/* Heading */}
                                    <h4 className='text-xl font-bold text-gray-700 mb-3 text-center'>
                                        No friends yet
                                    </h4>

                                    {/* Description */}
                                    <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6 text-center'>
                                        Start adding friends to see them here. You can search for users and send them friend requests.
                                    </p>

                                    {/* Action Button */}
                                    <div className='flex justify-center'>
                                        <button
                                            onClick={() => handleSetActiveView('search')}
                                            className=' px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                                        >
                                            Search Friends
                                        </button>
                                    </div>
                                </>


                            )}
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {filteredFriends.map((friend) => {
                                const isLoading = actionLoading[friend.uid]

                                return (
                                    <div
                                        key={friend.uid}
                                        className=' p-5 rounded-md border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 backdrop-blur-sm'
                                    >
                                        <div className='flex flex-col gap-3'>
                                            <div className='flex items-center space-x-4 flex-1 min-w-0'>
                                                {/* Avatar */}
                                                <div className='relative flex-shrink-0'>
                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm  transition-all duration-300`}>
                                                        {getAvatarContent(friend)}
                                                    </div>

                                                </div>

                                                {/* Friend Info */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className=''>
                                                        <h4 className='text-lg font-semibold text-gray-800 truncate'>
                                                            {friend.fullName}
                                                        </h4>
                                                        {friend.active && (
                                                            <span className="absolute top-2 right-2 text-xs font-medium text-green-500 animate-pulse">
                                                                Online
                                                            </span>
                                                        )}

                                                    </div>
                                                    <p className='text-sm text-gray-500 mb-2 truncate'>
                                                        {friend.email}
                                                    </p>

                                                </div>
                                            </div>


                                            {/* Action Buttons */}
                                            <div className='flex justify-end space-x-4 flex-shrink-0'>

                                                {/* Unfriend Button */}
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => handleRemoveFriend(friend.uid, friend.fullName)}
                                                    className={`
      flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
      ${isLoading
                                                            ? 'bg-red-200 text-red-400 cursor-not-allowed'
                                                            : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md transform hover:scale-105'
                                                        }
    `}
                                                >
                                                    <FaUserMinus className='w-4 h-4' />
                                                    <span>Unfriend</span>
                                                </button>

                                                {/* Chat Button */}
                                                <button
                                                    onClick={() => handleStartChat(friend)}
                                                    disabled={isLoading}
                                                    className={`
      flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
      ${isLoading
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md transform hover:scale-105'
                                                        }
    `}
                                                >
                                                    <FaComments className='w-4 h-4' />
                                                    <span>{isLoading ? 'Starting...' : 'Chat'}</span>
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

export default FriendList