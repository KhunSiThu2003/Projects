// ChatList.jsx - Updated to use realtime store chats
import React, { useState, useEffect, useCallback } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import { toast } from 'react-hot-toast'
import { FaComments, FaSearch } from "react-icons/fa"

const ChatList = ({ onSelectChat, handleSetActiveView }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredChats, setFilteredChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useUserStore()
    const { friends, chats, subscribeToAllData } = useRealtimeStore()

    // Format timestamp
    const formatTimestamp = useCallback((timestamp) => {
        if (!timestamp) return 'Just now'

        try {
            const now = new Date()
            const messageDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            const diffMs = now - messageDate
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)

            if (diffMins < 1) return 'Just now'
            if (diffMins < 60) return `${diffMins}m ago`
            if (diffHours < 24) return `${diffHours}h ago`
            if (diffDays === 1) return 'Yesterday'
            if (diffDays < 7) return `${diffDays}d ago`

            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        } catch (error) {
            return 'Recently'
        }
    }, [])

    // Process chat data from realtime store
    const processChatData = useCallback(async (chat) => {
        try {
            // For individual chats only, find the other participant
            const otherParticipantId = chat.participantsArray?.find(id => id !== user.uid)
            if (!otherParticipantId) {
                return null
            }

            // Check if the other participant is in friends list from realtime store
            const isFriend = friends.some(friend => friend.uid === otherParticipantId)
            if (!isFriend) {
                return null
            }

            // Get other participant's details
            let otherParticipant = null
            let chatName = 'Unknown User'

            try {
                // Try to find friend in realtime store first
                const friendFromStore = friends.find(friend => friend.uid === otherParticipantId)
                if (friendFromStore) {
                    otherParticipant = {
                        uid: otherParticipantId,
                        name: friendFromStore.fullName || 'Unknown User',
                        avatar: friendFromStore.fullName ?
                            friendFromStore.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
                        profilePic: friendFromStore.profilePic,
                        isOnline: friendFromStore.status === 'online',
                        lastSeen: friendFromStore.lastSeen
                    }
                    chatName = friendFromStore.fullName || 'Unknown User'
                } else {
                    // Fallback to Firestore query
                    const userDocRef = doc(db, "users", otherParticipantId)
                    const userDoc = await getDoc(userDocRef)
                    if (userDoc.exists()) {
                        const userData = userDoc.data()
                        otherParticipant = {
                            uid: otherParticipantId,
                            name: userData.fullName || 'Unknown User',
                            avatar: userData.fullName ?
                                userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
                            profilePic: userData.profilePic,
                            isOnline: userData.status === 'online',
                            lastSeen: userData.lastSeen
                        }
                        chatName = userData.fullName || 'Unknown User'
                    } else {
                        return null
                    }
                }
            } catch (userError) {
                console.error('Error fetching user:', userError)
                return null
            }

            const processedChat = {
                id: chat.id,
                ...chat,
                otherParticipant,
                name: chatName,
                lastMessage: chat.lastMessage || 'No messages yet',
                time: formatTimestamp(chat.lastMessageAt || chat.lastUpdated),
                unread: chat.unreadCount?.[user.uid] || 0
            }

            return processedChat
        } catch (error) {
            console.error('Error processing chat:', error)
            return null
        }
    }, [user?.uid, formatTimestamp, friends])

    // Process chats when chats or friends change
    const [processedChats, setProcessedChats] = useState([])

    useEffect(() => {
        const processChats = async () => {
            if (!user?.uid || chats.length === 0) {
                setProcessedChats([])
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const processed = []
                for (const chat of chats) {
                    const processedChat = await processChatData(chat)
                    if (processedChat) {
                        processed.push(processedChat)
                    }
                }

                // Sort by last message time
                const sortedChats = processed.sort((a, b) => {
                    const timeA = a.lastMessageAt?.toDate?.() || a.lastUpdated?.toDate?.() || new Date(0)
                    const timeB = b.lastMessageAt?.toDate?.() || b.lastUpdated?.toDate?.() || new Date(0)
                    return timeB - timeA
                })

                setProcessedChats(sortedChats)
            } catch (error) {
                console.error('Error processing chats:', error)
                toast.error('Error loading conversations')
            } finally {
                setLoading(false)
            }
        }

        processChats()
    }, [chats, user?.uid, processChatData])

    // Search filter
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredChats(processedChats)
        } else {
            const searchLower = searchTerm.toLowerCase()
            const filtered = processedChats.filter(chat => {
                const chatName = chat.name?.toLowerCase() || ''
                const lastMessage = chat.lastMessage?.toLowerCase() || ''
                const otherParticipantName = chat.otherParticipant?.name?.toLowerCase() || ''
                
                return chatName.includes(searchLower) || 
                       lastMessage.includes(searchLower) ||
                       otherParticipantName.includes(searchLower)
            })
            setFilteredChats(filtered)
        }
    }, [searchTerm, processedChats])

    // Handle chat click
    const handleChatClick = useCallback((chat) => {
        setActiveChat(chat.id)
        if (onSelectChat) {
            onSelectChat(chat)
        }
    }, [onSelectChat])

    // Handle new conversation
    const handleNewConversation = useCallback(() => {
        toast.success('Add friends first to start conversations!')
    }, [])

    // Refresh chats list
    const handleRefresh = useCallback(() => {
        toast.success('Refreshing conversations...')
    }, [])

    // Setup realtime subscriptions
    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToAllData(user.uid)
            return unsubscribe
        }
    }, [user?.uid, subscribeToAllData])

    const getAvatarContent = useCallback((chat) => {
        if (chat.otherParticipant?.profilePic) {
            return (
                <img
                    src={chat.otherParticipant.profilePic}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                    }}
                />
            )
        }
        return (
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-800">
                <span className="text-white text-sm font-bold">
                    {chat.otherParticipant?.avatar || 'U'}
                </span>
            </div>
        )
    }, [])

    const getLastMessage = useCallback((chat) => {
        if (!chat.lastMessage || chat.lastMessage === 'No messages yet') {
            return 'Start a conversation'
        }

        if (chat.lastMessage.length > 60) {
            return chat.lastMessage.substring(0, 60) + '...'
        }
        return chat.lastMessage
    }, [])

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value)
    }

    // Clear search
    const handleClearSearch = () => {
        setSearchTerm('')
    }

    return (
        <div className='flex flex-col h-full bg-white'>
            {/* Header */}
            <div className='p-6 border-b border-gray-100'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Messages</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Conversations with your friends
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
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FaSearch className='h-4 w-4 text-gray-400' />
                    </div>
                    <input
                        type='text'
                        placeholder='Search conversations...'
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg'
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-600 hover:text-gray-600 transition-colors duration-200'
                        >
                            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Chats List */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <h3 className='text-xl font-bold text-gray-800'>
                                Friend Conversations
                            </h3>
                            <p className='text-sm text-gray-500 mt-1'>
                                {processedChats.length} chat{processedChats.length !== 1 ? 's' : ''} with friends • {' '}
                                {processedChats.filter(chat => chat.otherParticipant?.isOnline).length} online
                            </p>
                        </div>
                        <span className='text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium'>
                            {filteredChats.length} shown
                        </span>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className='space-y-4'>
                            {[1, 2, 3, 4, 5].map((skeleton) => (
                                <div key={skeleton} className='flex items-center space-x-4 p-4 animate-pulse bg-gray-50 rounded-2xl'>
                                    <div className='w-12 h-12 bg-gray-200 rounded-full'></div>
                                    <div className='flex-1 space-y-2'>
                                        <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                        <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                                        <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className='text-center py-16'>
                            {searchTerm ? (
                                <>
                                    <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                                        <FaSearch className='w-10 h-10 text-gray-500' />
                                    </div>

                                    <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                        No conversations found
                                    </h4>
                                    <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6'>
                                        Try adjusting your search terms
                                    </p>
                                    <button
                                        onClick={handleClearSearch}
                                        className='duration-200 w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md transition-all hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                                    >
                                        Clear Search
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                                        <FaComments className='w-10 h-10 text-gray-500' />
                                    </div>

                                    <h4 className='text-md font-bold text-gray-700 mb-3 text-center'>
                                        No conversations with friends yet
                                    </h4>

                                    <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6 text-center'>
                                        Add friends first to start conversations. Go to the "Friends" or "Search" tab to find and add friends.
                                    </p>

                                    <div className='flex flex-row gap-3 justify-center'>
                                        <button
                                            onClick={() => handleSetActiveView('friends')}
                                            className='w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                                        >
                                            Find Friends
                                        </button>
                                        <button
                                            onClick={() => handleSetActiveView('search')}
                                            className='w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                                        >
                                            Search Users
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => handleChatClick(chat)}
                                    className={`group p-4 rounded-md cursor-pointer transition-all duration-200 border ${
                                        activeChat === chat.id
                                        ? 'bg-blue-50 border-blue-200 shadow-lg scale-[1.02]'
                                        : 'border-gray-100 hover:bg-gray-50 hover:border-blue-100 hover:shadow-md'
                                    }`}
                                >
                                    <div className='flex items-start space-x-3'>
                                        {/* Avatar */}
                                        <div className='relative flex-shrink-0'>
                                            {getAvatarContent(chat)}

                                            {/* Unread Badge */}
                                            {chat.unread > 0 && (
                                                <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm'>
                                                    <span className='text-white text-xs font-bold'>
                                                        {chat.unread > 9 ? '9+' : chat.unread}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Info */}
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <h4 className='text-sm font-semibold text-gray-800 truncate'>
                                                    {chat.name}
                                                </h4>
                                                <div className='flex items-center space-x-2 flex-shrink-0 ml-2'>
                                                    <span className='text-xs text-gray-500'>
                                                        {chat.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className='text-sm text-gray-600 truncate leading-tight mb-1'>
                                                {getLastMessage(chat)}
                                            </p>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center space-x-2'>
                                                    {chat.otherParticipant?.isOnline && (
                                                        <span className='text-xs text-green-500 font-medium'>
                                                            Online
                                                        </span>
                                                    )}
                                                    {!chat.otherParticipant?.isOnline && (
                                                        <span className='text-xs text-gray-400'>
                                                            Offline
                                                        </span>
                                                    )}
                                                </div>
                                                {chat.unread > 0 && (
                                                    <span className='bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-medium'>
                                                        {chat.unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default React.memo(ChatList)