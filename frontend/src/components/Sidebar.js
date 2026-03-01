import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, ChevronDown, Plus, Hash, Lock } from 'lucide-react';

const Sidebar = ({ activePanel, setActivePanel, onRoomSelect, onViewProfile }) => {
  const { 
    currentUser, rooms, currentRoom, servers, currentServer,
    notifications, isAdmin 
  } = useApp();

  const serverInfo = servers[currentServer];
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    dms: true
  });

  const channelRooms = rooms.filter(r => r.type === 'channel' || !r.type);
  const dmRooms = rooms.filter(r => r.type === 'dm');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate color for user initials
  const getColorForUser = (userId) => {
    const colors = ['#5b9bd5', '#6c63ff', '#2ecc71', '#f97316', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < (userId || '').length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="desktop-sidebar" data-testid="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-content">
          <div>
            <div 
              className="sidebar-server-name" 
              title="Sunucu değiştir"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              🍃 Robot Evi
            </div>
            <div className="sidebar-server-subtitle">
              NatureBot'a yuvaya gönderildi
            </div>
          </div>
          <div className="sidebar-header-icons">
            <button 
              className="sidebar-icon-button"
              title="Bildirimler"
              data-testid="notifications-btn"
            >
              <Bell size={15} />
              {unreadNotifs > 0 && (
                <div className="notification-dot" />
              )}
            </button>
            <div 
              className="sidebar-user-avatar"
              style={{ background: currentUser?.color || '#5b9bd5' }}
              onClick={() => onViewProfile(currentUser?.id)}
              title="Profilim"
              data-testid="sidebar-avatar"
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
              <div className="online-indicator" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search" data-testid="sidebar-search">
        <Search size={14} strokeWidth={2} />
        <span className="search-placeholder">
          Ara...
          <span className="search-shortcut">⌘K</span>
        </span>
      </div>

      {/* List */}
      <div className="sidebar-list">
        {/* NatureBot Section */}
        <div className="sidebar-section">
          <div className="section-header">
            <ChevronDown size={10} />
            <span className="section-title">NATUREBOT</span>
          </div>
          <div className="section-item">
            <span className="item-icon">🤖</span>
            <span className="item-name">NatureBot</span>
            <span className="item-badge">AI</span>
          </div>
        </div>

        {/* Channels */}
        {channelRooms.length > 0 && (
          <div className="sidebar-section">
            <div 
              className="section-header clickable"
              onClick={() => toggleSection('channels')}
            >
              <ChevronDown 
                size={10} 
                style={{ 
                  transform: expandedSections.channels ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
              <span className="section-title">KANALLAR</span>
              {isAdmin() && (
                <button 
                  className="section-add-button"
                  title="Kanal Ekle"
                  data-testid="add-channel-btn"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>
            {expandedSections.channels && (
              <div className="section-items">
                {channelRooms.map(room => (
                  <div
                    key={room.id}
                    className={`section-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                    onClick={() => onRoomSelect(room)}
                    data-testid={`room-${room.id}`}
                  >
                    <span className="item-icon channel-icon">
                      {room.private ? <Lock size={16} /> : '#'}
                    </span>
                    <span className="item-name">{room.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Direct Messages */}
        {dmRooms.length > 0 && (
          <div className="sidebar-section">
            <div 
              className="section-header clickable"
              onClick={() => toggleSection('dms')}
            >
              <ChevronDown 
                size={10}
                style={{ 
                  transform: expandedSections.dms ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
              <span className="section-title">DİREKT MESAJLAR</span>
              <button 
                className="section-add-button"
                title="Yeni Mesaj"
              >
                <Plus size={12} />
              </button>
            </div>
            {expandedSections.dms && (
              <div className="section-items">
                {dmRooms.map(room => {
                  const otherUserId = Object.keys(room.members || {}).find(id => id !== currentUser?.id);
                  const userColor = getColorForUser(otherUserId);
                  
                  return (
                    <div
                      key={room.id}
                      className={`section-item dm-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                      onClick={() => onRoomSelect(room)}
                      data-testid={`room-${room.id}`}
                    >
                      <div 
                        className="dm-avatar"
                        style={{ background: userColor }}
                      >
                        {room.name?.charAt(0).toUpperCase()}
                        <div className="online-indicator" />
                      </div>
                      <span className="item-name">{room.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {rooms.length === 0 && (
          <div className="sidebar-empty">
            <p>Henüz oda yok</p>
            {isAdmin() && <p className="hint">Admin panelinden oda oluşturun</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
