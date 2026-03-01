import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, remove, get, query, orderByChild, limitToLast } from 'firebase/database';
import { getFirebaseInstance, SERVERS, getDefaultServer, setDefaultServer, signInToFirebase } from '../config/firebase';

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
  const [firebaseUser, setFirebaseUser] = useState(null);
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

  // Initialize server with Firebase Auth
  const initServer = useCallback(async (serverId) => {
    if (!serverId) {
      setCurrentServer(null);
      setCurrentUser(null);
      setFirebaseUser(null);
      setServerSettings(null);
      setRooms([]);
      setMessages([]);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Sign in to Firebase anonymously first
      const fbUser = await signInToFirebase(serverId);
      setFirebaseUser(fbUser);
      
      const { db } = getFirebaseInstance(serverId);
      setCurrentServer(serverId);
      setDefaultServer(serverId);
      
      // Load server settings
      const settingsRef = ref(db, 'settings');
      const settingsSnap = await get(settingsRef);
      if (settingsSnap.exists()) {
        setServerSettings(settingsSnap.val());
      } else {
        setServerSettings({
          registration: 'open',
          appName: SERVERS[serverId].name
        });
      }
      
      // Check for saved user session
      const savedUser = localStorage.getItem(`user_${serverId}`);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Verify user still exists in database
        const userRef = ref(db, `users/${userData.username}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          const dbUser = userSnap.val();
          if (!dbUser.banned) {
            setCurrentUser({ username: userData.username, ...dbUser });
            // Update online status
            await update(ref(db, `online/${userData.username}`), { 
              ts: Date.now(), 
              user: userData.username 
            });
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
    if (!currentServer || !firebaseUser) return;
    
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
    }, (error) => {
      console.error('Error loading rooms:', error);
    });
    
    return () => unsubscribe();
  }, [currentServer, firebaseUser, getDb]);

  // Load users
  useEffect(() => {
    if (!currentServer || !firebaseUser) return;
    
    const db = getDb();
    if (!db) return;
    
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      } else {
        setUsers({});
      }
    }, (error) => {
      console.error('Error loading users:', error);
    });
    
    return () => unsubscribe();
  }, [currentServer, firebaseUser, getDb]);

  // Load messages for current room
  useEffect(() => {
    if (!currentServer || !currentRoom || !firebaseUser) {
      setMessages([]);
      return;
    }
    
    const db = getDb();
    if (!db) return;
    
    const messagesRef = ref(db, `msgs/${currentRoom.id}`);
    const messagesQuery = query(messagesRef, orderByChild('ts'), limitToLast(100));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => (a.ts || 0) - (b.ts || 0));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error('Error loading messages:', error);
      setMessages([]);
    });
    
    return () => unsubscribe();
  }, [currentServer, currentRoom, firebaseUser, getDb]);

  // Load friends
  useEffect(() => {
    if (!currentServer || !currentUser || !firebaseUser) return;
    
    const db = getDb();
    if (!db) return;
    
    const friendsRef = ref(db, `friends/${currentUser.username}`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsData = snapshot.val();
        const friendsList = Object.entries(friendsData)
          .map(([id, data]) => ({ id, ...data }));
        setFriends(friendsList);
      } else {
        setFriends([]);
      }
    }, (error) => {
      console.error('Error loading friends:', error);
    });
    
    // Load friend requests
    const requestsRef = ref(db, `friendRequests/${currentUser.username}`);
    const unsubRequests = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        const requestsList = Object.entries(requestsData)
          .map(([id, data]) => ({ id, fromUser: id, ...data }));
        setFriendRequests(requestsList);
      } else {
        setFriendRequests([]);
      }
    }, (error) => {
      console.error('Error loading friend requests:', error);
    });
    
    return () => {
      unsubscribe();
      unsubRequests();
    };
  }, [currentServer, currentUser, firebaseUser, getDb]);

  // Load forum posts
  useEffect(() => {
    if (!currentServer || !firebaseUser) return;
    
    const db = getDb();
    if (!db) return;
    
    const forumRef = ref(db, 'forum/posts');
    const unsubscribe = onValue(forumRef, (snapshot) => {
      if (snapshot.exists()) {
        const forumData = snapshot.val();
        const postsList = Object.entries(forumData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setForumPosts(postsList);
      } else {
        setForumPosts([]);
      }
    }, (error) => {
      console.error('Error loading forum posts:', error);
    });
    
    return () => unsubscribe();
  }, [currentServer, firebaseUser, getDb]);

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
    
    // Check user exists
    const userRef = ref(db, `users/${username}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const userData = snapshot.val();
    
    if (userData.banned) {
      throw new Error('Bu hesap yasaklanmış');
    }
    
    // Password check - hash comparison
    const inputHash = await hashPassword(password);
    if (userData.passwordHash !== inputHash) {
      throw new Error('Şifre yanlış');
    }
    
    // Update online status
    await update(ref(db, `online/${username}`), { 
      ts: Date.now(), 
      user: username 
    });
    
    const user = { username, ...userData };
    setCurrentUser(user);
    localStorage.setItem(`user_${currentServer}`, JSON.stringify({ username }));
    
    return user;
  };

  const register = async (userData) => {
    const db = getDb();
    if (!db) throw new Error('Server not initialized');
    
    // Check if registration is open
    if (serverSettings?.registration === 'closed') {
      throw new Error('Kayıt şu an kapalı');
    }
    
    // Check invite code if required
    if (serverSettings?.inviteCode && userData.inviteCode !== serverSettings.inviteCode) {
      throw new Error('Geçersiz davet kodu');
    }
    
    // Check if username exists
    const userRef = ref(db, `users/${userData.username}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      throw new Error('Bu kullanıcı adı zaten alınmış');
    }
    
    // Check username in usernames list
    const usernameRef = ref(db, `usernames/${userData.username.toLowerCase()}`);
    const usernameSnap = await get(usernameRef);
    if (usernameSnap.exists()) {
      throw new Error('Bu kullanıcı adı zaten alınmış');
    }
    
    // Hash password
    const passwordHash = await hashPassword(userData.password);
    
    // Create user
    const newUser = {
      username: userData.username,
      passwordHash: passwordHash,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      isAdmin: false,
      banned: false
    };
    
    await set(userRef, newUser);
    await set(usernameRef, Date.now());
    
    // Update online status
    await update(ref(db, `online/${userData.username}`), { 
      ts: Date.now(), 
      user: userData.username 
    });
    
    const user = { username: userData.username, ...newUser };
    setCurrentUser(user);
    localStorage.setItem(`user_${currentServer}`, JSON.stringify({ username: userData.username }));
    
    return user;
  };

  const logout = async () => {
    if (currentUser && currentServer) {
      const db = getDb();
      if (db) {
        await remove(ref(db, `online/${currentUser.username}`));
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
    
    const messagesRef = ref(db, `msgs/${roomId}`);
    const newMessageRef = push(messagesRef);
    
    const message = {
      text: content,
      user: currentUser.username,
      ts: Date.now(),
      ...extra
    };
    
    await set(newMessageRef, message);
    
    return { id: newMessageRef.key, ...message };
  };

  const deleteMessage = async (roomId, messageId) => {
    const db = getDb();
    if (!db) return;
    
    await remove(ref(db, `msgs/${roomId}/${messageId}`));
  };

  const editMessage = async (roomId, messageId, newContent) => {
    const db = getDb();
    if (!db) return;
    
    await update(ref(db, `msgs/${roomId}/${messageId}`), {
      text: newContent,
      edited: true
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
