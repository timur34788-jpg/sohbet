/* Nature.co Service Worker — sw-v10 */
const C = 'sw-v10';
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
  if (
    e.request.url.includes('firebase') ||
    e.request.url.includes('gstatic') ||
    e.request.url.includes('googleapis') ||
    e.request.url.includes('emailjs')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // HTML dosyasını her zaman ağdan al (meta tag güncel kalsın)
        if (e.request.destination === 'document') return res;
        const clone = res.clone();
        caches.open(C).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
