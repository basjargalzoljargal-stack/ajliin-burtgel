// Ажлын бүртгэл — Service Worker (v147)
// Стратеги: NETWORK-FIRST, зөвхөн same-origin GET хүсэлтэд.
// Supabase/CDN зэрэг cross-origin хүсэлтийг огт хөндөхгүй (шууд network руу дамжуулна).

const CACHE_NAME = 'ajliin-burtgel-shell-v147';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-192-maskable.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Зөвхөн GET хүсэлтийг барьж авна.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cross-origin (Supabase, CDN, Telegram гэх мэт) хүсэлтийг ХӨНДӨХГҮЙ.
  if (url.origin !== self.location.origin) return;

  // Same-origin GET: network-first, амжилтгүй бол cache-ээс.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
