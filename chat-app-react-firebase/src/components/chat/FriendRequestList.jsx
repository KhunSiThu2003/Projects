import React from 'react'
import { FaInbox, FaPaperPlane } from "react-icons/fa"
import { useFriendRequestList } from '../../hooks/chat/useFriendRequestList'

const FriendRequestList = ({ handleSetActiveView, onSelectChat }) => {
    const {
        activeTab,
        setActiveTab,
        loading,
        error,
        currentRequests,
        receivedFriendRequests,
        friendRequests,
        getActionButtons,
        getAvatarContent
    } = useFriendRequestList({ onSelectChat })

    if (error) {
        return (
            <div className="flex flex-col h-full bg-white lg:max-w-90">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800">Friend Requests</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Error loading friend requests</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col h-full bg-white lg:max-w-90'>
            <div className='p-6 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50/50'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Friend Requests</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Manage your incoming and outgoing friend requests
                        </p>
                    </div>
                </div>

                <div className='flex space-x-4 justify-between'>
                    <button
                        onClick={() => setActiveTab('received')}
                        disabled={loading}
                        className={`
                            flex items-center justify-center relative w-full space-x-2 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200
                            ${activeTab === 'received'
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-700 bg-gray-200 hover:bg-gray-100 cursor-pointer'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <span>Received</span>
                        {receivedFriendRequests.length > 0 && (
                            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs rounded-full font-bold bg-blue-500 text-white">
                                {receivedFriendRequests.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('sent')}
                        disabled={loading}
                        className={`
                            flex items-center justify-center relative w-full space-x-2 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200
                            ${activeTab === 'sent'
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-700 bg-gray-200 hover:bg-gray-100 cursor-pointer'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <span>Sent</span>
                        {friendRequests.sent?.length > 0 && (
                            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs rounded-full font-bold bg-orange-500 text-white">
                                {friendRequests.sent.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className='flex-1 overflow-y-auto min-h-0'>
                <div className='p-6'>
                    {loading && currentRequests.length === 0 ? (
                        <div className='space-y-4'>
                            {[1, 2, 3].map((skeleton) => (
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
                    ) : currentRequests.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                {activeTab === 'received' ? (
                                    <FaInbox className='w-10 h-10 text-gray-500' />
                                ) : (
                                    <FaPaperPlane className='w-10 h-10 text-gray-500' />
                                )}
                            </div>

                            <h4 className='text-md font-bold text-gray-700 mb-3 text-center'>
                                {activeTab === 'received' ? 'No Friend Requests' : 'No Sent Requests'}
                            </h4>
                            <p className='text-gray-500 text-sm max-w-md mx-auto mb-6 text-center'>
                                {activeTab === 'received'
                                    ? "You don't have any pending friend requests right now. When someone sends you a request, it will appear here."
                                    : "You haven't sent any friend requests yet. Search for users to send them friend requests."}
                            </p>

                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {currentRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className='group p-4 rounded-md cursor-pointer transition-all duration-200 border border-gray-100 hover:bg-gray-50 hover:border-blue-100 hover:shadow-md'
                                >
                                    <div className='flex items-start space-x-3'>
                                        <div className='relative flex-shrink-0'>
                                            {getAvatarContent(request)}
                                            {request.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>

                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <div className='flex items-center gap-2'>
                                                    <h4 className='text-sm font-semibold text-gray-800 truncate'>
                                                        {request.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <p className='text-sm text-gray-600 truncate leading-tight mb-1'>
                                                {request.email}
                                            </p>

                                            <p className={`text-xs capitalize ${request.isOnline ? 'text-green-600 font-medium' : 'text-gray-500'
                                                }`}>
                                                {request.isOnline ? 'Online' : `Last seen: ${request.timestamp}`}
                                            </p>

                                            {request.bio && request.bio !== "Hey there! I'm using ChatApp 💬" && (
                                                <p className='text-xs text-gray-500 truncate mt-1'>
                                                    {request.bio}
                                                </p>
                                            )}
                                        </div>


                                    </div>
                                    <div className='flex items-center justify-end mt-2'>
                                        {getActionButtons(request, activeTab)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading && currentRequests.length > 0 && (
                <div className="p-3 text-center border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Updating requests...</p>
                </div>
            )}
        </div>
    )
}

export default FriendRequestList