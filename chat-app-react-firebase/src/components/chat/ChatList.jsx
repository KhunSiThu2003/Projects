import React, { useState } from 'react'

const ChatList = ({ onSelectChat }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeChat, setActiveChat] = useState(null)

    const chats = [
        {
            id: 1,
            name: "Theme Vanhorn",
            lastMessage: "I can refer to the project structure and board some mistakes.",
            time: "10:30 AM",
            unread: 3,
            active: true,
            avatar: "TV",
            isOnline: true
        },
        {
            id: 2,
            name: "Line Roy",
            lastMessage: "Then'd, via meeting with client finances.",
            time: "9:45 AM",
            unread: 0,
            active: false,
            avatar: "LR",
            isOnline: true
        },
        {
            id: 3,
            name: "Brad Frost",
            lastMessage: "Not to meet you!",
            time: "Yesterday",
            unread: 1,
            active: false,
            avatar: "BF",
            isOnline: false
        },
        {
            id: 4,
            name: "Paul Irish",
            lastMessage: "Then'd look their chat waiting from boredom.",
            time: "Yesterday",
            unread: 0,
            active: false,
            avatar: "PI",
            isOnline: true
        },
        {
            id: 5,
            name: "Jessica Glory",
            lastMessage: "Then'd found books.",
            time: "Oct 28",
            unread: 0,
            active: false,
            avatar: "JG",
            isOnline: false
        },
        {
            id: 6,
            name: "John Doe",
            lastMessage: "If it is the second component will be completed today.",
            time: "Oct 27",
            unread: 0,
            active: false,
            avatar: "JD",
            isOnline: true
        },
        {
            id: 7,
            name: "Eric Petersen",
            lastMessage: "First of all men with the company CEO and GLA.",
            time: "Oct 26",
            unread: 12,
            active: false,
            avatar: "EP",
            isOnline: false
        },
        {
            id: 8,
            name: "Design Team",
            lastMessage: "Sarah: Let's schedule a meeting for next week",
            time: "Oct 25",
            unread: 0,
            active: false,
            avatar: "DT",
            isOnline: true,
            isGroup: true
        },
        {
            id: 9,
            name: "Project Alpha",
            lastMessage: "Mike: The deadline has been moved to Friday",
            time: "Oct 24",
            unread: 5,
            active: false,
            avatar: "PA",
            isOnline: true,
            isGroup: true
        }
    ]

    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleChatClick = (chat) => {
        setActiveChat(chat.id)
        if (onSelectChat) {
            onSelectChat(chat)
        }
    }

    const formatTime = (time) => {
        return time
    }

    return (
        <div className='flex flex-col h-full'>
            {/* Search Bar */}
            <div className='p-4 border-b border-gray-200 flex-shrink-0'>
                <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </div>
                    <input
                        type='text'
                        placeholder='Search conversations...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
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
                <div className='p-4'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-6'>
                        <h3 className='text-lg font-semibold text-gray-800'>
                            Conversations
                        </h3>
                        <span className='text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded'>
                            {filteredChats.length} chats
                        </span>
                    </div>

                    {filteredChats.length === 0 ? (
                        <div className='text-center py-12'>
                            <svg className='w-16 h-16 text-gray-300 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                            </svg>
                            <p className='text-gray-500 text-sm'>No conversations found</p>
                            <p className='text-gray-400 text-xs mt-1'>Try adjusting your search terms</p>
                        </div>
                    ) : (
                        <div className='space-y-2'>
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => handleChatClick(chat)}
                                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                                        activeChat === chat.id
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                                    <div className='flex items-start space-x-3'>
                                        {/* Avatar */}
                                        <div className='relative flex-shrink-0'>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                chat.isGroup 
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                                                    : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                                            }`}>
                                                <span className='text-white text-sm font-bold'>
                                                    {chat.avatar}
                                                </span>
                                            </div>
                                            {/* Online Status */}
                                            {!chat.isGroup && chat.isOnline && (
                                                <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
                                            )}
                                            {chat.isGroup && (
                                                <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center'>
                                                    <svg className='w-2 h-2 text-white' fill='currentColor' viewBox='0 0 20 20'>
                                                        <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z'/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Info */}
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <h4 className='text-sm font-semibold text-gray-800 truncate'>
                                                    {chat.name}
                                                </h4>
                                                <div className='flex items-center space-x-2 flex-shrink-0'>
                                                    <span className='text-xs text-gray-500'>
                                                        {formatTime(chat.time)}
                                                    </span>
                                                    {chat.unread > 0 && (
                                                        <span className='bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center'>
                                                            {chat.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className='text-sm text-gray-600 truncate leading-tight'>
                                                {chat.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Button - Fixed at bottom */}
            <div className='p-4 border-t border-gray-200 flex-shrink-0'>
                <button className='w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 font-medium'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                    </svg>
                    <span>New Conversation</span>
                </button>
            </div>
        </div>
    )
}

export default ChatList