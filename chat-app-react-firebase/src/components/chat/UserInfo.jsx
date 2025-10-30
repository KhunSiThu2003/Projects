// UserInfo.jsx - Updated with profile modal
import React, { useState } from 'react'
import useUserStore from "../../stores/useUserStore";


const UserInfo = ({ setIsProfileModalOpen }) => {
    const { user } = useUserStore();
    
    const getAvatarContent = () => {
        if (user?.profilePic) {
            return (
                <img 
                    src={user.profilePic} 
                    alt={user.fullName || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsProfileModalOpen(true)}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                        }
                    }}
                />
            )
        }
        
        const avatarText = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
        return (
            <div 
                className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white cursor-pointer hover:opacity-90 transition-opacity'
                onClick={() => setIsProfileModalOpen(true)}
            >
                <span className="text-sm font-bold">{avatarText}</span>
            </div>
        )
    }

    return (
        <>
            <div className='flex items-center space-x-3 min-w-0'>
                <div className="relative flex-shrink-0">
                    {getAvatarContent()}
                    <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
                </div>
            </div>
        </>
    )
}

export default UserInfo