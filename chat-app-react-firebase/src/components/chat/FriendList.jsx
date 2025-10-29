import React, { useState } from 'react'

const FriendList = ({ onSelectChat }) => {
    const [searchTerm, setSearchTerm] = useState('')

    const friends = [
        {
            name: "Line Roy",
            message: "Then'd, via meeting with client finances.",
            active: true
        },
        {
            name: "Brad Frost",
            message: "Not to meet you!",
            active: false
        },
        {
            name: "Paul Irish",
            message: "Then'd look their chat waiting from boredom.",
            active: true
        },
        {
            name: "Jessica Glory",
            message: "Then'd found books.",
            active: false
        },
        {
            name: "John Doe",
            message: "If it is the second component will be completed today.",
            active: true
        },
        {
            name: "Eric Petersen",
            message: "First of all men with the company CEO and GLA.",
            active: false
        },
        {
            name: "John Doe",
            message: "If it is the second component will be completed today.",
            active: true
        },
        {
            name: "Line Roy",
            message: "Then'd, via meeting with client finances.",
            active: true
        },
        {
            name: "Brad Frost",
            message: "Not to meet you!",
            active: false
        },
        {
            name: "Paul Irish",
            message: "Then'd look their chat waiting from boredom.",
            active: true
        },
        {
            name: "Jessica Glory",
            message: "Then'd found books.",
            active: false
        },
        {
            name: "John Doe",
            message: "If it is the second component will be completed today.",
            active: true
        },
        {
            name: "Eric Petersen",
            message: "First of all men with the company CEO and GLA.",
            active: false
        }

    ]

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className='flex flex-col h-full'> {/* Changed to flex-col and h-full */}

            {/* Search Bar */}
            <div className='p-4 border-b border-gray-200 flex-shrink-0'> {/* Added flex-shrink-0 */}
                <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </div>
                    <input
                        type='text'
                        placeholder='Search friends...'
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

            {/* Friends List - Fixed scrolling area */}
            <div className='flex-1 overflow-y-auto min-h-0'> {/* Changed to min-h-0 and proper overflow */}
                <div className='p-4'>
                    <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>
                            Shop in Friends
                        </h3>
                        <span className='text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded'>
                            {filteredFriends.length} friends
                        </span>
                    </div>

                    {filteredFriends.length === 0 ? (
                        <div className='text-center py-8'>
                            <svg className='w-12 h-12 text-gray-300 mx-auto mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                            <p className='text-gray-500 text-sm'>No friends found</p>
                            <p className='text-gray-400 text-xs mt-1'>Try adjusting your search terms</p>
                        </div>
                    ) : (
                        <div className='space-y-2'>
                            {filteredFriends.map((friend, index) => (
                                <div
                                    key={index}
                                    onClick={onSelectChat}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${friend.active
                                            ? 'bg-blue-50 border border-blue-100 shadow-sm'
                                            : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <div className='flex items-start space-x-3'>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${friend.active
                                                ? 'bg-gradient-to-r from-green-400 to-blue-500'
                                                : 'bg-gradient-to-r from-gray-400 to-gray-600'
                                            }`}>
                                            <span className='text-white text-sm font-medium'>
                                                {friend.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between'>
                                                <h4 className='text-sm font-semibold text-gray-800 truncate'>
                                                    {friend.name}
                                                </h4>
                                                {friend.active && (
                                                    <span className='w-2 h-2 bg-green-500 rounded-full flex-shrink-0'></span>
                                                )}
                                            </div>
                                            <p className='text-xs text-gray-500 truncate mt-1'>
                                                {friend.message}
                                            </p>
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

export default FriendList