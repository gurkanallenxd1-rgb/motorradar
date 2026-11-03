/* Local images only. Listing JSON and OAuth storage are never touched. */
(function(root){
 'use strict';
 let opening;
 function db(){
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   if(!root.indexedDB){reject(Error('Fotoğraf depolaması kullanılamıyor.'));return}
   const request=indexedDB.open('motorradar-photos',1);
   const timer=setTimeout(()=>reject(Error('Fotoğraf depolaması açılamadı.')),8000);
   request.onupgradeneeded=()=>request.result.createObjectStore('listings',{keyPath:'id'});
   request.onerror=request.onblocked=()=>{clearTimeout(timer);reject(Error('Fotoğraf depolaması açılamadı.'))};
   request.onsuccess=()=>{clearTimeout(timer);const connection=request.result;connection.onversionchange=()=>{connection.close();opening=null};resolve(connection)};
  }).catch(error=>{opening=null;throw error});return opening;
 }
 async function transaction(id,photos){
  const connection=await db();return new Promise((resolve,reject)=>{
   const write=photos!==undefined,tx=connection.transaction('listings',write?'readwrite':'readonly');
   const timer=setTimeout(()=>{try{tx.abort()}catch{}},10000);
   const store=tx.objectStore('listings'),request=write?store.put({id,photos}):store.get(id);
   tx.oncomplete=()=>{clearTimeout(timer);resolve(write?photos:request.result?.photos||[])};
   tx.onerror=tx.onabort=()=>{clearTimeout(timer);reject(Error('Fotoğraf kaydedilemedi. Önceki fotoğraflar ve ilan bilgileri korundu.'))};
  });
 }
 function decode(file){return new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>12*1024*1024){reject(Error('En fazla 12 MB PNG, JPEG veya WebP seç. HEIC için JPEG dışa aktar.'));return}
  const url=URL.createObjectURL(file),img=new Image(),timer=setTimeout(()=>finish(Error('Görsel açılamadı.')),15000);
  function finish(error){clearTimeout(timer);img.onload=img.onerror=null;URL.revokeObjectURL(url);error?reject(error):resolve(img)}
  img.onload=()=>finish(!img.naturalWidth||img.naturalWidth*img.naturalHeight>24000000?Error('Görsel çok büyük (en fazla 24 megapiksel).'):null);
  img.onerror=()=>finish(Error('Görsel okunamadı.'));img.src=url;
 });}
 async function optimize(file,crop={x:0,y:0,w:100,h:100}){
  if(!['x','y','w','h'].every(k=>Number.isFinite(crop[k]))||crop.x<0||crop.y<0||crop.w<=0||crop.h<=0||crop.x+crop.w>100||crop.y+crop.h>100)throw Error('Kırpma alanı görselin içinde olmalı.');
  const img=await decode(file),sx=img.naturalWidth*crop.x/100,sy=img.naturalHeight*crop.y/100,sw=img.naturalWidth*crop.w/100,sh=img.naturalHeight*crop.h/100;
  async function encode(limit,quality){const c=document.createElement('canvas'),scale=Math.min(1,limit/sw,limit/sh);c.width=Math.max(1,Math.round(sw*scale));c.height=Math.max(1,Math.round(sh*scale));
   const ctx=c.getContext('2d');if(!ctx)throw Error('Görsel işlenemedi.');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',quality));c.width=c.height=1;if(!blob||blob.size>2*1024*1024)throw Error('Fotoğraf küçültülemedi.');return blob}
  return {image:await encode(1280,.8),thumb:await encode(400,.72)};
 }
 root.MotorPhotoStore={
  get:async id=>(await transaction(id)).map(p=>({
   image:p.image instanceof Blob?p.image:new Blob([p.image],{type:'image/jpeg'}),
   thumb:p.thumb instanceof Blob?p.thumb:new Blob([p.thumb],{type:'image/jpeg'})
  })),
  set:async(id,photos)=>{
   if(!id||!Array.isArray(photos)||photos.length>4||photos.some(p=>!(p.image instanceof Blob)||!(p.thumb instanceof Blob)))throw Error('Geçersiz fotoğraf.');
   // Binary buffers avoid WebKit's IndexedDB Blob preparation failures.
   const encoded=await Promise.all(photos.map(async p=>({image:await p.image.arrayBuffer(),thumb:await p.thumb.arrayBuffer()})));
   return transaction(id,encoded);
  },optimize,decode
 };
})(window);
