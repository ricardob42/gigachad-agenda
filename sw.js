const CACHE_NAME = "gigachad-agenda-v12";
const BACKGROUND_CACHE_PREFIX = "gigachad-agenda-backgrounds-";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/sw.js",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.all(
          APP_SHELL.map(async url => {
            try {
              const response = await fetch(url, { cache: "no-store" });
              if (response.ok) {
                await cache.put(url, response);
              }
            } catch (_) {
              // Continue installation if an asset is unavailable.
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key !== CACHE_NAME &&
            !key.startsWith(BACKGROUND_CACHE_PREFIX)
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.ok &&
            networkResponse.type === "basic"
          ) {
            const copy = networkResponse.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/").then(root => {
              return root || caches.match("/index.html");
            });
          }

          return new Response("", {
            status: 503,
            statusText: "Offline"
          });
        });
    })
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
