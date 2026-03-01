import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, MessageCircle, Send, Image, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ForumPanel = ({ onViewProfile }) => {
  const { forumPosts, createForumPost, likeForumPost, commentOnPost, currentUser, isAdmin } = useApp();
  const [postContent, setPostContent] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    
    setLoading(true);
    try {
      await createForumPost({ content: postContent });
      setPostContent('');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    await likeForumPost(postId);
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    
    await commentOnPost(postId, commentText);
    setCommentText('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  const getLikeCount = (likes) => {
    return likes ? Object.keys(likes).length : 0;
  };

  const isLiked = (likes) => {
    return likes && currentUser?.id && likes[currentUser.id];
  };

  const getComments = (comments) => {
    if (!comments) return [];
    return Object.entries(comments).map(([id, data]) => ({ id, ...data }));
  };

  return (
    <div className="forum-panel" data-testid="forum-panel">
      <div className="forum-header">
        <h2>📋 Forum</h2>
      </div>

      {/* New Post Form */}
      <div className="forum-new-post">
        <div 
          className="post-avatar"
          style={{ background: currentUser?.color || '#5b9bd5' }}
        >
          {currentUser?.username?.charAt(0).toUpperCase()}
        </div>
        <form className="post-form" onSubmit={handleCreatePost}>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Ne düşünüyorsun?"
            rows={3}
            data-testid="forum-post-input"
          />
          <div className="post-form-actions">
            <button type="button" className="attach-btn" title="Resim Ekle">
              <Image size={18} />
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!postContent.trim() || loading}
              data-testid="forum-post-submit"
            >
              <Send size={16} /> Paylaş
            </button>
          </div>
        </form>
      </div>

      {/* Posts List */}
      <div className="forum-posts" data-testid="forum-posts">
        {forumPosts.length === 0 ? (
          <div className="no-posts">
            <div className="no-posts-icon">📋</div>
            <h3>Henüz gönderi yok</h3>
            <p>İlk gönderiyi paylaşan sen ol!</p>
          </div>
        ) : (
          forumPosts.map(post => (
            <div key={post.id} className="forum-post" data-testid={`forum-post-${post.id}`}>
              <div className="post-header">
                <div 
                  className="post-avatar"
                  style={{ background: post.authorColor || '#5b9bd5' }}
                  onClick={() => onViewProfile(post.authorId)}
                >
                  {post.authorName?.charAt(0).toUpperCase()}
                </div>
                <div className="post-meta">
                  <span 
                    className="post-author"
                    style={{ color: post.authorColor }}
                    onClick={() => onViewProfile(post.authorId)}
                  >
                    {post.authorName}
                  </span>
                  <span className="post-time">{formatTime(post.timestamp)}</span>
                </div>
                {(post.authorId === currentUser?.id || isAdmin()) && (
                  <button className="post-menu-btn">
                    <MoreVertical size={16} />
                  </button>
                )}
              </div>

              <div className="post-content">
                {post.content}
              </div>

              {post.image && (
                <div className="post-image">
                  <img src={post.image} alt="Post" />
                </div>
              )}

              <div className="post-actions">
                <button 
                  className={`action-btn like ${isLiked(post.likes) ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                  data-testid={`like-btn-${post.id}`}
                >
                  <Heart size={16} fill={isLiked(post.likes) ? 'currentColor' : 'none'} />
                  <span>{getLikeCount(post.likes)}</span>
                </button>
                <button 
                  className="action-btn comment"
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  data-testid={`comment-btn-${post.id}`}
                >
                  <MessageCircle size={16} />
                  <span>{getComments(post.comments).length}</span>
                </button>
              </div>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="post-comments">
                  {getComments(post.comments).map(comment => (
                    <div key={comment.id} className="comment">
                      <div 
                        className="comment-avatar"
                        style={{ background: comment.authorColor || '#5b9bd5' }}
                        onClick={() => onViewProfile(comment.authorId)}
                      >
                        {comment.authorName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-content">
                        <span 
                          className="comment-author"
                          style={{ color: comment.authorColor }}
                        >
                          {comment.authorName}
                        </span>
                        <span className="comment-text">{comment.content}</span>
                        <span className="comment-time">{formatTime(comment.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="comment-form">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Yorum yaz..."
                      onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                      data-testid={`comment-input-${post.id}`}
                    />
                    <button 
                      onClick={() => handleComment(post.id)}
                      disabled={!commentText.trim()}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ForumPanel;
