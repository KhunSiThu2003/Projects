// StatusIndicator.jsx - New component for showing user status
import React from 'react';

const StatusIndicator = ({ status, size = 'small', showText = false }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-2 h-2';
      case 'medium':
        return 'w-3 h-3';
      case 'large':
        return 'w-4 h-4';
      default:
        return 'w-2 h-2';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${getSizeClasses()} ${getStatusColor()} rounded-full border-2 border-white`}></div>
      {showText && (
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      )}
    </div>
  );
};

export default StatusIndicator;