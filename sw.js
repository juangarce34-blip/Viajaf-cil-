// ViajaFácil RC16: cache isolated to this app, network-first for pages.
const CACHE='viajafacil-rc25-v1';
const PREFIX='viajafacil-';
const ASSETS=['./index.html','./travel-money.js','./travel-money-ui.js','./entry-procedures.js','./entry-procedures-ui.js','./transport-core.js','./transport-ui.js','./journey.js','./journey.css','./geo-planner.js','./destination-core.js','./destinations.js','./official-country-data.js','./official-core.js','./trip-experience.js','./dining-core.js','./dining.js','./backup.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET' || req.mode==='no-cors') return;
  const url=new URL(req.url);
  const scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(response => {
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache => cache.put(new URL('./index.html',scope).href,copy)).catch(()=>{});
      }
      return response;
    }).catch(async () => (await caches.match(new URL('./index.html',scope).href)) || Response.error()));
    return;
  }
  if(!ASSETS.some(asset => new URL(asset,scope).pathname===url.pathname)) return;
  event.respondWith(caches.match(new URL(url.pathname,url.origin).href).then(cached => cached || fetch(req).then(response => {
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(new URL(url.pathname,url.origin).href,copy)).catch(()=>{});}
    return response;
  })));
});


