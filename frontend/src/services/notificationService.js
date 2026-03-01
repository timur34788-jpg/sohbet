import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseInstance } from '../config/firebase';

// VAPID keys for different servers
const vapidKeys = {
  layla: process.env.REACT_APP_VAPID_KEY_LAYLA,
  biyom: process.env.REACT_APP_VAPID_KEY_BIYOM
};

let messaging = null;
let currentToken = null;
let currentServer = null;

// Get VAPID key for current server
const getVapidKey = (serverId) => {
  return vapidKeys[serverId] || vapidKeys.layla; // fallback to layla
};

// Initialize Firebase Messaging
export const initializeMessaging = (serverId) => {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Push notifications not supported in this browser');
      return false;
    }

    // Get current server from localStorage if not provided
    const server = serverId || localStorage.getItem('selectedServer');
    if (!server) {
      console.warn('No server selected');
      return false;
    }

    currentServer = server;

    // Get Firebase app instance
    const { app } = getFirebaseInstance(server);
    if (!app) {
      console.error('Firebase app not initialized');
      return false;
    }

    messaging = getMessaging(app);
    console.log('Firebase Messaging initialized for server:', server);
    return true;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return false;
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return await getFCMToken();
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Get FCM token
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      console.error('Messaging not initialized');
      return null;
    }

    if (!currentServer) {
      console.error('No server selected');
      return null;
    }

    const vapidKey = getVapidKey(currentServer);
    if (!vapidKey || vapidKey === 'PENDING') {
      console.error('VAPID key not configured for server:', currentServer);
      alert(`⚠️ Bu sunucu için bildirimler henüz yapılandırılmamış.\nLütfen ${currentServer === 'biyom' ? 'Biyom' : 'Ekosistem Chat'} Firebase projesinde Cloud Messaging'i etkinleştirin.`);
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get token
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token:', token);
      currentToken = token;
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Get current token
export const getCurrentToken = () => currentToken;

// Listen for foreground messages
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.error('Messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
};

// Show browser notification (for foreground messages)
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
};

// Save FCM token to Firebase (for sending targeted notifications)
export const saveFCMToken = async (userId, token, db) => {
  try {
    if (!token || !userId || !db) return;

    const { ref, set } = await import('firebase/database');
    const tokenRef = ref(db, `fcmTokens/${userId}`);
    await set(tokenRef, {
      token: token,
      updatedAt: Date.now(),
      platform: 'web'
    });
    console.log('FCM token saved to database');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};
