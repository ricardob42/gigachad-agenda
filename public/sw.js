/* Gigachad Agenda service worker.
   The version and precache list below are stamped in at build time (see vite.config.js). */
const VERSION = '__VERSION__';
const CACHE = 'gigachad-agenda-' + VERSION;
const PRECACHE = ['__PRECACHE__'];
const SHARE_INBOX = 'gigachad-agenda-share-inbox-v1';
const SHARE_PATH = '/__gigachad-agenda-share__/pending';
const KEEP_PREFIX = 'gigachad-agenda-backgrounds-';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('gigachad-agenda-') && k !== CACHE && k !== SHARE_INBOX && !k.startsWith(KEEP_PREFIX))
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Web Share Target: a shared backup .json arrives as a POST to "/".
async function receiveShare(req) {
  try {
    const f = (await req.formData()).get('backup');
    if (!f || typeof f === 'string' || f.size > 5242880) return Response.redirect('/?shared=error', 303);
    const inbox = await caches.open(SHARE_INBOX);
    await inbox.put(SHARE_PATH, new Response(await f.text(), { headers: { 'Content-Type': 'application/json' } }));
    return Response.redirect('/?shared=1', 303);
  } catch {
    return Response.redirect('/?shared=error', 303);
  }
}

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.method === 'POST' && u.pathname === '/') { e.respondWith(receiveShare(r)); return; }
  if (r.method !== 'GET') return;
  e.respondWith(
    caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then((hit) => hit || fetch(r).catch(() => (r.mode === 'navigate' ? caches.match('/') : Response.error()))),
  );
});
