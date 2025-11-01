import { useState, useMemo, useCallback } from 'react';
import useRealtimeStore from '../../stores/useRealtimeStore';
import useUserStore from '../../stores/useUserStore';
import { createOrGetChat } from '../../services/chatService';
import { removeFriend } from '../../services/friend';
import { toast } from 'react-hot-toast';

export const useFriendList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const { user } = useUserStore();
    const {
        friends,
        getOnlineFriends,
        getOfflineFriends,
        loading,
        error,
        subscribeToAllData
    } = useRealtimeStore();

    const getFilteredFriends = useCallback(() => {
        switch (activeTab) {
            case 'online':
                return getOnlineFriends();
            case 'offline':
                return getOfflineFriends();
            default:
                return friends;
        }
    }, [activeTab, friends, getOnlineFriends, getOfflineFriends]);

    const filteredFriends = useMemo(() => {
        const tabFiltered = getFilteredFriends();
        if (!searchQuery.trim()) return tabFiltered;

        const query = searchQuery.toLowerCase();
        return tabFiltered.filter(friend =>
            (friend.fullName || friend.displayName || '').toLowerCase().includes(query) ||
            (friend.email || '').toLowerCase().includes(query) ||
            (friend.bio || '').toLowerCase().includes(query)
        );
    }, [getFilteredFriends, searchQuery]);

    const onlineFriends = useMemo(() => getOnlineFriends(), [getOnlineFriends]);
    const offlineFriends = useMemo(() => getOfflineFriends(), [getOfflineFriends]);

    const handleStartChat = useCallback(async (friend, onSelectChat) => {
        if (!user?.uid) return;

        try {
            const chat = await createOrGetChat(user.uid, friend.uid);

            if (onSelectChat && chat) {
                const chatData = {
                    id: chat.id,
                    otherParticipant: {
                        uid: friend.uid,
                        name: friend.fullName || friend.displayName,
                        profilePic: friend.profilePic,
                        isOnline: friend.status === 'online',
                        lastSeen: friend.lastSeen
                    },
                    name: friend.fullName || friend.displayName,
                    lastMessage: chat.lastMessage || 'Start a conversation',
                    lastMessageAt: chat.lastMessageAt,
                    participantsArray: chat.participantsArray,
                    participantsData: chat.participantsData
                };
                onSelectChat(chatData);

            }
        } catch (error) {
            toast.error('Failed to start chat');
        }
    }, [user?.uid]);

    const handleUnfriend = useCallback(async (friend) => {
        if (!user?.uid) return;

        try {
            const result = await removeFriend(user.uid, friend.uid);
            if (!result.success) {
                toast.error(result.error || 'Failed to remove friend');
            }
        } catch (error) {
            toast.error('Failed to remove friend');
        }
    }, [user?.uid]);

    return {
        user,
        friends,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredFriends,
        onlineFriends,
        offlineFriends,
        handleStartChat,
        handleUnfriend,
        subscribeToAllData
    };
};