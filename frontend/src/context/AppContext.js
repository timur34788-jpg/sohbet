import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, remove, get, query, orderByChild, limitToLast } from 'firebase/database';
import { getFirebaseInstance, SERVERS, getDefaultServer, setDefaultServer, signInToFirebase } from '../config/firebase';
import { 
  initializeMessaging, 
  requestNotificationPermission, 
  onMessageListener, 
  showNotification,
  saveFCMToken,
  getCurrentToken
} from '../services/notificationService';

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
  const [isLoading, setIsLoading] = useState(true);
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
  const [initialized, setInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Theme & Layout preferences
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [layout, setLayout] = useState(() => localStorage.getItem('app-layout') || 'original');

  // Get Firebase instance for current server
  const getDb = useCallback(() => {
    if (!currentServer) return null;
    return getFirebaseInstance(currentServer).db;
  }, [currentServer]);

  // Auto-initialize from saved server on mount
  useEffect(() => {
    const initFromStorage = async () => {
      const savedServer = localStorage.getItem('selectedServer');
      if (savedServer && SERVERS[savedServer]) {
        try {
          setIsLoading(true);
          
          // Sign in to Firebase anonymously first
          const fbUser = await signInToFirebase(savedServer);
          setFirebaseUser(fbUser);
          
          const { db } = getFirebaseInstance(savedServer);
          setCurrentServer(savedServer);
          
          // Load server settings
          const settingsRef = ref(db, 'settings');
          const settingsSnap = await get(settingsRef);
          if (settingsSnap.exists()) {
            setServerSettings(settingsSnap.val());
          } else {
            setServerSettings({
              registration: 'open',
              appName: SERVERS[savedServer].name
            });
          }
          
          // Check for saved user session
          const savedUserStr = localStorage.getItem(`user_${savedServer}`);
          if (savedUserStr) {
            const savedUserData = JSON.parse(savedUserStr);
            const userRef = ref(db, `users/${savedUserData.username}`);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
              const dbUser = userSnap.val();
              if (!dbUser.banned) {
                setCurrentUser({ username: savedUserData.username, ...dbUser });
                await update(ref(db, `online/${savedUserData.username}`), { 
                  ts: Date.now(), 
                  user: savedUserData.username 
                });
              } else {
                localStorage.removeItem(`user_${savedServer}`);
              }
            } else {
              localStorage.removeItem(`user_${savedServer}`);
            }
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error initializing from storage:', error);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
      setInitialized(true);
    };
    
    if (!initialized) {
      initFromStorage();
    }
  }, [initialized]);

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

  // Load notifications - skip for now as not all apps have this
  useEffect(() => {
    setNotifications([]);
  }, [currentServer, currentUser]);

  // Initialize Push Notifications
  useEffect(() => {
    if (!currentUser || !currentServer) return;

    const initNotifications = async () => {
      const supported = initializeMessaging(currentServer);
      if (!supported) {
        console.log('Push notifications not supported');
        return;
      }

      // Check if user already granted permission
      if (Notification.permission === 'granted') {
        const token = await requestNotificationPermission();
        if (token) {
          setFcmToken(token);
          setNotificationsEnabled(true);
          
          // Save token to Firebase
          const db = getDb();
          if (db) {
            await saveFCMToken(currentUser.id, token, db);
          }
        }
      }

      // Listen for foreground messages
      const unsubscribe = onMessageListener((payload) => {
        console.log('Foreground message:', payload);
        
        const title = payload.notification?.title || payload.data?.title || 'Yeni Mesaj';
        const body = payload.notification?.body || payload.data?.body || 'Yeni bir mesajınız var';
        
        // Show notification
        showNotification(title, {
          body: body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: payload.data?.roomId || 'default',
          data: payload.data
        });

        // Play notification sound (optional)
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(err => console.log('Could not play sound:', err));
        } catch (err) {
          console.log('Audio error:', err);
        }
      });

      return unsubscribe;
    };

    initNotifications();
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
    
    // Password check - try multiple hash methods
    const inputHash = await hashPassword(password);
    const inputHashOld = await hashPasswordOld(password);
    
    console.log('Stored hash:', userData.passwordHash);
    console.log('Input hash (new):', inputHash);
    console.log('Input hash (old):', inputHashOld);
    
    if (userData.passwordHash !== inputHash && userData.passwordHash !== inputHashOld) {
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
      locked: roomData.private || false,
      slowMode: 0
    };
    
    await set(newRoomRef, room);
    return { id: newRoomRef.key, ...room };
  };

  const deleteRoom = async (roomId) => {
    const db = getDb();
    if (!db) return;
    
    await remove(ref(db, `rooms/${roomId}`));
    await remove(ref(db, `msgs/${roomId}`));
    
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
  const banUser = async (username, reason = '') => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, `users/${username}`), { 
      banned: true
    });
  };

  const unbanUser = async (username) => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, `users/${username}`), { 
      banned: false
    });
  };

  const setUserRole = async (username, isAdminRole) => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, `users/${username}`), { isAdmin: isAdminRole });
    
    if (isAdminRole) {
      await set(ref(db, `admins/${username}`), true);
    } else {
      await remove(ref(db, `admins/${username}`));
    }
  };

  const createInviteCode = async () => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    const code = generateInviteCode();
    await update(ref(db, 'settings'), { inviteCode: code });
    
    return code;
  };

  const updateServerSettings = async (settings) => {
    const db = getDb();
    if (!db || !isAdmin()) return;
    
    await update(ref(db, 'settings'), settings);
    setServerSettings(prev => ({ ...prev, ...settings }));
  };

  // Forum functions
  const createForumPost = async (postData) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const forumRef = ref(db, 'forum/posts');
    const newPostRef = push(forumRef);
    
    const post = {
      text: postData.content,
      user: currentUser.username,
      ts: Date.now(),
      cat: 'genel'
    };
    
    await set(newPostRef, post);
    return { id: newPostRef.key, ...post };
  };

  const likeForumPost = async (postId) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const likeRef = ref(db, `forum/posts/${postId}/likes/${currentUser.username}`);
    const snapshot = await get(likeRef);
    
    if (snapshot.exists()) {
      await remove(likeRef);
    } else {
      await set(likeRef, true);
    }
  };

  const commentOnPost = async (postId, content) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    const commentsRef = ref(db, `forum/posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    
    await set(newCommentRef, {
      text: content,
      user: currentUser.username,
      ts: Date.now()
    });
  };

  // Friend functions
  const sendFriendRequest = async (toUsername) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    await set(ref(db, `friendRequests/${toUsername}/${currentUser.username}`), {
      ts: Date.now()
    });
    
    await set(ref(db, `friendRequestsSent/${currentUser.username}/${toUsername}`), {
      ts: Date.now()
    });
  };

  const acceptFriendRequest = async (fromUsername) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    // Add to friends
    await set(ref(db, `friends/${currentUser.username}/${fromUsername}`), { ts: Date.now() });
    await set(ref(db, `friends/${fromUsername}/${currentUser.username}`), { ts: Date.now() });
    
    // Remove from requests
    await remove(ref(db, `friendRequests/${currentUser.username}/${fromUsername}`));
    await remove(ref(db, `friendRequestsSent/${fromUsername}/${currentUser.username}`));
  };

  const rejectFriendRequest = async (fromUsername) => {
    const db = getDb();
    if (!db || !currentUser) return;
    
    await remove(ref(db, `friendRequests/${currentUser.username}/${fromUsername}`));
    await remove(ref(db, `friendRequestsSent/${fromUsername}/${currentUser.username}`));
  };

  // Utility functions
  const isAdmin = () => {
    return currentUser?.isAdmin === true;
  };

  const isMod = () => {
    return isAdmin();
  };

  // Notification functions
  const enableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setNotificationsEnabled(true);
        
        // Save token to Firebase
        const db = getDb();
        if (db && currentUser) {
          await saveFCMToken(currentUser.id, token, db);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    // Note: FCM token remains but we won't send notifications
  };

  const getNotificationStatus = () => {
    return {
      supported: 'Notification' in window && 'serviceWorker' in navigator,
      permission: Notification.permission,
      enabled: notificationsEnabled,
      token: fcmToken
    };
  };

  // Admin: Delete all messages
  const deleteAllMessages = async () => {
    try {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      
      const { ref, set } = await import('firebase/database');
      const msgsRef = ref(db, 'msgs');
      await set(msgsRef, null);
      return true;
    } catch (error) {
      console.error('Error deleting all messages:', error);
      throw error;
    }
  };

  // Admin: Clear room messages
  const clearRoomMessages = async (roomId) => {
    try {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      
      const { ref, set } = await import('firebase/database');
      const roomMsgsRef = ref(db, `msgs/${roomId}`);
      await set(roomMsgsRef, null);
      return true;
    } catch (error) {
      console.error('Error clearing room messages:', error);
      throw error;
    }
  };

  // Admin: Delete user
  const deleteUser = async (userId) => {
    try {
      const db = getDb();
      if (!db) throw new Error('Database not available');
      
      const { ref, remove } = await import('firebase/database');
      const userRef = ref(db, `users/${userId}`);
      await remove(userRef);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Admin: Get statistics
  const getStatistics = () => {
    const totalUsers = Object.keys(users).length;
    const onlineUsers = Object.values(users).filter(u => u.online).length;
    const totalRooms = rooms.length;
    const totalMessages = Object.values(messages).reduce((acc, roomMsgs) => 
      acc + Object.keys(roomMsgs || {}).length, 0
    );
    
    return {
      totalUsers,
      onlineUsers,
      totalRooms,
      totalMessages,
      totalForumPosts: forumPosts.length
    };
  };

  // Admin: Backup data
  const backupData = async () => {
    try {
      const data = {
        users,
        rooms,
        messages,
        settings: serverSettings,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${currentServer}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  };

  // Theme & Layout
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const changeLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('app-layout', newLayout);
  };

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
    notificationsEnabled,
    fcmToken,
    
    // Theme & Layout
    theme,
    layout,
    changeTheme,
    changeLayout,
    
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
    
    // Notification functions
    enableNotifications,
    disableNotifications,
    getNotificationStatus,
    
    // Admin: Data management
    deleteAllMessages,
    clearRoomMessages,
    deleteUser,
    getStatistics,
    backupData,
    
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

// Simple hash function for password (similar to original app)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Alternative hash method (base64)
async function hashPasswordOld(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

export default AppContext;
