// ═══════════════════════════════════════════════════════════════
//  firebase-messaging-sw.js  —  NatureCo Push Bildirim SW
//  Bu dosya web sitenin KÖK dizinine yerleştirilmelidir:
//  örn: https://siteniz.com/firebase-messaging-sw.js
//
//  VAPID Anahtarları:
//  layla-d3710: BDqV62xUvhOyafHiqEV4QEXgqgwAc1AKF5jVX1yDGXAYALauSDZmYSVGtWgMP5VIl02jNamn6uXo5CQTRrVLOEk
//  lisa-518f0:  BCJehpZUtoODCfqCeaIqSibDvGEijqdCfn1hfRsRoZsY9UZ1ZpNUjjeYdASl9-Z9Ma8HLNV0ViXPKE6_n48CYzI
// ═══════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ── Firebase Config'ler (her iki sunucu için) ──
// Uygulama hangi sunucudaysa o config aktif olacak
// SW mesajla güncelleniyor (aşağıda onmessage dinleyicisi var)

let _app = null;
let _messaging = null;
let _activeConfig = null;

// Sayfa config gönderene kadar başlatma
self.addEventListener('message', (e) => {
  const d = e.data || {};

  if (d.type === 'FCM_INIT' && d.config && d.config.apiKey) {
    try {
      // Önceki app varsa kapat
      if (_app) {
        try { _app.delete(); } catch(err) {}
        _app = null;
        _messaging = null;
      }
      _activeConfig = d.config;
      _app = firebase.initializeApp(d.config, 'nc-fcm-sw-' + Date.now());
      _messaging = firebase.messaging(_app);
      console.log('[SW] FCM başlatıldı:', d.config.projectId);
    } catch(err) {
      console.warn('[SW] FCM init hatası:', err);
    }
  }
});

// ── Arka planda gelen push bildirimlerini göster ──
self.addEventListener('push', (e) => {
  if (!e.data) return;

  let payload;
  try { payload = e.data.json(); } catch(err) { return; }

  const notification = payload.notification || {};
  const data         = payload.data || {};

  const title = notification.title || data.title || '💬 Yeni mesaj';
  const body  = notification.body  || data.body  || '';
  const tag   = data.tag || 'nc-push-' + Date.now();

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/favicon.ico',
      badge:   '/favicon.ico',
      vibrate: [200, 100, 200],
      tag,
      renotify: true,
      data: { url: data.clickUrl || self.registration.scope }
    })
  );
});

// ── Firebase Messaging arka plan handler (SDK yöntemi) ──
// Bu, firebase-messaging SDK'sının kendi push handler'ı
// SDK yüklendikten sonra otomatik devreye girer
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || self.registration.scope;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Açık sekme varsa ona git
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
          return c.focus();
        }
      }
      // Yoksa yeni sekme aç
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Install & Activate ──
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});
