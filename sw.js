// Nifti service worker. Its one real job today is background push: registering it is what
// makes navigator.serviceWorker.ready / registration.pushManager resolve in
// subscribeToRealPush() (see Nifti_Sept17.html) instead of the registration call 404ing and
// push staying tab-only. It intentionally does not do offline asset caching — nothing in the
// app's design assumes an offline mode, so adding a fetch handler here would just be complexity
// nobody asked for.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
