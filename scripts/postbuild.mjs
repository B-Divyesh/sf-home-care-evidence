import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]));
  return paths.flat();
}

for (const route of ['privacy', 'terms']) {
  await mkdir(`dist/${route}`, { recursive: true });
  await cp('dist/index.html', `dist/${route}/index.html`);
}

const shell = (await files('dist'))
  .map(path => `/${relative('dist', path).replaceAll('\\\\', '/')}`)
  .filter(path => !path.endsWith('.map') && path !== '/sw.js' && path !== '/staticwebapp.config.json');

const serviceWorker = `
const VERSION = 'hce-${Date.now()}';
const SHELL = ${JSON.stringify(shell)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()).then(async () => {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
  }));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(VERSION).then(cache => cache.put(event.request, copy)); return response;
    }).catch(async () => (await caches.match(event.request)) || (['/', '/privacy', '/terms'].includes(url.pathname) ? caches.match('/index.html') : caches.match('/offline.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(VERSION).then(cache => cache.put(event.request, copy)); return response;
  })));
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
`;

await writeFile('dist/sw.js', serviceWorker);
