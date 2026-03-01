// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

// Firebase config - will be injected from main app
const firebaseConfig = {
  apiKey: "AIzaSyA_4w8s2v7e7dZGiPSyZLRG_3JYQFnL_-k",
  authDomain: "ekosistem-chat.firebaseapp.com",
  databaseURL: "https://ekosistem-chat-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ekosistem-chat",
  storageBucket: "ekosistem-chat.appspot.com",
  messagingSenderId: "596821334092",
  appId: "1:596821334092:web:4f6e74c7a3e8b6e9b8c8a2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Yeni Mesaj';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Yeni bir mesajınız var',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.roomId || 'default',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // Navigate to the app
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
