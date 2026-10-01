/* ============================================================
   GIGACHAD AGENDA — Service Worker
   Application cache version: gigachad-agenda-v20

   CRITICAL RULES:
   1. The background cache ("gigachad-agenda-backgrounds-v1") and any
      cache whose name starts with "gigachad-agenda-backgrounds-"
      must NEVER be deleted.
   2. The share-target inbox cache ("gigachad-agenda-share-inbox-v1")
      must NEVER be deleted — it may hold a pending shared backup
      that the app has not consumed yet.
   Old APPLICATION caches only.
   ============================================================ */

var CACHE_VERSION = 'gigachad-agenda-v20';
var BG_CACHE_PREFIX = 'gigachad-agenda-backgrounds-';
var APP_CACHE_PREFIX = 'gigachad-agenda-';
var SHARE_CACHE_NAME = 'gigachad-agenda-share-inbox-v1';
var SHARE_INBOX_KEY = '/__gigachad-agenda-share__/pending';
var BACKUP_MAX_BYTES = 5 * 1024 * 1024;

var APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

/* Install: precache the application shell, activate immediately */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return Promise.all(APP_SHELL.map(function (url) {
        return cache.add(new Request(url, { cache: 'reload' })).catch(function () {
          // A single missing asset must not break installation —
          // the fetch handler falls back to the network for it.
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* Activate: clean OLD APPLICATION caches only.
   Never touch background caches, the share inbox, or unrelated caches. */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        if (name === CACHE_VERSION) return null;
        // NEVER delete background caches (user images live there)
        if (name.indexOf(BG_CACHE_PREFIX) === 0) return null;
        // NEVER delete the share-target inbox (pending shared backups)
        if (name === SHARE_CACHE_NAME) return null;
        // Never delete unrelated application data
        if (name.indexOf(APP_CACHE_PREFIX) !== 0) return null;
        // Only old Gigachad Agenda application caches are removed
        return caches.delete(name);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Fetch:
   - POST multipart to the app root = PWA share_target (Android share
     sheet) → stash the shared backup file in the inbox cache and
     redirect to .?shared=1 so the app imports it on startup.
   - GET: cache-first for same-origin, network fallback, offline
     navigation fallback to the shell. */
self.addEventListener('fetch', function (event) {
  var request = event.request;

  if (request.method === 'POST') {
    handleShareTarget(event);
    return;
  }

  if (request.method !== 'GET') return;

  var url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  event.respondWith(handleRequest(request));
});

function handleShareTarget(event) {
  var request = event.request;
  var url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // The manifest share_target action points at the app root
  var pathOk = url.pathname === '/' || url.pathname === '/index.html';
  var type = '';
  try {
    type = (request.headers && request.headers.get('content-type')) || '';
  } catch (err) {
    type = '';
  }
  if (!pathOk || type.indexOf('multipart/form-data') === -1) return;

  event.respondWith(
    request.formData().then(function (data) {
      var file = data && typeof data.get === 'function' ? data.get('backup') : null;
      if (!file || typeof file === 'string' || file.size > BACKUP_MAX_BYTES) {
        return Response.redirect('./?shared=error', 303);
      }
      return caches.open(SHARE_CACHE_NAME).then(function (cache) {
        return cache.put(SHARE_INBOX_KEY, new Response(file, {
          headers: { 'Content-Type': file.type || 'application/json' }
        }));
      }).then(function () {
        return Response.redirect('./?shared=1', 303);
      });
    }).catch(function () {
      return Response.redirect('./?shared=error', 303);
    })
  );
}

function handleRequest(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;

    return fetch(request).then(function (response) {
      if (response && response.ok && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(request, clone).catch(function () {
            // Cache write failures are non-fatal.
          });
        });
      }
      return response;
    }).catch(function (err) {
      if (request.mode === 'navigate') {
        return caches.match('/').then(function (shell) {
          if (shell) return shell;
          return caches.match('/index.html').then(function (indexShell) {
            if (indexShell) return indexShell;
            return new Response('Gigachad Agenda is offline and the app shell is unavailable.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
        });
      }
      return Response.error();
    });
  });
}
