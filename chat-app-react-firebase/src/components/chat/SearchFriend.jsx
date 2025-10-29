import React, { useState } from 'react'

const SearchFriend = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    // Mock data for search results with all friend states
    const allUsers = [
        {
            id: 1,
            name: "Alex Johnson",
            username: "@alexj",
            mutualFriends: 12,
            status: "add", // Can add as friend
            avatar: "AJ",
            isOnline: true
        },
        {
            id: 2,
            name: "Sarah Miller",
            username: "@sarahm",
            mutualFriends: 8,
            status: "friend", // Already friends
            avatar: "SM",
            isOnline: false
        },
        {
            id: 3,
            name: "Mike Chen",
            username: "@mikec",
            mutualFriends: 3,
            status: "request_sent", // Friend request sent
            avatar: "MC",
            isOnline: true
        },
        {
            id: 4,
            name: "Emily Davis",
            username: "@emilyd",
            mutualFriends: 15,
            status: "request_received", // Received friend request
            avatar: "ED",
            isOnline: true
        },
        {
            id: 5,
            name: "David Wilson",
            username: "@davidw",
            mutualFriends: 0,
            status: "blocked", // User is blocked
            avatar: "DW",
            isOnline: false
        },
        {
            id: 6,
            name: "Lisa Brown",
            username: "@lisab",
            mutualFriends: 5,
            status: "friend", // Already friends
            avatar: "LB",
            isOnline: true
        },
        {
            id: 7,
            name: "Kevin Martinez",
            username: "@kevinm",
            mutualFriends: 7,
            status: "add", // Can add as friend
            avatar: "KM",
            isOnline: false
        },
        {
            id: 8,
            name: "Jennifer Taylor",
            username: "@jennifert",
            mutualFriends: 20,
            status: "friend", // Already friends
            avatar: "JT",
            isOnline: true
        },
        {
            id: 9,
            name: "Robert Garcia",
            username: "@robertg",
            mutualFriends: 2,
            status: "request_sent", // Friend request sent
            avatar: "RG",
            isOnline: false
        },
        {
            id: 10,
            name: "Amanda White",
            username: "@amandaw",
            mutualFriends: 10,
            status: "request_received", // Received friend request
            avatar: "AW",
            isOnline: true
        }
    ]

    const handleSearch = (term) => {
        setSearchTerm(term)
        
        if (term.trim() === '') {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        
        // Simulate API search delay
        setTimeout(() => {
            const results = allUsers.filter(user =>
                user.name.toLowerCase().includes(term.toLowerCase()) ||
                user.username.toLowerCase().includes(term.toLowerCase())
            )
            setSearchResults(results)
            setIsSearching(false)
        }, 500)
    }

    const handleAddFriend = (userId) => {
        // Simulate sending friend request
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "request_sent" }
                    : user
            )
        )
    }

    const handleCancelRequest = (userId) => {
        // Simulate canceling friend request
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "add" }
                    : user
            )
        )
    }

    const handleAcceptRequest = (userId) => {
        // Simulate accepting friend request
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "friend" }
                    : user
            )
        )
    }

    const handleDeclineRequest = (userId) => {
        // Simulate declining friend request
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "add" }
                    : user
            )
        )
    }

    const handleUnfriend = (userId) => {
        // Simulate unfriending
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "add" }
                    : user
            )
        )
    }

    const handleBlock = (userId) => {
        // Simulate blocking user
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "blocked" }
                    : user
            )
        )
    }

    const handleUnblock = (userId) => {
        // Simulate unblocking user
        setSearchResults(prev => 
            prev.map(user => 
                user.id === userId 
                    ? { ...user, status: "add" }
                    : user
            )
        )
    }

    const handleMessage = (user) => {
        // Handle start conversation with friend
        console.log('Start conversation with:', user.name)
    }

    const getStatusBadge = (status) => {
        const badges = {
            add: { label: "Add Friend", color: "bg-green-500" },
            request_sent: { label: "Request Sent", color: "bg-yellow-500" },
            request_received: { label: "Request Received", color: "bg-blue-500" },
            friend: { label: "Friends", color: "bg-purple-500" },
            blocked: { label: "Blocked", color: "bg-red-500" }
        }
        const badge = badges[status]
        return (
            <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}>
                {badge.label}
            </span>
        )
    }

    const getActionButtons = (user) => {
        switch (user.status) {
            case "add":
                return (
                    <button
                        onClick={() => handleAddFriend(user.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Friend</span>
                    </button>
                )
            
            case "request_sent":
                return (
                    <button
                        onClick={() => handleCancelRequest(user.id)}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                        Cancel Request
                    </button>
                )
            
            case "request_received":
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleAcceptRequest(user.id)}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleDeclineRequest(user.id)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                            Decline
                        </button>
                    </div>
                )
            
            case "friend":
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleMessage(user)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                            Message
                        </button>
                        <div className="relative group">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <button
                                    onClick={() => handleUnfriend(user.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    Unfriend
                                </button>
                                <button
                                    onClick={() => handleBlock(user.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    Block
                                </button>
                            </div>
                        </div>
                    </div>
                )
            
            case "blocked":
                return (
                    <button
                        onClick={() => handleUnblock(user.id)}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                        Unblock
                    </button>
                )
            
            default:
                return null
        }
    }

    return (
        <div className='flex flex-col h-full'>
            {/* Search Header */}
            <div className='p-4 border-b border-gray-200 flex-shrink-0'>
                <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </div>
                    <input
                        type='text'
                        placeholder='Search for friends by name or username...'
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => handleSearch('')}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
                        >
                            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-4'>
                    {/* Results Header */}
                    {searchTerm && (
                        <div className='flex items-center justify-between mb-6'>
                            <h3 className='text-lg font-semibold text-gray-800'>
                                Search Results
                            </h3>
                            <span className='text-sm text-gray-500'>
                                {searchResults.length} found
                            </span>
                        </div>
                    )}

                    {/* Search States */}
                    {!searchTerm ? (
                        <div className='text-center py-16'>
                            <div className='w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-8 h-8 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                                </svg>
                            </div>
                            <h4 className='text-lg font-semibold text-gray-700 mb-2'>
                                Find Friends
                            </h4>
                            <p className='text-gray-500 text-sm max-w-md mx-auto'>
                                Search for friends by their name or username to connect and start chatting
                            </p>
                        </div>
                    ) : isSearching ? (
                        <div className='space-y-4'>
                            {[1, 2, 3].map((skeleton) => (
                                <div key={skeleton} className='flex items-center space-x-3 p-3 animate-pulse'>
                                    <div className='w-12 h-12 bg-gray-200 rounded-xl'></div>
                                    <div className='flex-1 space-y-2'>
                                        <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                                        <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                                    </div>
                                    <div className='w-20 h-8 bg-gray-200 rounded-lg'></div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length === 0 ? (
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
                                Try searching with a different name or username
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className='p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200'
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center space-x-3 flex-1'>
                                            {/* Avatar */}
                                            <div className='relative flex-shrink-0'>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    user.status === 'blocked' 
                                                        ? 'bg-gradient-to-r from-gray-400 to-gray-600 opacity-60' 
                                                        : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                                }`}>
                                                    <span className='text-white text-sm font-bold'>
                                                        {user.avatar}
                                                    </span>
                                                </div>
                                                {user.isOnline && user.status !== 'blocked' && (
                                                    <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div className='flex-1 min-w-0'>
                                                <div className='flex items-center space-x-2 mb-1'>
                                                    <h4 className={`text-sm font-semibold truncate ${
                                                        user.status === 'blocked' ? 'text-gray-400' : 'text-gray-800'
                                                    }`}>
                                                        {user.name}
                                                    </h4>
                                                    {user.isOnline && user.status !== 'blocked' && (
                                                        <span className='w-2 h-2 bg-green-500 rounded-full flex-shrink-0'></span>
                                                    )}
                                                </div>
                                                <p className={`text-sm mb-1 ${
                                                    user.status === 'blocked' ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                    {user.username}
                                                </p>
                                                <div className="flex items-center space-x-2">
                                                    <p className={`text-xs ${
                                                        user.status === 'blocked' ? 'text-gray-400' : 'text-gray-400'
                                                    }`}>
                                                        {user.mutualFriends} mutual friends
                                                    </p>
                                                    
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex items-center space-x-2 flex-shrink-0'>
                                            {getActionButtons(user)}
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

export default SearchFriend