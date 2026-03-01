import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Circle, ChevronDown } from 'lucide-react';

const StatusDropdown = () => {
  const { userStatus, updateUserStatus, currentUser } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  const statuses = [
    { value: 'online', label: 'Çevrimiçi', color: '#43b581', emoji: '🟢' },
    { value: 'away', label: 'Uzakta', color: '#faa61a', emoji: '🟡' },
    { value: 'busy', label: 'Meşgul', color: '#f04747', emoji: '🔴' },
    { value: 'invisible', label: 'Görünmez', color: '#747f8d', emoji: '⚫' }
  ];

  const currentStatus = statuses.find(s => s.value === userStatus) || statuses[0];

  const handleStatusChange = (status) => {
    if (updateUserStatus) {
      updateUserStatus(status);
    }
    setShowDropdown(false);
  };

  if (!currentUser) return null;

  return (
    <div className="status-dropdown-container">
      <button 
        className="status-dropdown-trigger"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className="status-emoji">{currentStatus.emoji}</span>
        <span className="status-label">{currentStatus.label}</span>
        <ChevronDown size={14} />
      </button>

      {showDropdown && (
        <>
          <div 
            className="status-dropdown-overlay" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="status-dropdown-menu">
            {statuses.map(status => (
              <button
                key={status.value}
                className={`status-option ${userStatus === status.value ? 'active' : ''}`}
                onClick={() => handleStatusChange(status.value)}
              >
                <span className="status-emoji">{status.emoji}</span>
                <div className="status-option-info">
                  <span className="status-option-label">{status.label}</span>
                </div>
                {userStatus === status.value && (
                  <Circle size={8} fill="currentColor" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StatusDropdown;
