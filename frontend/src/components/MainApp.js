import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import AdminPanel from './AdminPanel';
import ForumPanel from './ForumPanel';
import FriendsPanel from './FriendsPanel';
import ProfileModal from './ProfileModal';
import { Menu, X } from 'lucide-react';

const MainApp = () => {
  const { currentUser, logout, rooms, currentRoom, setCurrentRoom, servers, currentServer } = useApp();
  const [activePanel, setActivePanel] = useState('home');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const serverInfo = servers[currentServer];

  const handleRoomSelect = (room) => {
    setCurrentRoom(room);
    setActivePanel('chat');
    setShowMobileSidebar(false);
  };

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  return (
    <div className="main-app" data-testid="main-app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="menu-toggle" 
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          data-testid="mobile-menu-toggle"
        >
          {showMobileSidebar ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-title">{serverInfo?.name || 'Nature.co'}</div>
        <div 
          className="mobile-avatar"
          style={{ background: currentUser?.color || '#5b9bd5' }}
          onClick={() => handleViewProfile(currentUser?.id)}
          data-testid="mobile-avatar"
        >
          {currentUser?.username?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        onRoomSelect={handleRoomSelect}
        onViewProfile={handleViewProfile}
      />

      {/* Main Content */}
      <div className="main-content">
        {activePanel === 'home' && !currentRoom && (
          <div className="welcome-screen" data-testid="welcome-screen">
            <div className="welcome-icon">🌿</div>
            <h2>Nature.co'ya Hoş Geldin</h2>
            <p>Soldaki listeden bir kanal, grup veya kişi seçerek sohbete başla</p>
          </div>
        )}

        {(activePanel === 'chat' || currentRoom) && currentRoom && (
          <ChatArea 
            room={currentRoom} 
            onViewProfile={handleViewProfile}
          />
        )}

        {activePanel === 'admin' && (
          <AdminPanel />
        )}

        {activePanel === 'forum' && (
          <ForumPanel onViewProfile={handleViewProfile} />
        )}

        {activePanel === 'friends' && (
          <FriendsPanel onViewProfile={handleViewProfile} />
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          userId={selectedUserId}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default MainApp;
