/* Gigachad Agenda service worker — gigachad-agenda-v19-core */
'use strict';
var CACHE_VERSION = 'gigachad-agenda-v19-core';
var SHELL = ['/', '/index.html', '/manifest.json', '/sw.js', '/favicon.png', '/icon-192.png', '/icon-512.png'];
var KEEP_PREFIX = 'gigachad-agenda-backgrounds-';
var KEEP_INBOX = 'gigachad-agenda-share-inbox-v1';
var OFFLINE = function () { return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }); };

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_VERSION).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) {
      return k.indexOf('gigachad-agenda-') === 0 && k !== CACHE_VERSION &&
        k.indexOf(KEEP_PREFIX) !== 0 && k !== KEEP_INBOX;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(r).then(function (hit) {
    if (hit) return hit;
    return fetch(r).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var cp = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { return c.put(r, cp); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      if (r.mode === 'navigate') {
        return caches.match('/index.html').then(function (s) { return s || caches.match('/'); })
          .then(function (s) { return s || OFFLINE(); });
      }
      return OFFLINE();
    });
  }));
});
