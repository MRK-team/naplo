/* Offline működés: az app fájljait elmenti, és internet nélkül is megnyitja. Adatot nem tárol. */
const V = 'edzo-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = (await c.match(r, {ignoreSearch: true})) || (r.mode === 'navigate' ? await c.match('index.html') : null);
    const net = fetch(r, {cache: 'no-cache'}).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline', {status: 503});
  })());
});
