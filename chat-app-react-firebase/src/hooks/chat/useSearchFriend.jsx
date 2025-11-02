import { useState, useCallback, useEffect, useRef } from 'react'
import { searchUsersByEmailOrName } from '../../services/user'
import {
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    checkFriendshipStatus,
} from '../../services/friend'
import { createOrGetChat } from '../../services/chatService'
import { subscribeToUserProfile } from '../../services/realtimeSubscriptions'
import useUserStore from '../../stores/useUserStore'

export const useSearchFriend = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [loadingStates, setLoadingStates] = useState({})
    const [debounceTimer, setDebounceTimer] = useState(null)
    const unsubscribeRefs = useRef([])

    const { user } = useUserStore()

    const setUserLoading = useCallback((userId, action, isLoading) => {
        setLoadingStates(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [action]: isLoading
            }
        }))
    }, [])

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

    // Set up real-time subscriptions for search results
    const setupRealtimeSubscriptions = useCallback((users) => {
        // Clean up previous subscriptions
        unsubscribeRefs.current.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        unsubscribeRefs.current = [];

        // Subscribe to each user's profile updates
        users.forEach((userData) => {
            if (userData.uid) {
                const unsubscribe = subscribeToUserProfile(
                    userData.uid,
                    (updatedProfile) => {
                        setSearchResults(prev =>
                            prev.map(u => {
                                if (u.uid === updatedProfile.uid) {
                                    return {
                                        ...u,
                                        fullName: updatedProfile.fullName || u.fullName,
                                        email: updatedProfile.email || u.email,
                                        profilePic: updatedProfile.profilePic || u.profilePic,
                                        status: updatedProfile.status || u.status,
                                        lastSeen: updatedProfile.lastSeen || u.lastSeen,
                                        bio: updatedProfile.bio || u.bio,
                                        isOnline: updatedProfile.status === 'online',
                                        avatar: updatedProfile.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                                    };
                                }
                                return u;
                            })
                        );
                    },
                    (error) => {
                        // Silently handle errors - don't break the UI
                        console.log('Error in real-time subscription:', error);
                    }
                );
                unsubscribeRefs.current.push(unsubscribe);
            }
        });
    }, [])

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
                    
                    // Set up real-time subscriptions for each user
                    setupRealtimeSubscriptions(usersWithStatus)
                } else {
                    setSearchResults([])
                }
            } catch (error) {
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 500)

        setDebounceTimer(timer)
    }, [user?.uid, debounceTimer, setupRealtimeSubscriptions])

const handleStartChat = useCallback(async (userData, onSelectChat) => {
    setUserLoading(userData.uid, 'startChat', true)
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
            }

        }
    } catch (error) {
    } finally {
        setUserLoading(userData.uid, 'startChat', false)
    }
}, [user?.uid, setUserLoading])

    const handleAddFriend = useCallback(async (userId, userName) => {
        setUserLoading(userId, 'addFriend', true)
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
                if (result.error.includes('already friends')) {
                    setTimeout(() => refreshUserStatus(userId), 1000)
                }
            }
        } catch (error) {
        } finally {
            setUserLoading(userId, 'addFriend', false)
        }
    }, [user?.uid, setUserLoading])

    const handleCancelRequest = useCallback(async (userId, userName) => {
        setUserLoading(userId, 'cancel', true)
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
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
        } finally {
            setUserLoading(userId, 'cancel', false)
        }
    }, [user?.uid, setUserLoading])

    const handleUnfriend = useCallback(async (userId, userName) => {
        setUserLoading(userId, 'unfriend', true)
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
                setTimeout(() => refreshUserStatus(userId), 1000)
        } catch (error) {
        } finally {
            setUserLoading(userId, 'unfriend', false)
        }
    }, [user?.uid, setUserLoading])

    const handleAcceptRequest = useCallback(async (userId, userName) => {
        setUserLoading(userId, 'accept', true)
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
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
        } finally {
            setUserLoading(userId, 'accept', false)
        }
    }, [user?.uid, setUserLoading])

    const handleDeclineRequest = useCallback(async (userId, userName) => {
        setUserLoading(userId, 'decline', true)
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
                setTimeout(() => refreshUserStatus(userId), 1000)
            }
        } catch (error) {
        } finally {
            setUserLoading(userId, 'decline', false)
        }
    }, [user?.uid, setUserLoading])

    const getActionButtons = useCallback((userData,onSelectChat) => {
        const loadingStates_user = loadingStates[userData.uid] || {}
        const isAnyLoading = loadingStates_user.addFriend || loadingStates_user.cancel || loadingStates_user.accept || loadingStates_user.decline || loadingStates_user.unfriend

        switch (userData.status) {
            case "add":
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddFriend(userData.uid, userData.fullName);
                        }}
                        disabled={isAnyLoading}
                        className="px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {loadingStates_user.addFriend ? (
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
                        disabled={isAnyLoading}
                        className="px-3 py-2 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {loadingStates_user.cancel ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Cancel'
                        )}
                    </button>
                )

            case "friend":
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUnfriend(userData.uid, userData.fullName);
                        }}
                        disabled={isAnyLoading}
                        className="px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {loadingStates_user.unfriend ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Unfriend'
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
                            disabled={isAnyLoading}
                            className="px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                        >
                            {loadingStates_user.accept ? (
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
                            disabled={isAnyLoading}
                            className="px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-16 flex items-center justify-center"
                        >
                            {loadingStates_user.decline ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Decline'
                            )}
                        </button>
                    </div>
                )

            case "blocked":
                // Blocked users shouldn't appear in search results, but if they do, don't show button
                return null

            default:
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddFriend(userData.uid, userData.fullName);
                        }}
                        disabled={isAnyLoading}
                        className="px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed min-w-20 flex items-center justify-center"
                    >
                        {loadingStates_user.addFriend ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Add Friend'
                        )}
                    </button>
                )
        }
    }, [loadingStates, handleAddFriend, handleCancelRequest, handleAcceptRequest, handleDeclineRequest, handleUnfriend])

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

    // Cleanup subscriptions when component unmounts or search term changes
    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer)
            }
            // Clean up all real-time subscriptions
            unsubscribeRefs.current.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            unsubscribeRefs.current = [];
        }
    }, [debounceTimer])

    // Clean up subscriptions when search term is cleared
    useEffect(() => {
        if (!searchTerm.trim()) {
            unsubscribeRefs.current.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            unsubscribeRefs.current = [];
        }
    }, [searchTerm])

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