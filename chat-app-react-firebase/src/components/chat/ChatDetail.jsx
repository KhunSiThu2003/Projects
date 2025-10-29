import React from 'react'

const ChatDetail = ({ onBack }) => {
  // Mock data for the current friend in chat
  const currentFriend = {
    name: "Theme Vanhorn",
    status: "Online",
    avatar: "TR",
    role: "Project Manager",
    email: "theme.vanhorn@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Working on the new project structure and bug fixes.",
    lastSeen: "2 minutes ago"
  }

  const sharedMedia = [
    { type: 'image', name: 'project-structure.png', date: 'Today, 10:15 AM' },
    { type: 'document', name: 'requirements.pdf', date: 'Yesterday, 3:30 PM' },
    { type: 'image', name: 'bug-screenshot.jpg', date: 'Oct 28, 2024' },
    { type: 'link', name: 'project-docs.com', date: 'Oct 25, 2024' }
  ]

  const features = [
    { icon: '👁️', title: 'View Profile' },
    { icon: '⭐', title: 'Add to Favorites' },
    { icon: '📎', title: 'Shared Media' },
    { icon: '🔕', title: 'Mute Notifications' },
    { icon: '🚫', title: 'Block User' },
    { icon: '🗑️', title: 'Clear Chat' }
  ]

  return (
    <section className='w-full lg:w-80 bg-white border-l border-gray-200 overflow-y-auto h-full'>
      {/* Header with Back Button for Mobile */}
      <div className='p-4 border-b border-gray-200 flex items-center space-x-3 lg:hidden'>
        <button 
          onClick={onBack}
          className='p-2 text-gray-500 hover:text-gray-700 transition-colors'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </button>
        <h2 className='text-lg font-semibold text-gray-800'>Profile</h2>
      </div>

      {/* Friend Profile Header */}
      <div className='p-6 border-b border-gray-200'>
        <div className='text-center'>
          <div className='w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-white text-2xl font-bold'>{currentFriend.avatar}</span>
          </div>
          <h2 className='text-xl font-semibold text-gray-800 mb-1'>{currentFriend.name}</h2>
          <div className='flex items-center justify-center space-x-2 mb-3'>
            <span className={`w-2 h-2 rounded-full ${currentFriend.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className='text-sm text-gray-500'>{currentFriend.status}</span>
            {currentFriend.status === 'Online' && (
              <span className='text-xs text-gray-400'>• {currentFriend.lastSeen}</span>
            )}
          </div>
          <p className='text-sm text-gray-600 mb-4'>{currentFriend.bio}</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className='p-6 border-b border-gray-200'>
        <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4'>
          Contact Information
        </h3>
        <div className='space-y-3'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-800'>{currentFriend.role}</p>
              <p className='text-xs text-gray-500'>Role</p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-800'>{currentFriend.email}</p>
              <p className='text-xs text-gray-500'>Email</p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <svg className='w-4 h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-800'>{currentFriend.phone}</p>
              <p className='text-xs text-gray-500'>Phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Media */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>
            Shared Media
          </h3>
          <span className='text-xs text-blue-600 cursor-pointer hover:text-blue-700'>View All</span>
        </div>
        <div className='grid grid-cols-3 gap-2 mb-3'>
          {sharedMedia.slice(0, 3).map((media, index) => (
            <div key={index} className='aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors'>
              {media.type === 'image' ? (
                <svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
              ) : media.type === 'document' ? (
                <svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              ) : (
                <svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='p-6'>
        <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4'>
          Quick Actions
        </h3>
        <div className='space-y-1'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'
            >
              <span className='text-lg'>{feature.icon}</span>
              <span className='text-sm text-gray-700'>{feature.title}</span>
            </div>
          ))}
        </div>

        {/* Call Buttons */}
        <div className='grid grid-cols-2 gap-3 mt-6'>
          <button className='flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
            </svg>
            <span className='text-sm'>Call</span>
          </button>
          <button className='flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
            </svg>
            <span className='text-sm'>Video</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatDetail
