importScripts('./selector.js','./purchase-costs.js');
const CACHE='motorradar-static-v3.7.1-beta';
const ASSETS=['./backup.js','./purchase-costs.js','./purchase-costs-ui.js','./data/cost-sources.json','./','./index.html','./photo-store.js','./listing-photos.js','./selector.js','./analysis.js','./gmail-import.js','./drive-config.js','./drive-sync.js','./listing-quality.js','./listing-url.js','./ocr-parser.js','./screenshot-ocr.js','./vendor/ocr/tesseract.min.js','./vendor/ocr/worker.min.js','./vendor/ocr/tesseract-core-lstm.wasm.js','./vendor/ocr/tesseract-core-lstm.wasm','./vendor/ocr/tur.traineddata.gz','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-apple.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('motorradar-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
  if(new URL(e.request.url).pathname.endsWith('/data/cost-sources.json')){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request);if(!r.ok)throw Error('Source unavailable');
        const d=await r.clone().json();MotorPurchaseCosts.validate(d);
        await (await caches.open(CACHE)).put(e.request,r.clone());return r;
      }catch{
        const saved=await caches.match(e.request);if(!saved)return Response.error();
        const headers=new Headers(saved.headers);headers.set('X-MotorRadar-Source-Cache','stale');
        return new Response(saved.body,{status:saved.status,statusText:saved.statusText,headers});
      }
    })());return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));
});
