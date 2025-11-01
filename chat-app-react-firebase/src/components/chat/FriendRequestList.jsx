import React, { useState, useEffect } from 'react'
import { getOrCreateChatRoom, blockUser,cancelFriendRequest,rejectFriendRequest, acceptFriendRequest } from '../../services/friend'
import { createOrGetChat } from '../../services/chatService'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import { toast } from 'react-hot-toast'
import { FaInbox, FaPaperPlane, FaUserMinus, FaBan } from "react-icons/fa";

const FriendRequestList = ({ handleSetActiveView, onSelectChat }) => {
    const [activeTab, setActiveTab] = useState('received')
    const [actionLoading, setActionLoading] = useState({})
    const { user } = useUserStore()
    const { 
        friendRequests, 
        receivedFriendRequests, 
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

    // Format timestamp
    const formatTimestamp = (lastSeen) => {
        if (!lastSeen) return 'Recently'

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
            return 'Recently'
        }
    }

    // Set loading state for specific action
    const setRequestLoading = (requestId, isLoading) => {
        setActionLoading(prev => ({
            ...prev,
            [requestId]: isLoading
        }))
    }

    // Handle accept request and start chat
    const handleMessageAfterAccept = async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            // First accept the request
            const acceptResult = await acceptFriendRequest(user.uid, requestId)
            if (acceptResult.success) {
                // Then create chat room
                const chatResult = await getOrCreateChatRoom(user.uid, requestId)
                if (chatResult.success) {
                    // Create chat data and trigger navigation
                    const chatData = {
                        id: chatResult.chatId,
                        otherParticipant: {
                            uid: requestId,
                            name: requestName,
                            isOnline: true
                        },
                        lastMessage: "You are now friends! Start chatting",
                        lastMessageAt: new Date(),
                        participants: [user.uid, requestId],
                        isGroup: false
                    }

                    if (onSelectChat) {
                        onSelectChat(chatData)
                    }

                    toast.success(`Accepted friend request and started chat with ${requestName}`)
                }
            }
        } catch (error) {
            console.error('Error accepting and messaging:', error)
            toast.error('Failed to accept friend request')
        } finally {
            setRequestLoading(requestId, false)
        }
    }

    // Handle decline request
    const handleDeclineRequest = async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const result = await rejectFriendRequest(user.uid, requestId)
            if (result.success) {
                toast.success(`Declined friend request from ${requestName}`)
            }
        } catch (error) {
            console.error('Error declining friend request:', error)
            toast.error('Failed to decline request')
        } finally {
            setRequestLoading(requestId, false)
        }
    }

    // Handle cancel request
    const handleCancelRequest = async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const result = await cancelFriendRequest(user.uid, requestId)
            if (result.success) {
                toast.success(`Cancelled friend request to ${requestName}`)
            }
        } catch (error) {
            console.error('Error cancelling friend request:', error)
            toast.error('Failed to cancel request')
        } finally {
            setRequestLoading(requestId, false)
        }
    }

    // Handle block user (for received requests)
    const handleBlockUser = async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const result = await blockUser(user.uid, requestId)
            if (result.success) {
                toast.success(`Blocked ${requestName}`)
            }
        } catch (error) {
            console.error('Error blocking user:', error)
            toast.error('Failed to block user')
        } finally {
            setRequestLoading(requestId, false)
        }
    }

    // Handle message after accepting
    const handleMessage = async (userData) => {
        setRequestLoading(userData.uid, true)
        try {
            const chatResult = await createOrGetChat(user.uid, userData.uid)
            if (chatResult) {
                const chatData = {
                    id: chatResult.id,
                    otherParticipant: {
                        uid: userData.uid,
                        name: userData.fullName || userData.displayName,
                        isOnline: userData.status === 'online'
                    },
                    lastMessage: "Start a conversation",
                    lastMessageAt: new Date(),
                    participants: [user.uid, userData.uid],
                    isGroup: false
                }

                if (onSelectChat) {
                    onSelectChat(chatData)
                }

                toast.success(`Starting chat with ${userData.fullName || userData.displayName}`)
            }
        } catch (error) {
            console.error('Error starting chat:', error)
            toast.error('Failed to start chat')
        } finally {
            setRequestLoading(userData.uid, false)
        }
    }

    // Format requests data from realtime store
    const formatRequests = (requests) => {
        return requests.map(req => ({
            ...req,
            id: req.uid,
            name: req.fullName || req.displayName || 'Unknown User',
            username: `@${req.email?.split('@')[0] || 'user'}`,
            avatar: req.fullName ? 
                req.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
            isOnline: req.status === 'online',
            timestamp: formatTimestamp(req.lastSeen),
            message: "Hi! I'd like to connect with you."
        }))
    }

    const currentRequests = activeTab === 'received' 
        ? formatRequests(receivedFriendRequests)
        : formatRequests(friendRequests.sent || [])

    const getAvatarContent = (request) => {
        if (request.profilePic || request.photoURL) {
            return (
                <img
                    src={request.profilePic || request.photoURL}
                    alt={request.name}
                    className="w-14 h-14 rounded-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                    }}
                />
            )
        }
        return (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600">
                <span className="text-white text-sm font-bold">
                    {request.avatar}
                </span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Friend Requests</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600">Error loading friend requests</p>
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
                        <h2 className='text-2xl font-bold text-gray-800'>Friend Requests</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Manage your incoming and outgoing friend requests
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className='flex space-x-4 justify-between'>
                    {/* Received Tab */}
                    <button
                        onClick={() => setActiveTab('received')}
                        disabled={loading}
                        className={`
                            flex items-center justify-center relative w-full space-x-2 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200
                            ${activeTab === 'received'
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-700 bg-gray-200 hover:bg-gray-100 cursor-pointer'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <span>Received</span>
                        {receivedFriendRequests.length > 0 && (
                            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs rounded-full font-bold bg-blue-500 text-white">
                                {receivedFriendRequests.length}
                            </span>
                        )}
                    </button>

                    {/* Sent Tab */}
                    <button
                        onClick={() => setActiveTab('sent')}
                        disabled={loading}
                        className={`
                            flex items-center justify-center relative w-full space-x-2 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200
                            ${activeTab === 'sent'
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-700 bg-gray-200 hover:bg-gray-100 cursor-pointer'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <span>Sent</span>
                        {friendRequests.sent?.length > 0 && (
                            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs rounded-full font-bold bg-orange-500 text-white">
                                {friendRequests.sent.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Requests List */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>
                    {loading && currentRequests.length === 0 ? (
                        <div className='space-y-4'>
                            {[1, 2, 3].map((skeleton) => (
                                <div key={skeleton} className='p-5 rounded-md border border-gray-100 bg-gray-50 animate-pulse'>
                                    <div className='flex items-start space-x-4'>
                                        <div className='w-14 h-14 bg-gray-200 rounded-full'></div>
                                        <div className='flex-1 space-y-3'>
                                            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                            <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                                            <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                                            <div className='h-10 bg-gray-200 rounded-lg w-full'></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : currentRequests.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                {activeTab === 'received' ? (
                                    <FaInbox className='w-10 h-10 text-gray-500' />
                                ) : (
                                    <FaPaperPlane className='w-10 h-10 text-gray-500' />
                                )}
                            </div>

                            <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                {activeTab === 'received' ? 'No Friend Requests' : 'No Sent Requests'}
                            </h4>
                            <p className='text-gray-500 text-sm max-w-md mx-auto mb-6'>
                                {activeTab === 'received'
                                    ? "You don't have any pending friend requests right now. When someone sends you a request, it will appear here."
                                    : "You haven't sent any friend requests yet. Search for users to send them friend requests."}
                            </p>
                            {activeTab === 'sent' && (
                                <button
                                    onClick={() => handleSetActiveView('search')}
                                    className='w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md transition-all duration-200 hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                                >
                                    Find Friends
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {currentRequests.map((request) => {
                                const isLoading = actionLoading[request.id]

                                return (
                                    <div
                                        key={request.id}
                                        className='p-5 rounded-md border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300 backdrop-blur-sm'
                                    >
                                        <div className='flex flex-col gap-3'>
                                            <div className='flex items-center space-x-4 flex-1 min-w-0'>
                                                {request.isOnline && (
                                                    <span className="absolute top-2 right-2 text-xs font-medium text-green-500 animate-pulse">
                                                        Online
                                                    </span>
                                                )}
                                                {/* Avatar */}
                                                <div className='relative flex-shrink-0'>
                                                    {getAvatarContent(request)}
                                                </div>

                                                {/* Request Info */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center justify-between mb-2'>
                                                        <div>
                                                            <h4 className='text-lg font-semibold text-gray-800'>
                                                                {request.name}
                                                            </h4>
                                                            <p className='text-sm text-gray-500'>
                                                                {request.email}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className='text-xs text-gray-400'>
                                                        {request.timestamp}
                                                    </p>
                                                    {request.bio && request.bio !== "Hey there! I'm using ChatApp 💬" && (
                                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                                            {request.bio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className='flex justify-end space-x-4'>
                                                {activeTab === 'received' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleMessageAfterAccept(request.id, request.name)}
                                                            disabled={isLoading}
                                                            className={`
                                                                flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                                                                ${isLoading
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md transform hover:scale-105'
                                                                }
                                                            `}
                                                        >
                                                            {isLoading ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span>Accept</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineRequest(request.id, request.name)}
                                                            disabled={isLoading}
                                                            className={`
                                                                flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                                                                ${isLoading
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md transform hover:scale-105'
                                                                }
                                                            `}
                                                        >
                                                            <span>Decline</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleBlockUser(request.id, request.name)}
                                                            disabled={isLoading}
                                                            className={`
                                                                flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                                                                ${isLoading
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-red-800 text-white hover:bg-red-900 shadow-sm hover:shadow-md transform hover:scale-105'
                                                                }
                                                            `}
                                                        >
                                                            <span>Block</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleCancelRequest(request.id, request.name)}
                                                            disabled={isLoading}
                                                            className={`
                                                                flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                                                                ${isLoading
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md transform hover:scale-105'
                                                                }
                                                            `}
                                                        >
                                                            {isLoading ? (
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    <span>Canceling...</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <FaUserMinus className='w-4 h-4' />
                                                                    <span>Cancel Request</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        {request.isOnline && (
                                                            <button
                                                                onClick={() => handleMessage(request)}
                                                                disabled={isLoading}
                                                                className="px-4 py-2 bg-gray-900 text-white rounded-md transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:scale-105"
                                                            >
                                                                Message
                                                            </button>
                                                        )}
                                                    </>
                                                )}
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
            {loading && currentRequests.length > 0 && (
                <div className="p-3 text-center border-t border-gray-200 bg-blue-50">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Updating requests...</p>
                </div>
            )}
        </div>
    )
}

export default FriendRequestList