import React, { useState } from 'react'

const FriendRequestList = () => {
    const [activeTab, setActiveTab] = useState('received') // 'received' or 'sent'

    // Mock data for friend requests
    const friendRequests = {
        received: [
            {
                id: 1,
                name: "Alex Johnson",
                username: "@alexj",
                mutualFriends: 12,
                avatar: "AJ",
                isOnline: true,
                timestamp: "2 hours ago",
                message: "Hi! We have many mutual friends and I'd love to connect."
            },
            {
                id: 2,
                name: "Mike Chen",
                username: "@mikec",
                mutualFriends: 3,
                avatar: "MC",
                isOnline: false,
                timestamp: "1 day ago",
                message: "Let's connect and chat about our common interests!"
            },
            {
                id: 3,
                name: "Emily Davis",
                username: "@emilyd",
                mutualFriends: 15,
                avatar: "ED",
                isOnline: true,
                timestamp: "3 days ago",
                message: "Hey there! Would love to be friends."
            },
            {
                id: 4,
                name: "Robert Garcia",
                username: "@robertg",
                mutualFriends: 2,
                avatar: "RG",
                isOnline: false,
                timestamp: "1 week ago",
                message: "We work in the same industry, let's connect!"
            }
        ],
        sent: [
            {
                id: 5,
                name: "Sarah Miller",
                username: "@sarahm",
                mutualFriends: 8,
                avatar: "SM",
                isOnline: false,
                timestamp: "1 day ago",
                status: "pending"
            },
            {
                id: 6,
                name: "Kevin Martinez",
                username: "@kevinm",
                mutualFriends: 7,
                avatar: "KM",
                isOnline: true,
                timestamp: "3 days ago",
                status: "pending"
            },
            {
                id: 7,
                name: "Lisa Brown",
                username: "@lisab",
                mutualFriends: 5,
                avatar: "LB",
                isOnline: false,
                timestamp: "1 week ago",
                status: "pending"
            }
        ]
    }

    const handleAcceptRequest = (requestId) => {
        // Simulate accepting friend request
        console.log('Accept request:', requestId)
        // Remove from received requests and add to friends list
        const updatedRequests = friendRequests.received.filter(req => req.id !== requestId)
        // In real app, you would update state here
    }

    const handleDeclineRequest = (requestId) => {
        // Simulate declining friend request
        console.log('Decline request:', requestId)
        // Remove from received requests
        const updatedRequests = friendRequests.received.filter(req => req.id !== requestId)
        // In real app, you would update state here
    }

    const handleCancelRequest = (requestId) => {
        // Simulate canceling sent request
        console.log('Cancel request:', requestId)
        // Remove from sent requests
        const updatedRequests = friendRequests.sent.filter(req => req.id !== requestId)
        // In real app, you would update state here
    }

    const handleMessage = (user) => {
        // Handle message after accepting request
        console.log('Message user:', user.name)
    }

    const currentRequests = friendRequests[activeTab]

    return (
        <div className='flex flex-col h-full'>
            {/* Header */}
            <div className='p-4 border-b border-gray-200 flex-shrink-0'>
                <h2 className='text-xl font-bold text-gray-800 mb-2'>Friend Requests</h2>
                
                {/* Tab Navigation */}
                <div className='flex space-x-1 bg-gray-100 rounded-lg p-1'>
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                            activeTab === 'received'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Received
                        <span className='ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
                            {friendRequests.received.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                            activeTab === 'sent'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Sent
                        <span className='ml-1 bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded-full'>
                            {friendRequests.sent.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Requests List */}
            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-4'>
                    {currentRequests.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                                {activeTab === 'received' ? (
                                    <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                                    </svg>
                                ) : (
                                    <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 4v16m8-8H4' />
                                    </svg>
                                )}
                            </div>
                            <h4 className='text-lg font-semibold text-gray-700 mb-2'>
                                {activeTab === 'received' ? 'No Friend Requests' : 'No Sent Requests'}
                            </h4>
                            <p className='text-gray-500 text-sm'>
                                {activeTab === 'received' 
                                    ? "You don't have any pending friend requests right now." 
                                    : "You haven't sent any friend requests yet."}
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {currentRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className='p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200'
                                >
                                    <div className='flex items-start space-x-3'>
                                        {/* Avatar */}
                                        <div className='relative flex-shrink-0'>
                                            <div className='w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
                                                <span className='text-white text-base font-bold'>
                                                    {request.avatar}
                                                </span>
                                            </div>
                                            {request.isOnline && (
                                                <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
                                            )}
                                        </div>

                                        {/* Request Info */}
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-start justify-between mb-2'>
                                                <div>
                                                    <div className='flex items-center space-x-2 mb-1'>
                                                        <h4 className='text-sm font-semibold text-gray-800'>
                                                            {request.name}
                                                        </h4>
                                                        {request.isOnline && (
                                                            <span className='w-2 h-2 bg-green-500 rounded-full flex-shrink-0'></span>
                                                        )}
                                                    </div>
                                                    <p className='text-sm text-gray-500 mb-1'>
                                                        {request.username}
                                                    </p>
                                                    <p className='text-xs text-gray-400'>
                                                        {request.mutualFriends} mutual friends • {request.timestamp}
                                                    </p>
                                                </div>
                                                {activeTab === 'sent' && (
                                                    <span className='text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full'>
                                                        Pending
                                                    </span>
                                                )}
                                            </div>

                                            {/* Request Message (for received requests) */}
                                            {activeTab === 'received' && request.message && (
                                                <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                                                    <p className='text-sm text-gray-600'>
                                                        "{request.message}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className='flex space-x-2'>
                                                {activeTab === 'received' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptRequest(request.id)}
                                                            className='flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm'
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineRequest(request.id)}
                                                            className='flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm'
                                                        >
                                                            Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleCancelRequest(request.id)}
                                                            className='flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm'
                                                        >
                                                            Cancel Request
                                                        </button>
                                                        {request.isOnline && (
                                                            <button
                                                                onClick={() => handleMessage(request)}
                                                                className='px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 font-medium text-sm'
                                                            >
                                                                Message
                                                            </button>
                                                        )}
                                                    </>
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

            {/* Quick Actions Footer */}
            {activeTab === 'received' && friendRequests.received.length > 0 && (
                <div className='p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50'>
                    <div className='flex space-x-2'>
                        <button className='flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm'>
                            Accept All
                        </button>
                        <button className='flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm'>
                            Decline All
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FriendRequestList