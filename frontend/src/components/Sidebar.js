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
    <div id="deskSidebar" data-testid="sidebar">
      {/* Header */}
      <div id="deskSidebarHeader">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div 
              id="deskSidebarTitle"
              title="Sunucu değiştir"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Nature.co
            </div>
            <div id="deskSidebarSub">Ana Sayfa</div>
          </div>
          {/* Zil + Profil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div 
              id="deskBellBtn"
              title="Bildirimler"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative',
                color: 'rgba(255,255,255,.7)',
                transition: 'background .15s',
                flexShrink: 0
              }}
              data-testid="notifications-btn"
            >
              <Bell size={15} />
              {unreadNotifs > 0 && (
                <div 
                  id="deskNotifDot"
                  style={{
                    display: 'block',
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    width: '6px',
                    height: '6px',
                    background: '#e05555',
                    borderRadius: '50%',
                    border: '1.5px solid #222529'
                  }}
                />
              )}
            </div>
            <div 
              id="deskSidebarAvatar"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '.65rem',
                fontWeight: 900,
                color: '#fff',
                cursor: 'pointer',
                flexShrink: 0,
                background: getColorForUser(currentUser?.username || ''),
                border: '1.5px solid rgba(255,255,255,.2)',
                transition: 'opacity .15s',
                position: 'relative'
              }}
              onClick={() => onViewProfile(currentUser?.id)}
              title="Profilim"
              data-testid="sidebar-avatar"
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
              <div 
                className="sdot"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  border: '2px solid #222529'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div 
        id="deskSearch"
        style={{ cursor: 'pointer' }}
        data-testid="sidebar-search"
      >
        <Search size={14} strokeWidth={2} />
        <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
          Ara... <span style={{ marginLeft: 'auto', fontSize: '.7rem', opacity: .6 }}>⌘K</span>
        </span>
      </div>

      {/* List */}
      <div id="deskSideList">
        {/* NatureBot Section */}
        <div className="dsk-sec-hdr">
          <span className="chev">▼</span>
          <span>NATUREBOT</span>
        </div>
        <div 
          className="dsk-row"
          style={{ cursor: 'pointer' }}
        >
          <div className="dsk-row-ic">🤖</div>
          <div className="dsk-row-name">NatureBot</div>
          <div className="ui-badge ui-badge-green">AI</div>
        </div>

        {/* Channels */}
        {channelRooms.length > 0 && (
          <>
            <div 
              className="dsk-sec-hdr"
              onClick={() => toggleSection('channels')}
              style={{ cursor: 'pointer' }}
            >
              <span 
                className="chev"
                style={{ 
                  transform: expandedSections.channels ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.15s',
                  display: 'inline-block'
                }}
              >
                ▼
              </span>
              <span>KANALLAR</span>
              {isAdmin() && (
                <div 
                  className="sec-add-btn"
                  title="Kanal Ekle"
                  data-testid="add-channel-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Add channel modal
                  }}
                >
                  +
                </div>
              )}
            </div>
            {expandedSections.channels && channelRooms.map(room => (
              <div
                key={room.id}
                className={`dsk-row ${currentRoom?.id === room.id ? 'act' : ''}`}
                onClick={() => onRoomSelect(room)}
                data-testid={`room-${room.id}`}
              >
                <div className="dsk-row-ic">
                  {room.private ? '🔒' : '#'}
                </div>
                <div className="dsk-row-name">{room.name}</div>
              </div>
            ))}
          </>
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
