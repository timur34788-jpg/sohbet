import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Settings, Shield, Ban, UserPlus, Key, Hash, Trash2,
  ToggleLeft, ToggleRight, Plus, Edit2, Save, X, RefreshCw,
  MessageSquare, FileText, Database, Activity
} from 'lucide-react';

const AdminPanel = () => {
  const { 
    users, rooms, serverSettings, isAdmin,
    banUser, unbanUser, setUserRole, createInviteCode,
    updateServerSettings, createRoom, deleteRoom, updateRoom,
    forumPosts, messages, currentServer,
    deleteAllMessages, clearRoomMessages, deleteUser, getStatistics, backupData
  } = useApp();

  const [activeTab, setActiveTab] = useState('users');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', type: 'channel', private: false });
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  if (!isAdmin()) {
    return (
      <div className="admin-panel unauthorized" data-testid="admin-unauthorized">
        <div className="unauthorized-icon">🚫</div>
        <h2>Yetkisiz Erişim</h2>
        <p>Bu panele erişmek için admin yetkiniz olmalıdır.</p>
      </div>
    );
  }

  const showFeedback = (message) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const handleBanUser = async (userId, username) => {
    if (window.confirm(`${username} kullanıcısını banlamak istediğinize emin misiniz?`)) {
      setLoading(true);
      try {
        await banUser(userId, 'Admin tarafından banlandı');
        showFeedback(`${username} banlandı`);
      } catch (err) {
        showFeedback('Hata: ' + err.message);
      }
      setLoading(false);
    }
  };

  const handleUnbanUser = async (userId, username) => {
    setLoading(true);
    try {
      await unbanUser(userId);
      showFeedback(`${username} banı kaldırıldı`);
    } catch (err) {
      showFeedback('Hata: ' + err.message);
    }
    setLoading(false);
  };

  const handleSetRole = async (userId, role, username) => {
    setLoading(true);
    try {
      await setUserRole(userId, role);
      showFeedback(`${username} rolü ${role} olarak güncellendi`);
    } catch (err) {
      showFeedback('Hata: ' + err.message);
    }
    setLoading(false);
  };

  const handleCreateInviteCode = async () => {
    setLoading(true);
    try {
      const code = await createInviteCode();
      setInviteCode(code);
      showFeedback('Davet kodu oluşturuldu');
    } catch (err) {
      showFeedback('Hata: ' + err.message);
    }
    setLoading(false);
  };

  const handleToggleSetting = async (key) => {
    setLoading(true);
    try {
      await updateServerSettings({ [key]: !serverSettings?.[key] });
      showFeedback('Ayar güncellendi');
    } catch (err) {
      showFeedback('Hata: ' + err.message);
    }
    setLoading(false);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    
    setLoading(true);
    try {
      await createRoom(newRoom);
      setNewRoom({ name: '', description: '', type: 'channel', private: false });
      setShowCreateRoom(false);
      showFeedback('Oda oluşturuldu');
    } catch (err) {
      showFeedback('Hata: ' + err.message);
    }
    setLoading(false);
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (window.confirm(`${roomName} odasını silmek istediğinize emin misiniz?`)) {
      setLoading(true);
      try {
        await deleteRoom(roomId);
        showFeedback('Oda silindi');
      } catch (err) {
        showFeedback('Hata: ' + err.message);
      }
      setLoading(false);
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    
    setLoading(true);
    try {
      await updateRoom(editingRoom.id, {
        name: editingRoom.name,
        description: editingRoom.description,
        private: editingRoom.private
      });
      setEditingRoom(null);
      showFeedback('Oda güncellendi');
    } catch (err) {
      showFeedback('Hata: ' + err.message);
    }
    setLoading(false);
  };

  // Data management handlers
  const handleDeleteAllMessages = async () => {
    if (window.confirm('⚠️ TÜM MESAJLARI silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ!')) {
      if (window.confirm('Son uyarı! Bu işlem tüm sunucu mesajlarını kalıcı olarak silecek. Devam edilsin mi?')) {
        setLoading(true);
        try {
          await deleteAllMessages();
          showFeedback('✅ Tüm mesajlar silindi');
        } catch (err) {
          showFeedback('❌ Hata: ' + err.message);
        }
        setLoading(false);
      }
    }
  };

  const handleClearRoomMessages = async (roomId, roomName) => {
    if (window.confirm(`${roomName} odasındaki tüm mesajları silmek istediğinize emin misiniz?`)) {
      setLoading(true);
      try {
        await clearRoomMessages(roomId);
        showFeedback(`✅ ${roomName} mesajları temizlendi`);
      } catch (err) {
        showFeedback('❌ Hata: ' + err.message);
      }
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`${username} kullanıcısını KALICI OLARAK silmek istediğinize emin misiniz?`)) {
      setLoading(true);
      try {
        await deleteUser(userId);
        showFeedback(`✅ ${username} silindi`);
      } catch (err) {
        showFeedback('❌ Hata: ' + err.message);
      }
      setLoading(false);
    }
  };

  const handleBackupData = async () => {
    setLoading(true);
    try {
      await backupData();
      showFeedback('✅ Yedek oluşturuldu ve indirildi');
    } catch (err) {
      showFeedback('❌ Hata: ' + err.message);
    }
    setLoading(false);
  };

  const stats = getStatistics ? getStatistics() : {};

  const usersList = Object.entries(users);
  const totalMessages = Object.keys(messages || {}).length;
  const totalPosts = forumPosts?.length || 0;
  const onlineUsers = usersList.filter(([_, u]) => u.online).length;
  const bannedUsers = usersList.filter(([_, u]) => u.banned).length;

  return (
    <div className="admin-panel" data-testid="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <h2><Shield size={24} /> Admin Paneli</h2>
        <span className="server-badge">{currentServer}</span>
      </div>

      {/* Feedback */}
      {actionFeedback && (
        <div className="admin-feedback" data-testid="admin-feedback">
          {actionFeedback}
        </div>
      )}

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <Users size={20} />
          <div className="stat-info">
            <span className="stat-value">{usersList.length}</span>
            <span className="stat-label">Toplam Üye</span>
          </div>
        </div>
        <div className="stat-card">
          <Activity size={20} />
          <div className="stat-info">
            <span className="stat-value">{onlineUsers}</span>
            <span className="stat-label">Çevrimiiçi</span>
          </div>
        </div>
        <div className="stat-card">
          <Hash size={20} />
          <div className="stat-info">
            <span className="stat-value">{rooms.length}</span>
            <span className="stat-label">Oda</span>
          </div>
        </div>
        <div className="stat-card">
          <Ban size={20} />
          <div className="stat-info">
            <span className="stat-value">{bannedUsers}</span>
            <span className="stat-label">Banlı</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          data-testid="admin-tab-users"
        >
          <Users size={16} /> Kullanıcılar
        </button>
        <button
          className={`admin-tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
          data-testid="admin-tab-rooms"
        >
          <Hash size={16} /> Odalar
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          data-testid="admin-tab-settings"
        >
          <Settings size={16} /> Ayarlar
        </button>
        <button
          className={`admin-tab ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
          data-testid="admin-tab-invites"
        >
          <Key size={16} /> Davet Kodları
        </button>
        <button
          className={`admin-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
          data-testid="admin-tab-data"
        >
          <Database size={16} /> Veri Yönetimi
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-users" data-testid="admin-users-section">
            <div className="section-header">
              <h3>Kullanıcı Yönetimi</h3>
              <span className="count">{usersList.length} kullanıcı</span>
            </div>
            <div className="users-list">
              {usersList.map(([userId, user]) => (
                <div 
                  key={userId} 
                  className={`user-row ${user.banned ? 'banned' : ''}`}
                  data-testid={`user-row-${userId}`}
                >
                  <div 
                    className="user-avatar"
                    style={{ background: user.color || '#5b9bd5' }}
                  >
                    {user.username?.charAt(0).toUpperCase()}
                    <div className={`status ${user.online ? 'online' : 'offline'}`} />
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {user.username}
                      {user.role === 'admin' && <span className="role-badge admin">⭐ Admin</span>}
                      {user.role === 'mod' && <span className="role-badge mod">🛡️ Mod</span>}
                      {user.banned && <span className="role-badge banned">🚫 Banlı</span>}
                    </span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <div className="user-actions">
                    <select
                      value={user.role || 'member'}
                      onChange={(e) => handleSetRole(userId, e.target.value, user.username)}
                      disabled={loading}
                      className="role-select"
                      data-testid={`role-select-${userId}`}
                    >
                      <option value="member">Üye</option>
                      <option value="mod">Mod</option>
                      <option value="admin">Admin</option>
                    </select>
                    {user.banned ? (
                      <button
                        className="action-btn unban"
                        onClick={() => handleUnbanUser(userId, user.username)}
                        disabled={loading}
                        data-testid={`unban-btn-${userId}`}
                      >
                        <RefreshCw size={14} /> Ban Kaldır
                      </button>
                    ) : (
                      <button
                        className="action-btn ban"
                        onClick={() => handleBanUser(userId, user.username)}
                        disabled={loading}
                        data-testid={`ban-btn-${userId}`}
                      >
                        <Ban size={14} /> Banla
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="admin-rooms" data-testid="admin-rooms-section">
            <div className="section-header">
              <h3>Oda Yönetimi</h3>
              <button 
                className="create-btn"
                onClick={() => setShowCreateRoom(true)}
                data-testid="create-room-btn"
              >
                <Plus size={16} /> Yeni Oda
              </button>
            </div>

            {/* Create Room Form */}
            {showCreateRoom && (
              <form className="room-form" onSubmit={handleCreateRoom} data-testid="create-room-form">
                <h4>Yeni Oda Oluştur</h4>
                <div className="form-group">
                  <label>Oda Adı</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="Oda adı..."
                    data-testid="room-name-input"
                  />
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <input
                    type="text"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="Oda açıklaması..."
                    data-testid="room-description-input"
                  />
                </div>
                <div className="form-group">
                  <label>Tür</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    data-testid="room-type-select"
                  >
                    <option value="channel">Kanal</option>
                    <option value="group">Grup</option>
                  </select>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={newRoom.private}
                      onChange={(e) => setNewRoom({ ...newRoom, private: e.target.checked })}
                      data-testid="room-private-checkbox"
                    />
                    Özel Oda
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowCreateRoom(false)}>
                    <X size={14} /> İptal
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    <Save size={14} /> Oluştur
                  </button>
                </div>
              </form>
            )}

            {/* Rooms List */}
            <div className="rooms-list">
              {rooms.map(room => (
                <div key={room.id} className="room-row" data-testid={`room-row-${room.id}`}>
                  {editingRoom?.id === room.id ? (
                    <form className="room-edit-form" onSubmit={handleUpdateRoom}>
                      <input
                        type="text"
                        value={editingRoom.name}
                        onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                        data-testid="edit-room-name-input"
                      />
                      <input
                        type="text"
                        value={editingRoom.description || ''}
                        onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                        placeholder="Açıklama..."
                      />
                      <button type="submit" disabled={loading}>
                        <Save size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingRoom(null)}>
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="room-info">
                        <span className="room-icon">
                          {room.type === 'group' ? '👥' : room.private ? '🔒' : '#'}
                        </span>
                        <div>
                          <span className="room-name">{room.name}</span>
                          {room.description && (
                            <span className="room-desc">{room.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="room-actions">
                        <button
                          className="edit-btn"
                          onClick={() => setEditingRoom(room)}
                          data-testid={`edit-room-btn-${room.id}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                          data-testid={`delete-room-btn-${room.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {rooms.length === 0 && (
                <div className="no-rooms">Henüz oda yok</div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="admin-settings" data-testid="admin-settings-section">
            <div className="section-header">
              <h3>Sunucu Ayarları</h3>
            </div>
            <div className="settings-list">
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-name">Kayıt Açık</span>
                  <span className="setting-desc">Yeni kullanıcılar kayıt olabilir</span>
                </div>
                <button
                  className={`toggle-btn ${serverSettings?.registrationOpen ? 'on' : 'off'}`}
                  onClick={() => handleToggleSetting('registrationOpen')}
                  disabled={loading}
                  data-testid="toggle-registration"
                >
                  {serverSettings?.registrationOpen ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-name">Davet Kodu Gerekli</span>
                  <span className="setting-desc">Kayıt için davet kodu zorunlu</span>
                </div>
                <button
                  className={`toggle-btn ${serverSettings?.requireInviteCode ? 'on' : 'off'}`}
                  onClick={() => handleToggleSetting('requireInviteCode')}
                  disabled={loading}
                  data-testid="toggle-invite-required"
                >
                  {serverSettings?.requireInviteCode ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-name">Bakım Modu</span>
                  <span className="setting-desc">Sadece adminler erişebilir</span>
                </div>
                <button
                  className={`toggle-btn ${serverSettings?.maintenanceMode ? 'on' : 'off'}`}
                  onClick={() => handleToggleSetting('maintenanceMode')}
                  disabled={loading}
                  data-testid="toggle-maintenance"
                >
                  {serverSettings?.maintenanceMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          <div className="admin-invites" data-testid="admin-invites-section">
            <div className="section-header">
              <h3>Davet Kodları</h3>
            </div>
            <div className="invite-generator">
              <p>Yeni kullanıcıları davet etmek için tek kullanımlık kod oluşturun.</p>
              <button
                className="generate-btn"
                onClick={handleCreateInviteCode}
                disabled={loading}
                data-testid="generate-invite-btn"
              >
                <Key size={16} /> Davet Kodu Oluştur
              </button>
              {inviteCode && (
                <div className="generated-code" data-testid="generated-invite-code">
                  <span className="code">{inviteCode}</span>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode);
                      showFeedback('Kod kopyalandı');
                    }}
                  >
                    Kopyala
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="admin-data" data-testid="admin-data-section">
            <div className="section-header">
              <h3>Veri Yönetimi</h3>
            </div>

            {/* Statistics */}
            <div className="data-stats">
              <div className="stat-box">
                <Users size={24} />
                <div>
                  <div className="stat-number">{stats.totalUsers || 0}</div>
                  <div className="stat-label">Toplam Kullanıcı</div>
                </div>
              </div>
              <div className="stat-box">
                <Activity size={24} />
                <div>
                  <div className="stat-number">{stats.onlineUsers || 0}</div>
                  <div className="stat-label">Çevrimiçi</div>
                </div>
              </div>
              <div className="stat-box">
                <Hash size={24} />
                <div>
                  <div className="stat-number">{stats.totalRooms || 0}</div>
                  <div className="stat-label">Oda</div>
                </div>
              </div>
              <div className="stat-box">
                <MessageSquare size={24} />
                <div>
                  <div className="stat-number">{stats.totalMessages || 0}</div>
                  <div className="stat-label">Mesaj</div>
                </div>
              </div>
            </div>

            {/* Dangerous Actions */}
            <div className="danger-zone">
              <h4>🚨 Tehlikeli İşlemler</h4>
              <p className="warning-text">Aşağıdaki işlemler geri alınamaz! Dikkatli olun.</p>
              
              <div className="danger-actions">
                <button 
                  className="danger-btn"
                  onClick={handleDeleteAllMessages}
                  disabled={loading}
                >
                  <Trash2 size={18} />
                  TÜM MESAJLARI SİL
                </button>
                
                <button 
                  className="danger-btn"
                  onClick={handleBackupData}
                  disabled={loading}
                >
                  <Download size={18} />
                  YEDEK OLUŞTUR
                </button>
              </div>
            </div>

            {/* Room-specific actions */}
            <div className="room-actions">
              <h4>Oda Mesaj Yönetimi</h4>
              <div className="room-list">
                {rooms.map(room => {
                  const roomMsgCount = messages[room.id] ? Object.keys(messages[room.id]).length : 0;
                  return (
                    <div key={room.id} className="room-action-row">
                      <div className="room-info">
                        <span className="room-name">{room.name}</span>
                        <span className="room-msg-count">{roomMsgCount} mesaj</span>
                      </div>
                      <button 
                        className="mini-danger-btn"
                        onClick={() => handleClearRoomMessages(room.id, room.name)}
                        disabled={loading || roomMsgCount === 0}
                      >
                        <Trash2 size={14} />
                        Temizle
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User deletion */}
            <div className="user-deletion">
              <h4>Kullanıcı Silme</h4>
              <p className="warning-text">Kullanıcı kalıcı olarak silinir!</p>
              <div className="user-delete-list">
                {Object.entries(users).map(([userId, user]) => (
                  <div key={userId} className="user-delete-row">
                    <div className="user-info-mini">
                      <div 
                        className="mini-avatar"
                        style={{ background: user.color || '#5b9bd5' }}
                      >
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                      {user.isAdmin && <span className="admin-badge-mini">Admin</span>}
                    </div>
                    <button 
                      className="mini-danger-btn"
                      onClick={() => handleDeleteUser(userId, user.username)}
                      disabled={loading || user.isAdmin}
                      title={user.isAdmin ? 'Admin silinemez' : 'Kullanıcıyı sil'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
