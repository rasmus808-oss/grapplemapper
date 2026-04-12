const CACHE = 'grapplemapper-v5.1';
const APP_SHELL = [
  '/grapplemapper/',
  '/grapplemapper/index.html',
  '/grapplemapper/manifest.json',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always fetch external media live
  if (url.includes('youtube.com') || url.includes('googleapis.com') ||
      url.includes('instagram.com') || url.includes('facebook.com') ||
      url.includes('google.com/oembed') || url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
    return;
  }

  // Network-first for HTML — ensures users always get the latest version
  if (e.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match(e.request); })
    );
    return;
  }

  // Cache-first for everything else (manifest, icons)
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return resp;
      });
    })
  );
});
