import React, { useState } from 'react'

const BlockedList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [blockedUsers, setBlockedUsers] = useState([
        {
            id: 1,
            name: "David Wilson",
            username: "@davidw",
            avatar: "DW",
            blockedDate: "2024-10-15",
            blockedReason: "Spam messages",
            mutualFriends: 0,
            lastInteraction: "2 weeks ago"
        },
        {
            id: 2,
            name: "Amanda White",
            username: "@amandaw",
            avatar: "AW",
            blockedDate: "2024-10-10",
            blockedReason: "Harassment",
            mutualFriends: 3,
            lastInteraction: "1 month ago"
        },
        {
            id: 3,
            name: "Chris Thompson",
            username: "@chrisT",
            avatar: "CT",
            blockedDate: "2024-09-28",
            blockedReason: "Inappropriate content",
            mutualFriends: 7,
            lastInteraction: "2 months ago"
        },
        {
            id: 4,
            name: "Michelle Rodriguez",
            username: "@michR",
            avatar: "MR",
            blockedDate: "2024-09-15",
            blockedReason: "Unknown contact",
            mutualFriends: 2,
            lastInteraction: "3 months ago"
        },
        {
            id: 5,
            name: "Brian Parker",
            username: "@brianp",
            avatar: "BP",
            blockedDate: "2024-08-20",
            blockedReason: "Spam messages",
            mutualFriends: 1,
            lastInteraction: "4 months ago"
        }
    ])

    const filteredUsers = blockedUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.blockedReason.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleUnblock = (userId) => {
        // Simulate unblocking user
        setBlockedUsers(prev => prev.filter(user => user.id !== userId))
    }

    const handleUnblockAll = () => {
        // Simulate unblocking all users
        setBlockedUsers([])
    }

    const formatBlockedDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })
    }

    const getTimeAgo = (interaction) => {
        return interaction // In a real app, you'd calculate this dynamically
    }

    const getReasonColor = (reason) => {
        const colors = {
            'Spam messages': 'bg-orange-100 text-orange-800',
            'Harassment': 'bg-red-100 text-red-800',
            'Inappropriate content': 'bg-purple-100 text-purple-800',
            'Unknown contact': 'bg-gray-100 text-gray-800'
        }
        return colors[reason] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className='flex flex-col h-full'>
            {/* Header */}
            <div className='p-4 border-b border-gray-200 flex-shrink-0'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-xl font-bold text-gray-800'>Blocked Users</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Manage users you've blocked from contacting you
                        </p>
                    </div>

                </div>

                {/* Search Bar */}
                <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </div>
                    <input
                        type='text'
                        placeholder='Search blocked users...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm'
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

            {/* Blocked Users List */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-4'>
                    {/* Stats Header */}
                    {blockedUsers.length > 0 && (
                        <div className='flex items-center justify-between mb-6'>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800'>
                                    Blocked Users ({blockedUsers.length})
                                </h3>
                                <p className='text-sm text-gray-500 mt-1'>
                                    These users cannot send you messages or friend requests
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredUsers.length === 0 && blockedUsers.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                                </svg>
                            </div>
                            <h4 className='text-lg font-semibold text-gray-700 mb-2'>
                                No Blocked Users
                            </h4>
                            <p className='text-gray-500 text-sm max-w-md mx-auto'>
                                Users you block won't be able to send you messages or friend requests. 
                                You can unblock them at any time.
                            </p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <h4 className='text-lg font-semibold text-gray-700 mb-2'>
                                No users found
                            </h4>
                            <p className='text-gray-500 text-sm'>
                                Try adjusting your search terms
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className='p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-red-200 transition-all duration-200'
                                >
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-start space-x-3 flex-1'>
                                            {/* Avatar */}
                                            <div className='relative flex-shrink-0'>
                                                <div className='w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl flex items-center justify-center opacity-60'>
                                                    <span className='text-white text-sm font-bold'>
                                                        {user.avatar}
                                                    </span>
                                                </div>
                                                <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center'>
                                                    <svg className='w-3 h-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* User Info */}
                                            <div className='flex-1 min-w-0'>
                                                <div className='flex items-center space-x-2 mb-1'>
                                                    <h4 className='text-sm font-semibold text-gray-800'>
                                                        {user.name}
                                                    </h4>

                                                </div>
        

                                            </div>
                                        </div>

                                        {/* Unblock Button */}
                                        <button
                                            onClick={() => handleUnblock(user.id)}
                                            className='ml-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 flex-shrink-0'
                                        >
                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                            </svg>
                                            <span>Unblock</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Information Footer */}
            {blockedUsers.length > 0 && (
                <div className='p-4 border-t border-gray-200 bg-blue-50 flex-shrink-0'>
                    <div className='flex items-start space-x-3'>
                        <svg className='w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        <div>
                            <p className='text-sm text-blue-800 font-medium'>About Blocking</p>
                            <p className='text-xs text-blue-600 mt-1'>
                                Blocked users cannot send you messages, see your online status, or send friend requests. 
                                You can unblock users at any time to restore communication.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BlockedList