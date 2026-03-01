import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import AdminPanel from './AdminPanel';
import ForumPanel from './ForumPanel';
import FriendsPanel from './FriendsPanel';
import ProfileModal from './ProfileModal';
import { Home, FileText, Users, Tv, Settings } from 'lucide-react';

const MainApp = () => {
  const { currentUser, currentRoom, setCurrentRoom, isAdmin, servers, currentServer } = useApp();
  const [activePanel, setActivePanel] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const serverInfo = servers[currentServer];

  const handleRoomSelect = (room) => {
    setCurrentRoom(room);
    setActivePanel('chat');
  };

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  // Yaprak logo SVG
  const LeafLogo = () => (
    <svg viewBox="0 0 120 120" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="leafClip">
          <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" />
        </clipPath>
      </defs>
      <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" fill="#0e2b0c" />
      <g clipPath="url(#leafClip)">
        <line x1="60" y1="14" x2="60" y2="108" stroke="#4a8f40" strokeWidth="1.2" />
        <line x1="60" y1="35" x2="78" y2="55" stroke="#4a8f40" strokeWidth=".7" />
        <line x1="60" y1="35" x2="42" y2="55" stroke="#4a8f40" strokeWidth=".7" />
        <line x1="60" y1="52" x2="82" y2="68" stroke="#4a8f40" strokeWidth=".6" />
        <line x1="60" y1="52" x2="38" y2="68" stroke="#4a8f40" strokeWidth=".6" />
        <line x1="60" y1="68" x2="78" y2="82" stroke="#4a8f40" strokeWidth=".5" />
        <line x1="60" y1="68" x2="42" y2="82" stroke="#4a8f40" strokeWidth=".5" />
        <line x1="60" y1="82" x2="70" y2="94" stroke="#4a8f40" strokeWidth=".4" />
        <line x1="60" y1="82" x2="50" y2="94" stroke="#4a8f40" strokeWidth=".4" />
      </g>
      <path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" fill="none" stroke="#4a8f40" strokeWidth="1.2" />
    </svg>
  );

  // Robot Evi SVG
  const RobotHouseIcon = () => (
    <svg width="26" height="22" viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="55" cy="88" rx="46" ry="6" fill="rgba(74,143,64,.25)" />
      <rect x="10" y="42" width="90" height="46" rx="4" fill="#1a2a1a" stroke="#2d5a2d" strokeWidth="1.5" />
      <path d="M4 44 L55 6 L106 44 Z" fill="#2d5a20" stroke="#4a8f40" strokeWidth="1.5" />
      <path d="M8 44 L55 10 L102 44 Z" fill="#3a7a28" />
      <line x1="55" y1="10" x2="55" y2="44" stroke="#2d5a20" strokeWidth="1" />
      <line x1="29" y1="32" x2="81" y2="32" stroke="#2d5a20" strokeWidth=".8" />
      <circle cx="55" cy="6" r="4" fill="#4a8f40" />
      <circle cx="55" cy="6" r="2" fill="#6dbf67" />
      <rect x="10" y="44" width="90" height="44" rx="3" fill="#0f1f0f" stroke="#1a3a1a" strokeWidth="1" />
      <path d="M38 88 L38 62 Q38 52 55 52 Q72 52 72 62 L72 88 Z" fill="#0a150a" />
      <rect x="34" y="30" width="42" height="13" rx="4" fill="#1a3a10" stroke="#4a8f40" strokeWidth="1" />
      <text x="55" y="40" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#6dbf67" fontFamily="monospace">NatureBot</text>
      <rect x="15" y="52" width="18" height="14" rx="2" fill="#0a1a0a" stroke="#2d5a2d" strokeWidth="1" />
      <line x1="24" y1="52" x2="24" y2="66" stroke="#2d5a2d" strokeWidth=".8" />
      <line x1="15" y1="59" x2="33" y2="59" stroke="#2d5a2d" strokeWidth=".8" />
      <rect x="77" y="52" width="18" height="14" rx="2" fill="#0a1a0a" stroke="#2d5a2d" strokeWidth="1" />
      <line x1="86" y1="52" x2="86" y2="66" stroke="#2d5a2d" strokeWidth=".8" />
      <line x1="77" y1="59" x2="95" y2="59" stroke="#2d5a2d" strokeWidth=".8" />
      <circle cx="15" cy="72" r="3" fill="#2d5a20" opacity=".9" />
      <circle cx="95" cy="72" r="3" fill="#2d5a20" opacity=".9" />
    </svg>
  );

  return (
    <div id="desktopShell" data-testid="main-app">
      {/* Icon Rail */}
      <div id="deskRail">
        <div 
          className="rail-logo" 
          title="Sunucu Değiştir"
          style={{ cursor: 'pointer', padding: '4px' }}
        >
          <LeafLogo />
        </div>
        
        <div className="rail-sep" />
        
        <div
          className={`rail-btn ${activePanel === 'home' ? 'act' : ''}`}
          onClick={() => setActivePanel('home')}
          title="Ana Sayfa"
          data-testid="rail-home"
          id="rb-home"
        >
          <div className="rail-btn-ic" style={{ fontSize: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={22} />
          </div>
        </div>
        
        <div
          className={`rail-btn ${activePanel === 'forum' ? 'act' : ''}`}
          onClick={() => setActivePanel('forum')}
          title="Forum"
          data-testid="rail-forum"
          id="rb-forum"
        >
          <div className="rail-btn-ic" style={{ fontSize: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
        </div>
        
        <div
          className={`rail-btn ${activePanel === 'friends' ? 'act' : ''}`}
          onClick={() => setActivePanel('friends')}
          title="Arkadaşlar"
          data-testid="rail-friends"
          id="rb-friends"
        >
          <div className="rail-btn-ic" style={{ fontSize: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
        </div>
        
        <div
          className={`rail-btn ${activePanel === 'watch' ? 'act' : ''}`}
          onClick={() => setActivePanel('watch')}
          title="Canlı İzle"
          data-testid="rail-watch"
          id="rb-watch"
        >
          <div className="rail-btn-ic" style={{ fontSize: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={22} />
          </div>
        </div>
        
        <div
          className="rail-btn"
          title="Robot Evi"
          data-testid="rail-robot"
          id="rb-botHome"
        >
          <div className="rail-btn-ic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RobotHouseIcon />
          </div>
        </div>
        
        <div className="rail-sep" />
        
        {isAdmin() && (
          <div
            className={`rail-btn ${activePanel === 'admin' ? 'act' : ''}`}
            onClick={() => setActivePanel('admin')}
            title="Admin Paneli"
            data-testid="rail-admin"
            id="rb-admin"
            style={{ display: isAdmin() ? 'flex' : 'none' }}
          >
            <div className="rail-btn-ic">
              <Settings size={22} />
            </div>
          </div>
        )}
        
        <div className="rail-spacer" />
        
        <div 
          className="rail-user-avatar"
          style={{ background: currentUser?.color || '#5b9bd5' }}
          onClick={() => handleViewProfile(currentUser?.id)}
          title="Profilim"
        >
          {currentUser?.username?.charAt(0).toUpperCase()}
          <div className="online-indicator" />
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        onRoomSelect={handleRoomSelect}
        onViewProfile={handleViewProfile}
      />

      {/* Main Content */}
      <div className="main-content-area">
        {activePanel === 'home' && !currentRoom && (
          <div className="empty-state" data-testid="empty-state">
            <div className="empty-state-icon">
              <LeafLogo />
            </div>
            <div className="empty-state-title">Nature.co'ya Hoş Geldin</div>
            <div className="empty-state-subtitle">
              Soldaki listeden bir kanal, grup veya kişi seçerek sohbete başla
            </div>
            <div className="empty-state-actions">
              <button className="action-button primary">
                💬 Kanal Seç
              </button>
              <button 
                className="action-button secondary"
                onClick={() => setActivePanel('friends')}
              >
                👥 Arkadaşlar
              </button>
            </div>
          </div>
        )}

        {(activePanel === 'chat' || currentRoom) && currentRoom && (
          <ChatArea 
            room={currentRoom}
            showMembers={showMembers}
            setShowMembers={setShowMembers}
            onViewProfile={handleViewProfile}
          />
        )}

        {activePanel === 'admin' && <AdminPanel />}
        {activePanel === 'forum' && <ForumPanel onViewProfile={handleViewProfile} />}
        {activePanel === 'friends' && <FriendsPanel onViewProfile={handleViewProfile} />}
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
