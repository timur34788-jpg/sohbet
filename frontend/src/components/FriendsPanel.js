import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, Check, X, MessageCircle, Search } from 'lucide-react';

const FriendsPanel = ({ onViewProfile }) => {
  const { 
    friends, friendRequests, users, currentUser,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest 
  } = useApp();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const results = Object.entries(users)
      .filter(([id, user]) => {
        if (id === currentUser?.id) return false;
        if (friends.some(f => f.id === id)) return false;
        return user.username?.toLowerCase().includes(query.toLowerCase());
      })
      .map(([id, user]) => ({ id, ...user }));
    
    setSearchResults(results);
  };

  const handleSendRequest = async (userId) => {
    setLoading(true);
    try {
      await sendFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAccept = async (userId) => {
    setLoading(true);
    try {
      await acceptFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleReject = async (userId) => {
    setLoading(true);
    try {
      await rejectFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getFriendUser = (friendId) => {
    return users[friendId] || {};
  };

  return (
    <div className="friends-panel" data-testid="friends-panel">
      <div className="friends-header">
        <h2>👥 Arkadaşlar</h2>
      </div>

      {/* Tabs */}
      <div className="friends-tabs">
        <button
          className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
          data-testid="friends-tab-all"
        >
          Tüm Arkadaşlar
          <span className="count">{friends.length}</span>
        </button>
        <button
          className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
          data-testid="friends-tab-requests"
        >
          İstekler
          {friendRequests.length > 0 && (
            <span className="count highlight">{friendRequests.length}</span>
          )}
        </button>
        <button
          className={`friends-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          data-testid="friends-tab-add"
        >
          Arkadaş Ekle
        </button>
      </div>

      {/* Content */}
      <div className="friends-content">
        {/* Friends List */}
        {activeTab === 'friends' && (
          <div className="friends-list" data-testid="friends-list">
            {friends.length === 0 ? (
              <div className="no-friends">
                <div className="no-friends-icon">👥</div>
                <h3>Henüz arkadaşın yok</h3>
                <p>Arkadaş ekle sekmesinden yeni arkadaşlar bul!</p>
              </div>
            ) : (
              friends.map(friend => {
                const user = getFriendUser(friend.id);
                return (
                  <div 
                    key={friend.id} 
                    className="friend-item"
                    data-testid={`friend-${friend.id}`}
                  >
                    <div 
                      className="friend-avatar"
                      style={{ background: user.color || '#5b9bd5' }}
                      onClick={() => onViewProfile(friend.id)}
                    >
                      {user.username?.charAt(0).toUpperCase()}
                      <div className={`status ${user.online ? 'online' : 'offline'}`} />
                    </div>
                    <div className="friend-info" onClick={() => onViewProfile(friend.id)}>
                      <span className="friend-name">{user.username}</span>
                      <span className="friend-status">
                        {user.online ? 'Çevrimiiçi' : 'Çevrimdışı'}
                      </span>
                    </div>
                    <button className="message-btn" title="Mesaj Gönder">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Friend Requests */}
        {activeTab === 'requests' && (
          <div className="requests-list" data-testid="requests-list">
            {friendRequests.length === 0 ? (
              <div className="no-requests">
                <div className="no-requests-icon">📬</div>
                <h3>Bekleyen istek yok</h3>
              </div>
            ) : (
              friendRequests.map(request => {
                const user = getFriendUser(request.fromId);
                return (
                  <div 
                    key={request.id} 
                    className="request-item"
                    data-testid={`request-${request.id}`}
                  >
                    <div 
                      className="request-avatar"
                      style={{ background: user.color || '#5b9bd5' }}
                    >
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="request-info">
                      <span className="request-name">{user.username}</span>
                      <span className="request-text">Arkadaşlık isteği gönderdi</span>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleAccept(request.fromId)}
                        disabled={loading}
                        data-testid={`accept-request-${request.id}`}
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleReject(request.fromId)}
                        disabled={loading}
                        data-testid={`reject-request-${request.id}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Add Friend */}
        {activeTab === 'add' && (
          <div className="add-friend" data-testid="add-friend-section">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Kullanıcı adı ile ara..."
                data-testid="friend-search-input"
              />
            </div>

            <div className="search-results">
              {searchQuery.length < 2 ? (
                <div className="search-hint">
                  <p>Aramak için en az 2 karakter girin</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="no-results">
                  <p>Kullanıcı bulunamadı</p>
                </div>
              ) : (
                searchResults.map(user => (
                  <div 
                    key={user.id} 
                    className="search-result-item"
                    data-testid={`search-result-${user.id}`}
                  >
                    <div 
                      className="result-avatar"
                      style={{ background: user.color || '#5b9bd5' }}
                    >
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="result-info">
                      <span className="result-name">{user.username}</span>
                    </div>
                    <button 
                      className="add-btn"
                      onClick={() => handleSendRequest(user.id)}
                      disabled={loading}
                      data-testid={`add-friend-btn-${user.id}`}
                    >
                      <UserPlus size={16} /> Ekle
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPanel;
