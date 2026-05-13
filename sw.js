const CACHE = 'awell-portal-v19';

// Admin caches vi IKKE — den skal altid hentes frisk fra serveren
const NO_CACHE = ['/admin.html', '/admin.css'];

const ASSETS = [
  '/', '/index.html', '/style.css', '/portal.js', '/logo.jpg',
  '/icon-192.png', '/icon-512.png', '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Admin-filer hentes altid live fra netværket
  if (NO_CACHE.some(p => url.pathname === p)) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
