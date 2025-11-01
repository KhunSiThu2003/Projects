import React, { useEffect, useCallback } from 'react'
import { FaComments, FaSearch } from "react-icons/fa"
import { useChatList } from '../../hooks/chat/useChatList'

const ChatList = ({ onSelectChat, handleSetActiveView }) => {
    const {
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
        subscribeToAllData,
        processChats,
        chats,
        friends,
    } = useChatList();


    useEffect(() => {
        processChats();
    }, [chats, user?.uid, processChats]);


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
    }, [searchTerm, processedChats, setFilteredChats])

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToAllData(user.uid)
            return unsubscribe
        }
    }, [user?.uid, subscribeToAllData])

    const handleChatClick = useCallback((chat) => {
        setActiveChat(chat.id)
        if (onSelectChat) {
            onSelectChat(chat)
        }
    }, [onSelectChat, setActiveChat])

    return (
        <div className='flex flex-col h-full bg-white lg:max-w-90'>
            <div className='p-6 border-b border-gray-100'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Messages</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Conversations with your friends
                        </p>
                    </div>
                </div>

                <div className='relative'>
                    <div className='absolute z-40 inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FaSearch className='h-4 w-4 text-gray-400' />
                    </div>
                    <input
                        type='text'
                        placeholder='Search conversations...'
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg focus:outline-none'
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

            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>

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
                                            onClick={() => handleSetActiveView('search')}
                                            className='w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                                        >
                                            Search Friends
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
                                    className={`group p-4 rounded-md cursor-pointer transition-all duration-200 border ${activeChat === chat.id
                                        ? 'bg-blue-50 border-blue-200 shadow-lg scale-[1.02]'
                                        : 'border-gray-100 hover:bg-gray-50 hover:border-blue-100 hover:shadow-md'
                                        }`}
                                >
                                    <div className='flex items-start space-x-3'>
                                        <div className='relative flex-shrink-0'>
                                            {getAvatarContent(chat)}

                                            {chat.unread > 0 && (
                                                <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm'>
                                                    <span className='text-white text-xs font-bold'>
                                                        {chat.unread > 9 ? '9+' : chat.unread}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <h4 className='text-sm font-semibold text-gray-800 truncate'>
                                                    {chat.name}
                                                </h4>
                                                <div className='flex items-center space-x-2 flex-shrink-0 ml-2'>

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
                                            </div>
                                            <p className='text-sm text-gray-600 truncate leading-tight mb-1'>
                                                {getLastMessage(chat)}
                                            </p>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center  space-x-2'>
                                                    <span className='text-xs text-gray-500'>
                                                        {chat.time}
                                                    </span>
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