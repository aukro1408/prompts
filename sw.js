/* Промпты — service worker: офлайн-оболочка приложения */
const CACHE = 'prompts-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/hero-banner-british.jpg',
  './img/card-placeholder.jpg',
  './img/hero2.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // OAuth-возврат и чужие домены — всегда напрямую
  if (u.origin !== self.location.origin || u.searchParams.has('code') || u.searchParams.has('error')) return;
  if (e.request.mode === 'navigate') {
    // страницы: сначала сеть, офлайн — кэш
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // статика: сначала кэш, потом сеть
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }))
  );
});
