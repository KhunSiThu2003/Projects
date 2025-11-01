import { useState, useCallback, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'
import { toast } from 'react-hot-toast'

export const useChatList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredChats, setFilteredChats] = useState([])
    const [processedChats, setProcessedChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useUserStore()
    const { friends, chats, subscribeToAllData } = useRealtimeStore()

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
                console.log('No user UID available');
                return null;
            }

            const otherParticipantId = chat.participantsArray?.find(id => id !== user.uid)
            if (!otherParticipantId) {
                console.log('No other participant found for chat:', chat.id);
                return null
            }

            // Check if other participant is in friends list
            const isFriend = friends?.some(friend => friend.uid === otherParticipantId)
            console.log(`Chat ${chat.id}: Is friend?`, isFriend, 'Other participant:', otherParticipantId);
            
            if (!isFriend) {
                console.log(`Chat ${chat.id}: Other participant is not in friends list`);
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
                    console.log(`Fetching user data from Firestore for: ${otherParticipantId}`);
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
                        console.log(`User document not found for: ${otherParticipantId}`);
                        return null
                    }
                }
            } catch (userError) {
                console.error('Error fetching user data:', userError)
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

            console.log('Successfully processed chat:', processedChat.id, processedChat.name);
            return processedChat
        } catch (error) {
            console.error('Error processing chat data:', error)
            return null
        }
    }, [user?.uid, formatTimestamp, friends])

    const processChats = useCallback(async () => {
        console.log('processChats called with:', {
            user: user?.uid,
            chatsCount: chats?.length,
            friendsCount: friends?.length
        });

        if (!user?.uid) {
            console.log('No user UID, clearing chats');
            setProcessedChats([])
            setLoading(false)
            return
        }

        if (!chats || chats.length === 0) {
            console.log('No chats available');
            setProcessedChats([])
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const processed = []
            console.log(`Processing ${chats.length} chats...`);
            
            for (const chat of chats) {
                const processedChat = await processChatData(chat)
                if (processedChat) {
                    processed.push(processedChat)
                }
            }

            console.log(`Successfully processed ${processed.length} chats`);

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
    }, [chats, user?.uid, processChatData])

    // Auto-process chats when chats, user, or friends change
    useEffect(() => {
        processChats();
    }, [processChats]);

    const getAvatarContent = useCallback((chat) => {
        if (chat.otherParticipant?.profilePic) {
            return (
                <img
                    src={chat.otherParticipant.profilePic}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        // Show fallback avatar
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