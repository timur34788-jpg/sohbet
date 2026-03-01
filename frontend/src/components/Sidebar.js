import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, MessageSquare, FileText, Users, Tv, Settings, LogOut,
  Hash, Lock, Plus, ChevronDown, Bell
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activePanel, setActivePanel, onRoomSelect, onViewProfile }) => {
  const { 
    currentUser, logout, rooms, currentRoom, servers, currentServer,
    friendRequests, notifications, isAdmin 
  } = useApp();

  const serverInfo = servers[currentServer];
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
  };

  const channelRooms = rooms.filter(r => r.type === 'channel' || !r.type);
  const groupRooms = rooms.filter(r => r.type === 'group');
  const dmRooms = rooms.filter(r => r.type === 'dm');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`} data-testid="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-server-info">
            <h2 className="sidebar-title">{serverInfo?.name || 'Nature.co'}</h2>
            <span className="sidebar-subtitle">Ana Sayfa</span>
          </div>
          <div className="sidebar-header-actions">
            <button 
              className="sidebar-icon-btn"
              title="Bildirimler"
              data-testid="notifications-btn"
            >
              <Bell size={16} />
              {unreadNotifs > 0 && (
                <span className="notif-badge">{unreadNotifs}</span>
              )}
            </button>
            <div 
              className="sidebar-avatar"
              style={{ background: currentUser?.color || '#5b9bd5' }}
              onClick={() => onViewProfile(currentUser?.id)}
              data-testid="sidebar-avatar"
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
              <div className="online-dot" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search" data-testid="sidebar-search">
          <span className="search-icon">🔍</span>
          <span className="search-text">Kişi, oda veya forum ara...</span>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <button
            className={`nav-item ${activePanel === 'home' ? 'active' : ''}`}
            onClick={() => setActivePanel('home')}
            data-testid="nav-home"
          >
            <Home size={18} />
            <span>Ana Sayfa</span>
          </button>
          <button
            className={`nav-item ${activePanel === 'forum' ? 'active' : ''}`}
            onClick={() => setActivePanel('forum')}
            data-testid="nav-forum"
          >
            <FileText size={18} />
            <span>Forum</span>
          </button>
          <button
            className={`nav-item ${activePanel === 'friends' ? 'active' : ''}`}
            onClick={() => setActivePanel('friends')}
            data-testid="nav-friends"
          >
            <Users size={18} />
            <span>Arkadaşlar</span>
            {friendRequests.length > 0 && (
              <span className="nav-badge">{friendRequests.length}</span>
            )}
          </button>
          <button
            className={`nav-item ${activePanel === 'watch' ? 'active' : ''}`}
            onClick={() => setActivePanel('watch')}
            data-testid="nav-watch"
          >
            <Tv size={18} />
            <span>Canlı İzle</span>
          </button>
          {isAdmin() && (
            <button
              className={`nav-item admin ${activePanel === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePanel('admin')}
              data-testid="nav-admin"
            >
              <Settings size={18} />
              <span>Admin Paneli</span>
            </button>
          )}
        </div>

        {/* Rooms List */}
        <div className="sidebar-rooms">
          {/* Channels */}
          {channelRooms.length > 0 && (
            <div className="room-section">
              <div className="room-section-header">
                <ChevronDown size={12} />
                <span>KANALLAR</span>
                {isAdmin() && (
                  <button className="add-room-btn" data-testid="add-channel-btn">
                    <Plus size={14} />
                  </button>
                )}
              </div>
              {channelRooms.map(room => (
                <div
                  key={room.id}
                  className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => onRoomSelect(room)}
                  data-testid={`room-${room.id}`}
                >
                  <span className="room-icon">
                    {room.private ? <Lock size={16} /> : <Hash size={16} />}
                  </span>
                  <span className="room-name">{room.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Groups */}
          {groupRooms.length > 0 && (
            <div className="room-section">
              <div className="room-section-header">
                <ChevronDown size={12} />
                <span>GRUPLAR</span>
              </div>
              {groupRooms.map(room => (
                <div
                  key={room.id}
                  className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => onRoomSelect(room)}
                  data-testid={`room-${room.id}`}
                >
                  <span className="room-icon">👥</span>
                  <span className="room-name">{room.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* DMs */}
          {dmRooms.length > 0 && (
            <div className="room-section">
              <div className="room-section-header">
                <ChevronDown size={12} />
                <span>DİREKT MESAJLAR</span>
              </div>
              {dmRooms.map(room => (
                <div
                  key={room.id}
                  className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => onRoomSelect(room)}
                  data-testid={`room-${room.id}`}
                >
                  <span className="room-icon">💬</span>
                  <span className="room-name">{room.name}</span>
                </div>
              ))}
            </div>
          )}

          {rooms.length === 0 && (
            <div className="no-rooms">
              <p>Henüz oda yok</p>
              {isAdmin() && <p className="hint">Admin panelinden oda oluşturun</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div 
            className="user-info"
            onClick={() => onViewProfile(currentUser?.id)}
          >
            <div 
              className="user-avatar"
              style={{ background: currentUser?.color || '#5b9bd5' }}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="username">{currentUser?.username}</span>
              <span className="user-status">
                {currentUser?.role === 'admin' ? '⭐ Admin' : 
                 currentUser?.role === 'mod' ? '🛡️ Mod' : 'Çevrimiiçi'}
              </span>
            </div>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Çıkış Yap"
            data-testid="logout-btn"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
