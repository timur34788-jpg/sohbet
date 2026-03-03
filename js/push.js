/* Nature.co — push.js */
/* Web Push / Firebase Cloud Messaging entegrasyonu */

// ── FCM VAPID Key ──
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair
// Aşağıdaki değeri kendi VAPID public key'iniz ile değiştirin
// Her sunucu icin ayri VAPID key
const FCM_VAPID_KEYS = {
  'sohbet': 'BDqV62xUvhOyafHiqEV4QEXgqgwAc1AKF5jVX1yDGXAYALauSDZmYSVGtWgMP5VIl02jNamn6uXo5CQTRrVLOEk',
  'chat':   'BCJehpZUtoODCfqCeaIqSibDvGEijqdCfn1hfRsRoZsY9UZ1ZpNUjjeYdASl9-Z9Ma8HLNV0ViXPKE6_n48CYzI'
};
function getVapidKey(){ return FCM_VAPID_KEYS[_activeServer] || null; }
const FCM_VAPID_KEY = 'multi';

let _pushToken = null;

function isPushSupported(){
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    typeof firebase !== 'undefined' &&
    typeof getVapidKey === 'function' && !!getVapidKey()
  );
}

async function requestPushPermission(){
  if(!isPushSupported()) return null;
  try{
    const permission = await Notification.requestPermission();
    if(permission !== 'granted') return null;
    return await getPushToken();
  }catch(e){ console.warn('Push izin hatasi:', e); return null; }
}

async function getPushToken(){
  if(!isPushSupported()) return null;
  try{
    const app = firebase.apps.length ? firebase.apps[0] : null;
    if(!app) return null;
    const messaging = firebase.messaging(app);
    const sw = await navigator.serviceWorker.ready;
    const vapidKey = getVapidKey(); if(!vapidKey) return null;
    const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: sw });
    if(token){ _pushToken = token; await savePushToken(token); return token; }
    return null;
  }catch(e){ console.warn('FCM token hatasi:', e); return null; }
}

async function savePushToken(token){
  if(!token || !_cu || !_db) return;
  try{
    await _db.ref('users/'+_cu+'/pushTokens/'+_activeServer).set({ token, updatedAt: Date.now(), platform: 'web' });
  }catch(e){ console.warn('Push token kayit hatasi:', e); }
}

async function removePushToken(){
  if(!_pushToken || !_cu || !_db) return;
  try{ await _db.ref('users/'+_cu+'/pushTokens/'+_activeServer).remove(); _pushToken = null; }catch(e){}
}

async function initPushAfterLogin(){
  if(!isPushSupported()) return;
  if(Notification.permission === 'granted'){ await getPushToken(); return; }
  if(Notification.permission === 'default'){
    const dismissed = localStorage.getItem('push_dismissed');
    if(dismissed && Date.now() - parseInt(dismissed) < 7*24*60*60*1000) return;
    setTimeout(showPushPermissionPrompt, 3000);
  }
}



async function acceptPushPrompt(){
  dismissPushPrompt();
  const token = await requestPushPermission();
  if(token && typeof showToast === 'function') showToast("Bildirimler acildi! Apple Watch'ta da alirsin.");
}

function dismissPushPrompt(){
  const el = document.getElementById('pushPrompt');
  if(el) el.remove();
  try{ localStorage.setItem('push_dismissed', Date.now()); }catch(e){}
}

function initForegroundPushListener(){
  if(!isPushSupported()) return;
  try{
    const app = firebase.apps.length ? firebase.apps[0] : null;
    if(!app) return;
    const messaging = firebase.messaging(app);
    messaging.onMessage(payload => {
      const title = (payload.notification && payload.notification.title) || 'Nature.co';
      const body  = (payload.notification && payload.notification.body)  || '';
      if(typeof showToast === 'function') showToast('\uD83D\uDD14 ' + (body || title));
      if(Notification.permission === 'granted'){
        new Notification(title, { body, tag:'natureco' });
      }
    });
  }catch(e){ console.warn('FCM foreground listener hatasi:', e); }
}

function showPushPermissionPrompt(){
  if(document.getElementById('pushPrompt')) return;
  if(Notification.permission !== 'default') return;
  var dismissed = localStorage.getItem('push_dismissed');
  if(dismissed && Date.now() - parseInt(dismissed) < 7*24*60*60*1000) return;
  var el = document.createElement('div');
  el.id = 'pushPrompt';
  el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0f2015;border:1px solid #2d5a28;border-radius:14px;padding:14px 18px;z-index:9000;max-width:320px;width:calc(100% - 32px);display:flex;gap:12px;align-items:center;box-shadow:0 8px 32px rgba(0,0,0,.6);';
  var bell = document.createElement('div'); bell.style.fontSize = '22px'; bell.textContent = String.fromCodePoint(0x1F514);
  var info = document.createElement('div'); info.style.flex = '1';
  var t1 = document.createElement('div'); t1.style.cssText = 'font-size:13px;font-weight:700;color:#d4e8d0;margin-bottom:3px'; t1.textContent = 'Bildirimler';
  var t2 = document.createElement('div'); t2.style.cssText = 'font-size:11px;color:#4a6b46;line-height:1.5'; t2.textContent = 'Yeni mesaj ve isteklerden haberdar ol.';
  info.appendChild(t1); info.appendChild(t2);
  var btns = document.createElement('div'); btns.style.cssText = 'display:flex;flex-direction:column;gap:6px';
  var bYes = document.createElement('button'); bYes.style.cssText = 'padding:6px 12px;background:#2d5a28;border:none;border-radius:8px;color:#6dbf67;font-size:11px;font-weight:700;cursor:pointer'; bYes.textContent = 'Ac'; bYes.onclick = acceptPushPrompt;
  var bNo = document.createElement('button'); bNo.style.cssText = 'padding:6px 12px;background:transparent;border:1px solid #1a3018;border-radius:8px;color:#4a6b46;font-size:11px;cursor:pointer'; bNo.textContent = 'Hayir'; bNo.onclick = dismissPushPrompt;
  btns.appendChild(bYes); btns.appendChild(bNo);
  el.appendChild(bell); el.appendChild(info); el.appendChild(btns);
  document.body.appendChild(el);
}