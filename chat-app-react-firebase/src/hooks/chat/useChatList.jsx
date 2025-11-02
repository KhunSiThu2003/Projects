import { useState, useCallback, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'

export const useChatList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredChats, setFilteredChats] = useState([])
    const [processedChats, setProcessedChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useUserStore()
    const { friends, chats, subscribeToAllData, userProfile } = useRealtimeStore()

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

    const processChatData = useCallback(async (chat) => {
        try {
            if (!user?.uid) {
                return null;
            }

            const otherParticipantId = chat.participantsArray?.find(id => id !== user.uid)
            if (!otherParticipantId) {
                return null
            }

            const isFriend = friends?.some(friend => friend.uid === otherParticipantId)
            
            if (!isFriend) {
                return null
            }

            let otherParticipant = null
            let chatName = 'Unknown User'

            try {
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
            return null
        }
    }, [user?.uid, formatTimestamp, friends])

    const processChats = useCallback(async () => {
        if (!user?.uid) {
            setProcessedChats([])
            setLoading(false)
            return
        }

        // Show loading skeleton while initial data is being loaded
        // If userProfile doesn't exist, data hasn't loaded yet from Firebase
        if (!userProfile) {
            setLoading(true)
            return
        }

        if (chats && chats.length > 0) {
            setLoading(true)
        }

        try {
            if (!chats || chats.length === 0) {
                setProcessedChats([])
                setLoading(false)
                return
            }

            const processed = []
            
            for (const chat of chats) {
                const processedChat = await processChatData(chat)
                if (processedChat) {
                    processed.push(processedChat)
                }
            }

            const sortedChats = processed.sort((a, b) => {
                const timeA = a.lastMessageAt?.toDate?.() || a.lastUpdated?.toDate?.() || new Date(0)
                const timeB = b.lastMessageAt?.toDate?.() || b.lastUpdated?.toDate?.() || new Date(0)
                return timeB - timeA
            })

            setProcessedChats(sortedChats)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }, [chats, user?.uid, processChatData, userProfile])

    useEffect(() => {
        processChats();
    }, [processChats]);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(true)
        } else if (!userProfile) {
            // Keep loading true while waiting for initial data load
            setLoading(true)
        }
    }, [user?.uid, chats, userProfile])

    const getAvatarContent = useCallback((chat) => {
        if (chat.otherParticipant?.profilePic) {
            return (
                <img
                    src={chat.otherParticipant.profilePic}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value)
    }

    const handleClearSearch = () => {
        setSearchTerm('')
    }

    return {
        user,
        loading,
        getAvatarContent,
        getLastMessage,
        handleSearchChange,
        handleClearSearch,
        searchTerm,
        setFilteredChats,
        filteredChats,
        setActiveChat,
        activeChat,
        processedChats,
        friends,
        subscribeToAllData,
        processChats,
        chats,
    }
}