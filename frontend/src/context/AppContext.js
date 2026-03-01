import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, remove, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { getFirebaseInstance, SERVERS, getDefaultServer, setDefaultServer } from '../config/firebase';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentServer, setCurrentServer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [serverSettings, setServerSettings] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Get Firebase instance for current server
  const getDb = useCallback(() => {
    if (!currentServer) return null;
    return getFirebaseInstance(currentServer).db;
  }, [currentServer]);

  // Initialize server
  const initServer = useCallback(async (serverId) => {
    try {
      setIsLoading(true);
      const { db } = getFirebaseInstance(serverId);
      setCurrentServer(serverId);
      setDefaultServer(serverId);
      
      // Load server settings
      const settingsRef = ref(db, 'serverSettings');
      const settingsSnap = await get(settingsRef);
      if (settingsSnap.exists()) {
        setServerSettings(settingsSnap.val());
      } else {
        // Default settings
        const defaultSettings = {
          name: SERVERS[serverId].name,
          registrationOpen: true,
          requireInviteCode: true,
          maintenanceMode: false
        };
        await set(settingsRef, defaultSettings);
        setServerSettings(defaultSettings);
      }
      
      // Check for saved user session
      const savedUser = localStorage.getItem(`user_${serverId}`);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Verify user still exists in database
        const userRef = ref(db, `users/${userData.id}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          const dbUser = userSnap.val();
          if (!dbUser.banned) {
            setCurrentUser({ id: userData.id, ...dbUser });
            // Update online status
            await update(userRef, { online: true, lastSeen: Date.now() });
          } else {
            localStorage.removeItem(`user_${serverId}`);
          }
        } else {
          localStorage.removeItem(`user_${serverId}`);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing server:', error);
      setIsLoading(false);
    }
  }, []);

  // Load rooms
  useEffect(() => {
    if (!currentServer || !currentUser) return;
    
    const db = getDb();
    if (!db) return;
    
    const roomsRef = ref(db, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomsData = snapshot.val();
        const roomsList = Object.entries(roomsData).map(([id, data]) => ({
          id,
          ...data
        }));
        setRooms(roomsList);
      } else {
        setRooms([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentServer, currentUser, getDb]);

  // Load users
  useEffect(() => {
    if (!currentServer) return;
    
    const db = getDb();
    if (!db) return;
    
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      } else {
        setUsers({});
      }
    });
    
    return () => unsubscribe();
  }, [currentServer, getDb]);

  // Load messages for current room
  useEffect(() => {
    if (!currentServer || !currentRoom) {
      setMessages([]);
      return;
    }
    
    const db = getDb();
    if (!db) return;
    
    const messagesRef = ref(db, `messages/${currentRoom.id}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentServer, currentRoom, getDb]);

  // Load friends
  useEffect(() => {
    if (!currentServer || !currentUser) return;
    
    const db = getDb();
    if (!db) return;
    
    const friendsRef = ref(db, `friends/${currentUser.id}`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsData = snapshot.val();
        const friendsList = Object.entries(friendsData)
          .filter(([_, data]) => data.status === 'accepted')
          .map(([id, data]) => ({ id, ...data }));
        setFriends(friendsList);
        
        const requestsList = Object.entries(friendsData)
          .filter(([_, data]) => data.status === 'pending' && data.fromId !== currentUser.id)
          .map(([id, data]) => ({ id, ...data }));
        setFriendRequests(requestsList);
      } else {
        setFriends([]);
        setFriendRequests([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentServer, currentUser, getDb]);

  // Load forum posts
  useEffect(() => {
    if (!currentServer) return;
    
    const db = getDb();
    if (!db) return;
    
    const forumRef = ref(db, 'forum');
    const unsubscribe = onValue(forumRef, (snapshot) => {
      if (snapshot.exists()) {
        const forumData = snapshot.val();
        const postsList = Object.entries(forumData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setForumPosts(postsList);
      } else {
        setForumPosts([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentServer, getDb]);

  // Load notifications
  useEffect(() => {
    if (!currentServer || !currentUser) return;
    
    const db = getDb();
    if (!db) return;
    
    const notifRef = ref(db, `notifications/${currentUser.id}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const notifData = snapshot.val();
        const notifList = Object.entries(notifData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setNotifications(notifList);
      } else {
        setNotifications([]);
      }
    });
    
    return () => unsubscribe();
  }, [currentServer, currentUser, getDb]);

  // Auth functions
  const login = async (username, password) => {
    const db = getDb();
    if (!db) throw new Error('Server not initialized');
    
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const usersData = snapshot.val();
    const userEntry = Object.entries(usersData).find(
      ([_, user]) => user.username?.toLowerCase() === username.toLowerCase()
    );
    
    if (!userEntry) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const [userId, userData] = userEntry;
    
    if (userData.banned) {
      throw new Error('Bu hesap yasaklanmış');
    }
    
    // Simple password check (in production use proper hashing)
    if (userData.password !== password) {
      throw new Error('Şifre yanlış');
    }
    
    // Update online status
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { online: true, lastSeen: Date.now() });
    
    const user = { id: userId, ...userData };
    setCurrentUser(user);
    localStorage.setItem(`user_${currentServer}`, JSON.stringify({ id: userId }));
    
    return user;
  };

  const register = async (userData) => {
    const db = getDb();
    if (!db) throw new Error('Server not initialized');
    
    // Check if registration is open
    if (serverSettings && !serverSettings.registrationOpen) {
      throw new Error('Kayıt şu an kapalı');
    }
    
    // Check invite code if required
    if (serverSettings?.requireInviteCode && userData.inviteCode) {
      const inviteRef = ref(db, `inviteCodes/${userData.inviteCode}`);
      const inviteSnap = await get(inviteRef);
      if (!inviteSnap.exists() || inviteSnap.val().used) {
        throw new Error('Geçersiz davet kodu');
      }
    }
    
    // Check if username exists
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const exists = Object.values(usersData).some(
        user => user.username?.toLowerCase() === userData.username.toLowerCase()
      );
      if (exists) {
        throw new Error('Bu kullanıcı adı zaten alınmış');
      }
      
      // Check email
      const emailExists = Object.values(usersData).some(
        user => user.email?.toLowerCase() === userData.email.toLowerCase()
      );
      if (emailExists) {
        throw new Error('Bu e-posta zaten kayıtlı');
      }
    }
    
    // Create user
    const newUserRef = push(usersRef);
    const newUser = {
      username: userData.username,
      email: userData.email,
      password: userData.password, // In production, hash this
      origin: userData.origin || '',
      role: 'member',
      online: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
      banned: false,
      color: getRandomColor()
    };
    
    await set(newUserRef, newUser);
    
    // Mark invite code as used
    if (userData.inviteCode) {
      await update(ref(db, `inviteCodes/${userData.inviteCode}`), { 
        used: true, 
        usedBy: newUserRef.key,
        usedAt: Date.now()
      });
    }
    
    const user = { id: newUserRef.key, ...newUser };
    setCurrentUser(user);
    localStorage.setItem(`user_${currentServer}`, JSON.stringify({ id: newUserRef.key }));
    
    return user;
  };

  const logout = async () => {
    if (currentUser && currentServer) {
      const db = getDb();
      if (db) {
        const userRef = ref(db, `users/${currentUser.id}`);
        await update(userRef, { online: false, lastSeen: Date.now() });
      }
      localStorage.removeItem(`user_${currentServer}`);
    }
    setCurrentUser(null);
    setCurrentRoom(null);
    setMessages([]);
  };

  // Message functions
  const sendMessage = async (roomId, content, type = 'text', extra = {}) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const messagesRef = ref(db, `messages/${roomId}`);
    const newMessageRef = push(messagesRef);
    
    const message = {
      content,
      type,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderColor: currentUser.color,
      timestamp: Date.now(),
      ...extra
    };
    
    await set(newMessageRef, message);
    
    // Update room's last message
    await update(ref(db, `rooms/${roomId}`), {
      lastMessage: content.substring(0, 50),
      lastMessageTime: Date.now(),
      lastMessageBy: currentUser.username
    });
    
    return { id: newMessageRef.key, ...message };
  };

  const deleteMessage = async (roomId, messageId) => {
    const db = getDb();
    if (!db) return;
    
    await remove(ref(db, `messages/${roomId}/${messageId}`));
  };

  const editMessage = async (roomId, messageId, newContent) => {
    const db = getDb();
    if (!db) return;
    
    await update(ref(db, `messages/${roomId}/${messageId}`), {
      content: newContent,
      edited: true,
      editedAt: Date.now()
    });
  };

  // Room functions
  const createRoom = async (roomData) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    
    const room = {
      name: roomData.name,
      description: roomData.description || '',
      type: roomData.type || 'channel', // channel, group, dm
      icon: roomData.icon || '#',
      createdBy: currentUser.id,
      createdAt: Date.now(),
      members: roomData.members || {},
      private: roomData.private || false
    };
    
    await set(newRoomRef, room);
    return { id: newRoomRef.key, ...room };
  };

  const deleteRoom = async (roomId) => {
    const db = getDb();
    if (!db) return;
    
    await remove(ref(db, `rooms/${roomId}`));
    await remove(ref(db, `messages/${roomId}`));
    
    if (currentRoom?.id === roomId) {
      setCurrentRoom(null);
    }
  };

  const updateRoom = async (roomId, updates) => {
    const db = getDb();
    if (!db) return;
    
    await update(ref(db, `rooms/${roomId}`), updates);
  };

  // Admin functions
  const banUser = async (userId, reason = '') => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, `users/${userId}`), { 
      banned: true, 
      bannedAt: Date.now(),
      bannedBy: currentUser.id,
      banReason: reason
    });
  };

  const unbanUser = async (userId) => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, `users/${userId}`), { 
      banned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null
    });
  };

  const setUserRole = async (userId, role) => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, `users/${userId}`), { role });
  };

  const createInviteCode = async () => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    const code = generateInviteCode();
    const inviteRef = ref(db, `inviteCodes/${code}`);
    
    await set(inviteRef, {
      createdBy: currentUser.id,
      createdAt: Date.now(),
      used: false
    });
    
    return code;
  };

  const updateServerSettings = async (settings) => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, 'serverSettings'), settings);
    setServerSettings(prev => ({ ...prev, ...settings }));
  };

  // Forum functions
  const createForumPost = async (postData) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const forumRef = ref(db, 'forum');
    const newPostRef = push(forumRef);
    
    const post = {
      content: postData.content,
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorColor: currentUser.color,
      timestamp: Date.now(),
      likes: {},
      comments: {},
      image: postData.image || null
    };
    
    await set(newPostRef, post);
    return { id: newPostRef.key, ...post };
  };

  const likeForumPost = async (postId) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const likeRef = ref(db, `forum/${postId}/likes/${currentUser.id}`);
    const snapshot = await get(likeRef);
    
    if (snapshot.exists()) {
      await remove(likeRef);
    } else {
      await set(likeRef, { timestamp: Date.now() });
    }
  };

  const commentOnPost = async (postId, content) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const commentsRef = ref(db, `forum/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    
    await set(newCommentRef, {
      content,
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorColor: currentUser.color,
      timestamp: Date.now()
    });
  };

  // Friend functions
  const sendFriendRequest = async (userId) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    // Add to both users' friends lists
    await set(ref(db, `friends/${currentUser.id}/${userId}`), {
      status: 'pending',
      fromId: currentUser.id,
      timestamp: Date.now()
    });
    
    await set(ref(db, `friends/${userId}/${currentUser.id}`), {
      status: 'pending',
      fromId: currentUser.id,
      timestamp: Date.now()
    });
    
    // Send notification
    await push(ref(db, `notifications/${userId}`), {
      type: 'friendRequest',
      fromId: currentUser.id,
      fromName: currentUser.username,
      timestamp: Date.now(),
      read: false
    });
  };

  const acceptFriendRequest = async (userId) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    await update(ref(db, `friends/${currentUser.id}/${userId}`), { status: 'accepted' });
    await update(ref(db, `friends/${userId}/${currentUser.id}`), { status: 'accepted' });
  };

  const rejectFriendRequest = async (userId) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    await remove(ref(db, `friends/${currentUser.id}/${userId}`));
    await remove(ref(db, `friends/${userId}/${currentUser.id}`));
  };

  // Utility functions
  const isAdmin = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'owner';
  };

  const isMod = () => {
    return currentUser?.role === 'mod' || isAdmin();
  };

  const value = {
    // State
    currentServer,
    currentUser,
    isLoading,
    rooms,
    currentRoom,
    messages,
    users,
    serverSettings,
    friends,
    friendRequests,
    forumPosts,
    notifications,
    servers: SERVERS,
    
    // Server functions
    initServer,
    
    // Auth functions
    login,
    register,
    logout,
    
    // Room functions
    setCurrentRoom,
    createRoom,
    deleteRoom,
    updateRoom,
    
    // Message functions
    sendMessage,
    deleteMessage,
    editMessage,
    
    // Admin functions
    banUser,
    unbanUser,
    setUserRole,
    createInviteCode,
    updateServerSettings,
    isAdmin,
    isMod,
    
    // Forum functions
    createForumPost,
    likeForumPost,
    commentOnPost,
    
    // Friend functions
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    
    // Utils
    getDb
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Helper functions
function getRandomColor() {
  const colors = [
    '#5b9bd5', '#6c63ff', '#2ecc71', '#f97316', '#ec4899', 
    '#00bca0', '#fbbf24', '#e05555', '#9b59b6', '#1abc9c'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default AppContext;
