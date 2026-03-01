import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, Smile, Paperclip, MoreVertical, Edit2, Trash2, Pin,
  Reply, Copy, Users, Phone, Video, Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ChatArea = ({ room, onViewProfile }) => {
  const { 
    messages, sendMessage, deleteMessage, editMessage, currentUser, 
    users, isAdmin, isMod 
  } = useApp();
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (editingMessage) {
      await editMessage(room.id, editingMessage.id, messageText);
      setEditingMessage(null);
    } else {
      await sendMessage(room.id, messageText);
    }
    setMessageText('');
    inputRef.current?.focus();
  };

  const handleMessageAction = async (action, message) => {
    setContextMenu(null);
    
    switch (action) {
      case 'edit':
        setEditingMessage(message);
        setMessageText(message.text);
        inputRef.current?.focus();
        break;
      case 'delete':
        if (window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
          await deleteMessage(room.id, message.id);
        }
        break;
      case 'copy':
        navigator.clipboard.writeText(message.text);
        break;
      default:
        break;
    }
  };

  const canEditDelete = (message) => {
    return message.user === currentUser?.username || isAdmin() || isMod();
  };

  // Generate consistent color for username
  const getColorForUser = (username) => {
    const colors = ['#5b9bd5', '#6c63ff', '#2ecc71', '#f97316', '#ec4899', '#00bca0', '#fbbf24', '#e05555', '#9b59b6', '#1abc9c'];
    let hash = 0;
    for (let i = 0; i < (username || '').length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm', { locale: tr });
    }
    return format(date, 'dd MMM HH:mm', { locale: tr });
  };

  // Get room members from users
  const roomMembers = Object.entries(users).filter(([id, user]) => {
    if (room.type === 'dm') return room.members?.[id];
    return true; // Show all users for channels
  });

  return (
    <div className="chat-container" data-testid="chat-area">
      {/* Header */}
      <div className="chat-header-bar">
        <div className="chat-header-info">
          <div className="chat-header-icon">
            {room.type === 'dm' ? '💬' : room.private ? <Lock size={20} /> : '#'}
          </div>
          <div>
            <h3 className="chat-name">{room.name}</h3>
            {room.description && (
              <p className="chat-description">{room.description}</p>
            )}
          </div>
        </div>
        <div className="chat-header-actions">
          {room.type === 'dm' && (
            <>
              <button className="header-btn" title="Sesli Ara" data-testid="voice-call-btn">
                <Phone size={18} />
              </button>
              <button className="header-btn" title="Görüntülü Ara" data-testid="video-call-btn">
                <Video size={18} />
              </button>
            </>
          )}
          <button className="header-btn" title="Ekran Paylaş" data-testid="screen-share-btn">
            <Monitor size={18} />
          </button>
          <button 
            className={`header-btn ${showMembers ? 'active' : ''}`}
            onClick={() => setShowMembers(!showMembers)}
            title="Üyeler"
            data-testid="toggle-members-btn"
          >
            <Users size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-container">
        <div className="chat-messages" data-testid="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <h3>Henüz mesaj yok</h3>
              <p>İlk mesajı göndererek sohbeti başlat!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showAvatar = !prevMessage || 
                prevMessage.user !== message.user ||
                ((message.ts || 0) - (prevMessage.ts || 0)) > 300000; // 5 min
              
              // Get user color from users list
              const userColor = users[message.user]?.color || getColorForUser(message.user);

              return (
                <div 
                  key={message.id}
                  className={`message ${message.user === currentUser?.username ? 'own' : ''} ${showAvatar ? 'with-avatar' : ''}`}
                  data-testid={`message-${message.id}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (canEditDelete(message)) {
                      setContextMenu({ x: e.clientX, y: e.clientY, message });
                    }
                  }}
                >
                  {showAvatar && (
                    <div 
                      className="message-avatar"
                      style={{ background: userColor }}
                      onClick={() => onViewProfile(message.user)}
                    >
                      {message.user?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="message-content">
                    {showAvatar && (
                      <div className="message-header">
                        <span 
                          className="message-author"
                          style={{ color: userColor }}
                          onClick={() => onViewProfile(message.user)}
                        >
                          {message.user}
                        </span>
                        <span className="message-time">{formatTime(message.ts)}</span>
                        {message.edited && (
                          <span className="message-edited">(düzenlendi)</span>
                        )}
                      </div>
                    )}
                    <div className="message-text">
                      {message.text}
                    </div>
                  </div>
                  {canEditDelete(message) && (
                    <div className="message-actions">
                      <button 
                        className="msg-action-btn"
                        onClick={() => handleMessageAction('edit', message)}
                        title="Düzenle"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="msg-action-btn delete"
                        onClick={() => handleMessageAction('delete', message)}
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Members Panel */}
        {showMembers && (
          <div className="members-panel" data-testid="members-panel">
            <h4>Üyeler</h4>
            <div className="members-list">
              {roomMembers.map(([id, user]) => (
                <div 
                  key={id}
                  className="member-item"
                  onClick={() => onViewProfile(id)}
                >
                  <div 
                    className="member-avatar"
                    style={{ background: user.color || '#5b9bd5' }}
                  >
                    {user.username?.charAt(0).toUpperCase()}
                    <div className={`status-dot ${user.online ? 'online' : 'offline'}`} />
                  </div>
                  <div className="member-info">
                    <span className="member-name">{user.username}</span>
                    <span className="member-role">
                      {user.role === 'admin' ? '⭐ Admin' : 
                       user.role === 'mod' ? '🛡️ Mod' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {editingMessage && (
          <div className="editing-indicator">
            <span>✏️ Düzenleniyor: {editingMessage.content.substring(0, 30)}...</span>
            <button onClick={() => { setEditingMessage(null); setMessageText(''); }}>
              İptal
            </button>
          </div>
        )}
        <form className="chat-input-form" onSubmit={handleSend}>
          <button type="button" className="input-btn" title="Emoji">
            <Smile size={20} />
          </button>
          <button type="button" className="input-btn" title="Dosya">
            <Paperclip size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Mesaj yaz..."
            className="chat-input"
            data-testid="chat-input"
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={!messageText.trim()}
            data-testid="send-message-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="context-overlay" onClick={() => setContextMenu(null)} />
          <div 
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button onClick={() => handleMessageAction('copy', contextMenu.message)}>
              <Copy size={14} /> Kopyala
            </button>
            {contextMenu.message.senderId === currentUser?.id && (
              <button onClick={() => handleMessageAction('edit', contextMenu.message)}>
                <Edit2 size={14} /> Düzenle
              </button>
            )}
            <button 
              className="delete"
              onClick={() => handleMessageAction('delete', contextMenu.message)}
            >
              <Trash2 size={14} /> Sil
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;
