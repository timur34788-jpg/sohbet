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
    <div id="deskChatArea" data-testid="chat-area">
      {/* Header */}
      <div id="deskChatHeader">
        <div 
          id="deskChatHdrIcon"
          style={{
            background: room.type === 'dm' ? getColorForUser(room.name) : 'var(--surface2)'
          }}
        >
          {room.type === 'dm' ? room.name?.charAt(0).toUpperCase() : room.private ? '🔒' : '#'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div id="deskChatHdrName">{room.name}</div>
          {room.description && (
            <div id="deskChatHdrSub">{room.description}</div>
          )}
        </div>
        <div className="dsk-hdr-actions">
          {room.type === 'dm' && (
            <>
              <div className="dsk-hdr-btn" title="Sesli Ara" data-testid="voice-call-btn">
                <Phone size={18} />
              </div>
              <div className="dsk-hdr-btn" title="Görüntülü Ara" data-testid="video-call-btn">
                <Video size={18} />
              </div>
            </>
          )}
          <div className="dsk-hdr-btn" title="Ekran Paylaş" data-testid="screen-share-btn">
            <Monitor size={18} />
          </div>
          <div 
            className={`dsk-hdr-btn ${showMembers ? 'active' : ''}`}
            onClick={() => setShowMembers(!showMembers)}
            title="Üyeler"
            data-testid="toggle-members-btn"
          >
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div id="deskMsgs" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-ic">💬</div>
            <div className="empty-title">Henüz mesaj yok</div>
            <div className="empty-sub">İlk mesajı göndererek sohbeti başlat!</div>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || 
              prevMessage.user !== message.user ||
              ((message.ts || 0) - (prevMessage.ts || 0)) > 300000; // 5 min
            
            // Get user color from users list
            const userColor = users[message.user]?.color || getColorForUser(message.user);
            const isOwn = message.user === currentUser?.username;

            return (
              <div 
                key={message.id}
                className={`mb ${isOwn ? 'own' : ''} ${showAvatar ? 'first' : ''}`}
                data-testid={`message-${message.id}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (canEditDelete(message)) {
                    setContextMenu({ x: e.clientX, y: e.clientY, message });
                  }
                }}
              >
                {showAvatar && !isOwn && (
                  <div 
                    className="av"
                    style={{ background: userColor }}
                    onClick={() => onViewProfile(message.user)}
                  >
                    {message.user?.charAt(0).toUpperCase()}
                  </div>
                )}
                {!showAvatar && !isOwn && (
                  <div className="av ghost"></div>
                )}
                <div className="mb-body">
                  {showAvatar && (
                    <div className="mb-meta">
                      <span 
                        className="mb-name"
                        style={{ color: isOwn ? 'var(--blue)' : userColor }}
                        onClick={() => onViewProfile(message.user)}
                      >
                      </span>
                      <span className="mb-ts">{formatTime(message.ts)}</span>
                      {message.edited && (
                        <span className="mb-ts"> (düzenlendi)</span>
                      )}
                    </div>
                  )}
                  <div className={isOwn ? 'ob' : 'mb-text'}>
                    {message.text}
                  </div>
                </div>
                {canEditDelete(message) && (
                  <div className="mb-more-btn" style={{ display: 'none' }}>
                    <MoreVertical size={14} />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>


        {/* Members Panel - hidden for now, can be shown in future */}
      </div>

      {/* Input Area */}
      <div id="deskInputArea">
        <form id="deskInputBox" onSubmit={handleSend}>
          <button type="button" className="dsk-inp-btn" title="Emoji">
            <Smile size={18} />
          </button>
          <button type="button" className="dsk-inp-btn" title="Dosya">
            <Paperclip size={18} />
          </button>
          <textarea
            ref={inputRef}
            id="deskInp"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Mesaj yaz..."
            data-testid="chat-input"
            rows={1}
          />
          <button 
            type="submit" 
            id="deskSendBtn"
            disabled={!messageText.trim()}
            data-testid="send-message-btn"
          >
            ➤
          </button>
        </form>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998
            }}
            onClick={() => setContextMenu(null)} 
          />
          <div 
            id="msgCtxMenu"
            className="show"
            style={{ 
              position: 'fixed',
              left: contextMenu.x, 
              top: contextMenu.y,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '4px',
              zIndex: 999,
              boxShadow: '0 8px 24px rgba(0,0,0,.4)'
            }}
          >
            <div className="ctx-item" onClick={() => handleMessageAction('copy', contextMenu.message)}>
              <Copy size={14} /> Kopyala
            </div>
            {contextMenu.message.user === currentUser?.username && (
              <div className="ctx-item" onClick={() => handleMessageAction('edit', contextMenu.message)}>
                <Edit2 size={14} /> Düzenle
              </div>
            )}
            <div 
              className="ctx-item danger"
              onClick={() => handleMessageAction('delete', contextMenu.message)}
            >
              <Trash2 size={14} /> Sil
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatArea;
