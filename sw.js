/* Nature.co Service Worker — sw-v11 */
const C = 'sw-v11';
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

  // Sadece http/https isteklerini işle — chrome-extension, data: vs. atla
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // Dış servisler cache'lenmez
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
        // HTML dosyasını her zaman ağdan al
        if (e.request.destination === 'document') return res;

        // Sadece başarılı yanıtları cache'le
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
