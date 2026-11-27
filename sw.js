// Nifti service worker.
// 1) Background push (unchanged): registering it is what makes navigator.serviceWorker.ready /
//    registration.pushManager resolve in subscribeToRealPush() (see Nifti_Sept17.html).
// 2) Works without internet (Round 82): the app itself is kept on the phone so Nifti opens with
//    no signal. Pages load from the network first (so updates show right away) and fall back to
//    the saved copy when there is no signal. Business data never goes through this cache: the app
//    keeps its own copy and queues sales, utang payments, expenses and cash counts until the
//    internet is back (see bkQueue in the app).

const CACHE = 'nifti-app-v86';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './favicon-32.png', './favicon-48.png', './apple-touch-icon.png', './beta-pauses.js'];
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com)\//;
const CDN_SHELL = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Caveat:wght@600;700&display=swap'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // 'default' lets the browser reuse what it just downloaded for the page instead of fetching it again
  event.waitUntil(keepShell());
});
function keepShell() {
  return caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'default' })).catch(() => null))
    .concat(CDN_SHELL.map((u) => c.add(new Request(u, { mode: 'cors', cache: 'default' })).catch(() => null)))));
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('nifti-app-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isAppPage(url) {
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin) return false;
  const p = url.pathname.slice(scope.pathname.length);
  return p === '' || p === 'index.html';
}

async function networkFirst(request, fallbackKey) {
  const cache = await caches.open(CACHE);
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(request, { signal: ctl.signal });
    clearTimeout(t);
    if (res && res.ok) cache.put(fallbackKey || request, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    const hit = await cache.match(fallbackKey || request, { ignoreSearch: true });
    if (hit) return hit;
    throw e;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const net = fetch(request).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).catch(() => {}); return res; }).catch(() => null);
  return hit || (await net) || new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  // the app's data (Supabase) is never cached here
  if (/\.supabase\.co$/.test(url.hostname)) return;
  if (req.mode === 'navigate') {
    if (isAppPage(url)) { event.respondWith(networkFirst(req, './')); return; }
    if (url.origin === location.origin) { event.respondWith(networkFirst(req)); }
    return;
  }
  if (CDN.test(req.url)) { event.respondWith(staleWhileRevalidate(req)); return; }
  if (url.origin === location.origin && /\.(png|jpg|jpeg|webp|svg|ico|js|css|json|woff2?)$/i.test(url.pathname)) { event.respondWith(staleWhileRevalidate(req)); }
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  // the page asks to keep its own copy (first visit, before this worker controlled the page)
  if (d.type === 'nifti-cache-shell') event.waitUntil(keepShell());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'Nifti';
  const options = {
    body: payload.body || '',
    icon: 'icon-192.png',
    badge: 'favicon-48.png',
    data: { url: payload.url || './' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  // Open (or bring forward) Nifti on the screen the notification is about, e.g. ./#messages.
  const target = new URL(url, self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'nifti-open', url: target });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
