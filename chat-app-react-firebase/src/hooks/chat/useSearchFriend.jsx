import { useState, useCallback, useEffect } from 'react'
import { searchUsersByEmailOrName } from '../../services/user'
import {
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    unblockUser,
    checkFriendshipStatus,
} from '../../services/friend'
import { createOrGetChat } from '../../services/chatService'
import useUserStore from '../../stores/useUserStore'
import { toast } from 'react-hot-toast'

export const useSearchFriend = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [loadingStates, setLoadingStates] = useState({})
    const [debounceTimer, setDebounceTimer] = useState(null)

    const { user } = useUserStore()

    const setUserLoading = (userId, isLoading) => {
        setLoadingStates(prev => ({
            ...prev,
            [userId]: isLoading
        }))
    }

    const getFriendshipStatus = async (userData) => {
        try {
            const statusResult = await checkFriendshipStatus(user.uid, userData.uid)

            if (statusResult.success && statusResult.status) {
                const status = statusResult.status;

                if (status.isBlocked) {
                    return 'blocked';
                } else if (status.isFriend) {
                    return 'friend';
                } else if (status.requestReceived) {
                    return 'request_received';
                } else if (status.requestSent) {
                    return 'request_sent';
                }
            }
            return 'add';
        } catch (error) {
            return 'add';
        }
    }

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
        } catch (error) {}
    }

    const handleSearch = useCallback(async (term) => {
        setSearchTerm(term)

        if (term.trim() === '') {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)

        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }

        const timer = setTimeout(async () => {
            try {
                const result = await searchUsersByEmailOrName(term, user.uid)

                if (result.success) {
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
                toast.error('Error searching users')
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 500)

        setDebounceTimer(timer)
    }, [user?.uid, debounceTimer])

const handleStartChat = useCallback(async (userData, onSelectChat) => {
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
                participantsArray: chatResult.participantsArray || [user.uid, userData.uid],
                participantsData: chatResult.participantsData || {
                    [user.uid]: true,
                    [userData.uid]: true
                },
                isGroup: false
            }

            if (onSelectChat && typeof onSelectChat === 'function') {
                onSelectChat(chatData);
            } else {
                console.warn('onSelectChat is not a function or not defined');
            }

        } else {
            toast.error('Failed to start chat')
        }
    } catch (error) {
        console.error('Error starting chat:', error);
        toast.error('Failed to start chat')
    } finally {
        setUserLoading(userData.uid, false)
    }
}, [user?.uid])

    const handleAddFriend = useCallback(async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await sendFriendRequest(user.uid, userId)

            if (result.success) {
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "request_sent" }
                            : u
                    )
                )
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                if (result.error.includes('blocked')) {
                    toast.error('Cannot send friend request to blocked user')
                } else if (result.error.includes('already friends')) {
                    toast.error('You are already friends with this user')
                    setTimeout(() => refreshUserStatus(userId), 1000)
                } else {
                    toast.error(result.error || 'Failed to send friend request')
                }
            }
        } catch (error) {
            toast.error('Failed to send friend request')
        } finally {
            setUserLoading(userId, false)
        }
    }, [user?.uid])

    const handleCancelRequest = useCallback(async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await cancelFriendRequest(user.uid, userId)

            if (result.success) {
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to cancel request')
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            toast.error('Failed to cancel request')
        } finally {
            setUserLoading(userId, false)
        }
    }, [user?.uid])

    const handleAcceptRequest = useCallback(async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await acceptFriendRequest(user.uid, userId)

            if (result.success) {
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "friend" }
                            : u
                    )
                )
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to accept request')
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            toast.error('Failed to accept request')
        } finally {
            setUserLoading(userId, false)
        }
    }, [user?.uid])

    const handleDeclineRequest = useCallback(async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await rejectFriendRequest(user.uid, userId)

            if (result.success) {
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to decline request')
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            toast.error('Failed to decline request')
        } finally {
            setUserLoading(userId, false)
        }
    }, [user?.uid])

    const handleUnfriend = useCallback(async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await removeFriend(user.uid, userId)

            if (result.success) {
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                if (result.error.includes('not friends')) {
                    toast.error(`You are not friends with ${userName}`)
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
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
            toast.error('Failed to remove friend')
        } finally {
            setUserLoading(userId, false)
        }
    }, [user?.uid])

    const handleUnblock = useCallback(async (userId, userName) => {
        setUserLoading(userId, true)
        try {
            const result = await unblockUser(user.uid, userId)

            if (result.success) {
                setSearchResults(prev =>
                    prev.map(u =>
                        u.uid === userId
                            ? { ...u, status: "add" }
                            : u
                    )
                )
                setTimeout(() => refreshUserStatus(userId), 1500)
            } else {
                toast.error(result.error || 'Failed to unblock user')
            }
        } catch (error) {
            toast.error('Failed to unblock user')
        } finally {
            setUserLoading(userId, false)
        }
    }, [user?.uid])

    const getActionButtons = useCallback((userData,onSelectChat) => {
        const isLoading = loadingStates[userData.uid]

        switch (userData.status) {
            case "add":
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddFriend(userData.uid, userData.fullName);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Add Friend'
                        )}
                    </button>
                )

            case "request_sent":
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRequest(userData.uid, userData.fullName);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Cancel'
                        )}
                    </button>
                )

            case "request_received":
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptRequest(userData.uid, userData.fullName);
                            }}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
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
                                handleDeclineRequest(userData.uid, userData.fullName);
                            }}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Decline'
                            )}
                        </button>
                    </div>
                )

            case "friend":
                return (
                    <div className="flex space-x-2">
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUnfriend(userData.uid, userData.fullName);
                            }}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Unfriend'
                            )}
                        </button>
                    </div>
                )

            case "blocked":
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUnblock(userData.uid, userData.fullName);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Unblock'
                        )}
                    </button>
                )

            default:
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddFriend(userData.uid, userData.fullName);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Add Friend'
                        )}
                    </button>
                )
        }
    }, [loadingStates, handleAddFriend, handleCancelRequest, handleAcceptRequest, handleDeclineRequest, handleStartChat, handleUnfriend, handleUnblock])

    const getAvatarContent = useCallback((userData) => {
        if (userData.profilePic) {
            return (
                <img
                    src={userData.profilePic}
                    alt={userData.fullName}
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
                    {userData.avatar}
                </span>
            </div>
        )
    }, [])

    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer)
            }
        }
    }, [debounceTimer])

    return {
        searchTerm,
        setSearchTerm,
        searchResults,
        isSearching,
        loadingStates,
        handleSearch,
        getActionButtons,
        getAvatarContent
    }
}