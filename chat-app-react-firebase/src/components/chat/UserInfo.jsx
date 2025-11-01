// UserInfo.jsx - Updated with profile button
import React from 'react';
import { FaUser } from 'react-icons/fa';
import useUserStore from '../../stores/useUserStore';

const UserInfo = ({ onOpenProfile }) => {
  const { user } = useUserStore();

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <button
      onClick={onOpenProfile}
      className="flex items-center justify-center space-x-3 rounded-lg cursor-pointer transition-colors duration-200 md:w-full hover:bg-gray-50 "
    >
      <div className="relative">
        {user?.profilePic ? (
          <img
            src={user.profilePic}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold border-2 border-gray-200">
            <FaUser size={16} />
          </div>
        )}
        <div className="absolute bottom-0 right-0 flex items-center justify-center w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 border border-gray-200 bg-green-500"></span>
        </div>
      </div>
    </button>
  );
};

export default UserInfo;