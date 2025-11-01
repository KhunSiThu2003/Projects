import React from 'react'
import { FaSearch } from "react-icons/fa"
import { useSearchFriend } from '../../hooks/chat/useSearchFriend'

const SearchFriend = ({ handleSetActiveView, onSelectChat }) => {
    const {
        searchTerm,
        setSearchTerm,
        searchResults,
        isSearching,
        loadingStates,
        handleSearch,
        getActionButtons,
        getAvatarContent
    } = useSearchFriend()

    return (
        <div className='flex flex-col h-full bg-white lg:max-w-90'>
            <div className='p-6 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50/50'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h2 className='text-2xl font-bold text-gray-800'>Search Friends</h2>
                        <p className='text-sm text-gray-500 mt-1'>
                            Find and connect with people
                        </p>
                    </div>
                </div>

                <div className='relative'>
                    <div className='absolute z-40 inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <FaSearch className='h-4 w-4 text-gray-400' />
                    </div>
                    <input
                        type='text'
                        placeholder='Search by name or email...'
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => handleSearch('')}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-600 hover:text-gray-800 transition-colors duration-200'
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
                    {searchTerm && (
                        <div className='flex items-center justify-between mb-6'>
                            <div>
                                <h3 className='text-xl font-bold text-gray-800'>
                                    Search Results
                                </h3>
                                <p className='text-sm text-gray-500 mt-1'>
                                    {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                            <span className='text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium'>
                                {searchResults.length} results
                            </span>
                        </div>
                    )}

                    {!searchTerm ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                <FaSearch className='w-10 h-10 text-gray-500' />
                            </div>
                            <h4 className='text-xl font-bold text-gray-700 mb-3 text-center'>
                                Find Friends
                            </h4>
                            <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6 text-center'>
                                Search for friends by their name or email to connect and start chatting
                            </p>
                        </div>
                    ) : isSearching ? (
                        <div className='space-y-4'>
                            {[1, 2, 3, 4].map((skeleton) => (
                                <div key={skeleton} className='flex items-center space-x-4 p-4 animate-pulse bg-gray-50 rounded-2xl'>
                                    <div className='w-12 h-12 bg-gray-200 rounded-full'></div>
                                    <div className='flex-1 space-y-2'>
                                        <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                                        <div className='h-3 bg-gray-200 rounded w-3/4'></div>
                                        <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                                    </div>
                                    <div className='w-20 h-9 bg-gray-200 rounded-lg'></div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className='text-center py-16'>
                            <div className='w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
                                <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <h4 className='text-xl font-bold text-gray-700 mb-3'>
                                No users found
                            </h4>
                            <p className='text-gray-500 text-sm max-w-sm mx-auto mb-6'>
                                Try searching with a different name or email address
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className='duration-200 w-32 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-md transition-all hover:bg-black hover:text-white hover:border-gray-300 shadow-sm hover:shadow-md font-medium'
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {searchResults.map((userData) => (
                                <div
                                    key={userData.uid}
                                    className='group p-4 rounded-md cursor-pointer transition-all duration-200 border border-gray-100 hover:bg-gray-50 hover:border-blue-100 hover:shadow-md'
                                >
                                    <div className='flex items-start space-x-3'>
                                        <div className='relative flex-shrink-0'>
                                            {getAvatarContent(userData)}
                                            {userData.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>

                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <div className='flex items-center gap-2'>
                                                    <h4 className='text-sm font-semibold text-gray-800 truncate'>
                                                        {userData.fullName}
                                                    </h4>
                                                    {userData.isVerified && (
                                                        <svg className='w-4 h-4 text-blue-500 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                                                            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                                        </svg>
                                                    )}
                                                </div>

                                            </div>

                                            <p className='text-sm text-gray-600 truncate leading-tight mb-1'>
                                                {userData.email}
                                            </p>

                                            <p className={`text-xs capitalize ${userData.isOnline ? 'text-green-600 font-medium' : 'text-gray-500'
                                                }`}>
                                                {userData.isOnline ? 'Online' : 'Offline'}
                                            </p>

                                            {userData.bio && userData.bio !== "Hey there! I'm using ChatApp 💬" && (
                                                <p className='text-xs text-gray-500 truncate mt-1'>
                                                    {userData.bio}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-end mt-3">
                                                {getActionButtons(userData, onSelectChat)}
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

// Add the same formatLastSeen function from FriendList
const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';

    const now = new Date();
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return lastSeenDate.toLocaleDateString();
};

export default SearchFriend