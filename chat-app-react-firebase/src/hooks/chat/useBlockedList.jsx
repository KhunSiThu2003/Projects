import { useState, useCallback, useEffect } from 'react'
import { unblockUser } from '../../services/friend'
import useUserStore from '../../stores/useUserStore'
import useRealtimeStore from '../../stores/useRealtimeStore'

export const useBlockedList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredUsers, setFilteredUsers] = useState([])
    const [actionLoading, setActionLoading] = useState({})
    
    const { user } = useUserStore()
    const { blockedUsers, loading, error, subscribeToAllData } = useRealtimeStore()

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToAllData(user.uid)
            return unsubscribe
        }
    }, [user?.uid, subscribeToAllData])

    const formatTimestamp = useCallback((timestamp) => {
        if (!timestamp) return 'Long time ago'
        
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
            if (diffDays < 7) return `${diffDays}d ago`
            
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        } catch (error) {
            return 'Recently'
        }
    }, [])

    const formatBlockedDate = useCallback((dateString) => {
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
    }, [])

    const getReasonConfig = useCallback((reason) => {
        const configs = {
            'Spam messages': { 
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                icon: '📧'
            },
            'Harassment': { 
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: '🚫'
            },
            'Inappropriate content': { 
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: '🔞'
            },
            'Unknown contact': { 
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: '❓'
            },
            'Not specified': {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: '🔒'
            }
        }
        return configs[reason] || configs['Not specified']
    }, [])

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(blockedUsers)
        } else {
            const filtered = blockedUsers.filter(user =>
                user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            setFilteredUsers(filtered)
        }
    }, [searchTerm, blockedUsers])

    const setUserActionLoading = useCallback((userId, isLoading) => {
        setActionLoading(prev => ({
            ...prev,
            [userId]: isLoading
        }))
    }, [])

    const handleUnblock = useCallback(async (userId, userName) => {
        setUserActionLoading(userId, true)
        try {
            await unblockUser(user.uid, userId)
        } catch (error) {
        } finally {
            setUserActionLoading(userId, false)
        }
    }, [user?.uid, setUserActionLoading])

    const handleUnblockAll = useCallback(async () => {
        if (blockedUsers.length === 0) return
        
        try {
            const promises = blockedUsers.map(user => 
                unblockUser(user.uid, user.id)
            )
            await Promise.allSettled(promises)
        } catch (error) {
        }
    }, [blockedUsers, user?.uid])

    const formatBlockedUsers = useCallback(() => {
        return blockedUsers.map(userData => ({
            ...userData,
            id: userData.uid,
            name: userData.fullName || 'Unknown User',
            username: `@${userData.email?.split('@')[0] || 'user'}`,
            avatar: userData.fullName ? 
                userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
            blockedDate: userData.blockedDate || new Date().toISOString().split('T')[0],
            blockedReason: userData.blockedReason || 'Not specified',
            isOnline: userData.status === 'online'
        }))
    }, [blockedUsers])

    const getAvatarContent = useCallback((userData) => {
        if (userData.profilePic || userData.photoURL) {
            return (
                <img 
                    src={userData.profilePic || userData.photoURL}
                    alt={userData.name}
                    className="w-14 h-14 rounded-full object-cover opacity-60"
                    onError={(e) => {
                        e.target.style.display = 'none'
                    }}
                />
            )
        }
        return (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-gray-400 to-gray-600 opacity-60">
                <span className="text-white text-sm font-bold">
                    {userData.avatar}
                </span>
            </div>
        )
    }, [])

    const formattedBlockedUsers = formatBlockedUsers()
    const displayedUsers = searchTerm ? filteredUsers : formattedBlockedUsers

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value)
    }, [])

    const handleClearSearch = useCallback(() => {
        setSearchTerm('')
    }, [])

    return {
        user,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        displayedUsers,
        formattedBlockedUsers,
        actionLoading,
        formatTimestamp,
        formatBlockedDate,
        getReasonConfig,
        getAvatarContent,
        handleUnblock,
        handleUnblockAll,
        handleSearchChange,
        handleClearSearch
    }
}