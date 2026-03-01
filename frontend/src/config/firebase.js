import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Server configurations
export const SERVERS = {
  biyom: {
    id: 'biyom',
    name: 'Biyom',
    description: 'Genel sohbet odaları',
    icon: '🌐',
    color: '#5b9bd5',
    config: {
      apiKey: "AIzaSyCluGUx9dqi4R_Udd4teG4A7T5aL-xgO8U",
      authDomain: "sohbet-cfe7f.firebaseapp.com",
      databaseURL: "https://sohbet-cfe7f-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "sohbet-cfe7f",
      storageBucket: "sohbet-cfe7f.firebasestorage.app",
      messagingSenderId: "672228058338",
      appId: "1:672228058338:web:9bd002534b9bf2e51caabb",
      measurementId: "G-RET7EPDNKZ"
    }
  },
  layla: {
    id: 'layla',
    name: 'Ekosistem Chat',
    description: 'Özel chat kanalı',
    icon: '🌐',
    color: '#2ecc71',
    config: {
      apiKey: "AIzaSyCXVbDjj8pKxhKUCOEP_kSL_2ll4JsNwak",
      authDomain: "layla-70d21.firebaseapp.com",
      databaseURL: "https://layla-70d21-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "layla-70d21",
      storageBucket: "layla-70d21.firebasestorage.app",
      messagingSenderId: "1057180434994",
      appId: "1:1057180434994:web:e797773af5e03f1f9ff22b",
      measurementId: "G-PVX40L6D9J"
    }
  }
};

// Firebase instances cache
const firebaseInstances = {};

export const getFirebaseInstance = (serverId) => {
  if (!firebaseInstances[serverId]) {
    const serverConfig = SERVERS[serverId];
    if (!serverConfig) {
      throw new Error(`Server not found: ${serverId}`);
    }
    
    const app = initializeApp(serverConfig.config, serverId);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    firebaseInstances[serverId] = { app, db, auth, storage };
  }
  
  return firebaseInstances[serverId];
};

// Sign in anonymously to Firebase Auth
export const signInToFirebase = async (serverId) => {
  const { auth } = getFirebaseInstance(serverId);
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase Auth error:', error);
    throw error;
  }
};

export const getDefaultServer = () => {
  return localStorage.getItem('selectedServer') || 'biyom';
};

export const setDefaultServer = (serverId) => {
  localStorage.setItem('selectedServer', serverId);
};
