importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Basic Service Worker for offline fallback / cache
const CACHE_NAME = 'football-world-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Prevent caching of external APIs
  if (event.request.url.includes('/api/')) return;
  
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
      });
    })
  );
});

// Configure Firebase for background messages
// Note: We need a sender ID for it to work properly, but structure is provided.
try {
  // We'd pass the actual config block here in production
  // firebase.initializeApp(firebaseConfig);
  // const messaging = firebase.messaging();
} catch (e) {
  console.log("FCM SW initialization error", e);
}
