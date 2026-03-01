import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, MessageCircle, UserPlus, Ban, Shield, Mail, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ProfileModal = ({ userId, onClose }) => {
  const { users, currentUser, friends, sendFriendRequest, banUser, setUserRole, isAdmin } = useApp();
  const [loading, setLoading] = useState(false);

  const user = users[userId];
  const isOwnProfile = userId === currentUser?.id;
  const isFriend = friends.some(f => f.id === userId);

  if (!user) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={e => e.stopPropagation()}>
          <div className="profile-loading">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      await sendFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleBan = async () => {
    if (window.confirm(`${user.username} kullanıcısını banlamak istediğinize emin misiniz?`)) {
      setLoading(true);
      try {
        await banUser(userId, 'Profil üzerinden banlandı');
        onClose();
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Bilinmiyor';
    return format(new Date(timestamp), 'dd MMMM yyyy', { locale: tr });
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose} data-testid="profile-modal">
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div 
          className="profile-banner"
          style={{ background: `linear-gradient(135deg, ${user.color || '#5b9bd5'}44, ${user.color || '#5b9bd5'}22)` }}
        >
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <div 
            className="profile-avatar"
            style={{ background: user.color || '#5b9bd5' }}
          >
            {user.username?.charAt(0).toUpperCase()}
            <div className={`status-indicator ${user.online ? 'online' : 'offline'}`} />
          </div>
        </div>

        {/* Info */}
        <div className="profile-info">
          <h2 className="profile-username">
            {user.username}
            {user.role === 'admin' && <span className="role-badge admin">⭐ Admin</span>}
            {user.role === 'mod' && <span className="role-badge mod">🛡️ Mod</span>}
            {user.banned && <span className="role-badge banned">🚫 Banlı</span>}
          </h2>
          <p className="profile-status">
            {user.online ? '🟢 Çevrimiiçi' : '⚫ Çevrimdışı'}
          </p>
        </div>

        {/* Details */}
        <div className="profile-details">
          {user.email && (
            <div className="detail-item">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          )}
          {user.origin && (
            <div className="detail-item">
              <MapPin size={16} />
              <span>{user.origin}</span>
            </div>
          )}
          {user.createdAt && (
            <div className="detail-item">
              <Calendar size={16} />
              <span>Katılım: {formatDate(user.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isOwnProfile && (
          <div className="profile-actions">
            <button className="action-btn message" data-testid="profile-message-btn">
              <MessageCircle size={16} /> Mesaj Gönder
            </button>
            {!isFriend && (
              <button 
                className="action-btn add-friend"
                onClick={handleAddFriend}
                disabled={loading}
                data-testid="profile-add-friend-btn"
              >
                <UserPlus size={16} /> Arkadaş Ekle
              </button>
            )}
            {isAdmin() && !user.banned && (
              <button 
                className="action-btn ban"
                onClick={handleBan}
                disabled={loading}
                data-testid="profile-ban-btn"
              >
                <Ban size={16} /> Banla
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
