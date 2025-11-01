import { useState, useCallback, useEffect } from 'react'
import { 
    cancelFriendRequest,
    rejectFriendRequest, 
    acceptFriendRequest,
    blockUser
} from '../../services/friend'
import { createOrGetChat } from '../../services/chatService'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import { toast } from 'react-hot-toast'

export const useFriendRequestList = ({ onSelectChat }) => {
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

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToAllData(user.uid)
            return unsubscribe
        }
    }, [user?.uid, subscribeToAllData])

    const formatTimestamp = useCallback((lastSeen) => {
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
    }, [])

    const setRequestLoading = useCallback((requestId, isLoading) => {
        setActionLoading(prev => ({
            ...prev,
            [requestId]: isLoading
        }))
    }, [])

    const handleAcceptRequest = useCallback(async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const acceptResult = await acceptFriendRequest(user.uid, requestId)
            if (acceptResult.success) {
                const chatResult = await createOrGetChat(user.uid, requestId)
                if (chatResult) {
                    const chatData = {
                        id: chatResult.id,
                        otherParticipant: {
                            uid: requestId,
                            name: requestName,
                            isOnline: true
                        },
                        lastMessage: "You are now friends! Start chatting",
                        lastMessageAt: new Date(),
                        participantsArray: [user.uid, requestId],
                        isGroup: false
                    }

                    if (onSelectChat) {
                        onSelectChat(chatData)
                    }
                }
            }
        } catch (error) {
            toast.error('Failed to accept friend request')
        } finally {
            setRequestLoading(requestId, false)
        }
    }, [user?.uid, onSelectChat, setRequestLoading])

    const handleDeclineRequest = useCallback(async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const result = await rejectFriendRequest(user.uid, requestId)

        } catch (error) {
            toast.error('Failed to decline request')
        } finally {
            setRequestLoading(requestId, false)
        }
    }, [user?.uid, setRequestLoading])

    const handleCancelRequest = useCallback(async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const result = await cancelFriendRequest(user.uid, requestId)

        } catch (error) {
            toast.error('Failed to cancel request')
        } finally {
            setRequestLoading(requestId, false)
        }
    }, [user?.uid, setRequestLoading])

    const handleBlockUser = useCallback(async (requestId, requestName) => {
        setRequestLoading(requestId, true)
        try {
            const result = await blockUser(user.uid, requestId)

        } catch (error) {
            toast.error('Failed to block user')
        } finally {
            setRequestLoading(requestId, false)
        }
    }, [user?.uid, setRequestLoading])

    const handleMessage = useCallback(async (userData) => {
        setRequestLoading(userData.id, true)
        try {
            const chatResult = await createOrGetChat(user.uid, userData.id)
            if (chatResult) {
                const chatData = {
                    id: chatResult.id,
                    otherParticipant: {
                        uid: userData.id,
                        name: userData.name,
                        isOnline: userData.isOnline
                    },
                    lastMessage: "Start a conversation",
                    lastMessageAt: new Date(),
                    participantsArray: [user.uid, userData.id],
                    isGroup: false
                }

                if (onSelectChat) {
                    onSelectChat(chatData)
                }

            }
        } catch (error) {
            toast.error('Failed to start chat')
        } finally {
            setRequestLoading(userData.id, false)
        }
    }, [user?.uid, onSelectChat, setRequestLoading])

    const formatRequests = useCallback((requests) => {
        return requests.map(req => ({
            ...req,
            id: req.uid,
            name: req.fullName || req.displayName || 'Unknown User',
            email: req.email,
            isOnline: req.status === 'online',
            timestamp: formatTimestamp(req.lastSeen),
            bio: req.bio,
            profilePic: req.profilePic,
            photoURL: req.photoURL,
            avatar: req.fullName ? 
                req.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
        }))
    }, [formatTimestamp])

    const currentRequests = activeTab === 'received' 
        ? formatRequests(receivedFriendRequests)
        : formatRequests(friendRequests.sent || [])

    const getActionButtons = useCallback((request, tab) => {
        const isLoading = actionLoading[request.id]

        if (tab === 'received') {
            return (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptRequest(request.id, request.name);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Accept'
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeclineRequest(request.id, request.name);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Decline'
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleBlockUser(request.id, request.name);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Block'
                        )}
                    </button>
                </div>
            )
        } else {
            return (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRequest(request.id, request.name);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Cancel'
                        )}
                    </button>
                    
                </div>
            )
        }
    }, [actionLoading, handleAcceptRequest, handleDeclineRequest, handleBlockUser, handleCancelRequest, handleMessage])

    const getAvatarContent = useCallback((request) => {
        if (request.profilePic || request.photoURL) {
            return (
                <img
                    src={request.profilePic || request.photoURL}
                    alt={request.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            )
        }
        return (
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600">
                <span className="text-white text-sm font-bold">
                    {request.avatar}
                </span>
            </div>
        )
    }, [])

    return {
        activeTab,
        setActiveTab,
        loading,
        error,
        currentRequests,
        receivedFriendRequests,
        friendRequests,
        getActionButtons,
        getAvatarContent
    }
}