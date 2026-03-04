/* Nature.co Service Worker — sw-v13 */
const C = 'sw-v1912';
const CACHE_URLS = ['./'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(CACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;
  if (
    url.includes('firebase') ||
    url.includes('gstatic') ||
    url.includes('googleapis') ||
    url.includes('emailjs') ||
    url.includes('giphy') ||
    url.includes('cloudflare') ||
    url.includes('fonts.gstatic') ||
    url.includes('fonts.googleapis')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (e.request.destination === 'document') return res;
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

/* ── FCM Push Bildirimleri ── */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) { data = {}; }

  const notification = data.notification || {};
  const title   = notification.title || 'Nature.co';
  const body    = notification.body  || 'Yeni bir bildirim var';
  const icon    = notification.icon  || 'data:image/svg+xml,<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M60 14 C76 22 98 44 98 68 C98 92 81 108 60 108 C39 108 22 92 22 68 C22 44 44 22 60 14Z" fill="%230e2b0c" stroke="%234a8f40" stroke-width="1.2"/></svg>';
  const badge   = icon;
  const tag     = (data.data && data.data.tag) || 'natureco';
  const url     = (data.data && data.data.url) || '/';

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data: { url },
      vibrate: [100, 50, 100],
      requireInteraction: false
    })
  );
});

/* ── Bildirime tiklayinca uygulamaya git ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
