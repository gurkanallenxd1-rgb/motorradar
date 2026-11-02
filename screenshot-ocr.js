/* All image decoding and OCR run locally. Assets are same-origin and vendored. */
(function(root){
  'use strict';
  const MAX_FILES=6,MAX_BYTES=12*1024*1024,MAX_PIXELS=24000000;
  function validate(files){
    if(!files.length||files.length>MAX_FILES)throw Error('Bir seferde 1–6 ekran görüntüsü seç.');
    for(const f of files){if(!['image/png','image/jpeg','image/webp'].includes(f.type))throw Error('PNG, JPEG veya WebP seç. HEIC görselini önce PNG/JPEG olarak dışa aktar.');if(!f.size||f.size>MAX_BYTES)throw Error('Her görsel 12 MB veya altında olmalı.');}
  }
  function decode(file){return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();let timer;
    const cleanup=()=>{clearTimeout(timer);img.onload=img.onerror=null;URL.revokeObjectURL(url)};
    img.onload=()=>{cleanup();const w=img.naturalWidth,h=img.naturalHeight;if(!w||!h||w*h>MAX_PIXELS){reject(Error('Görsel çok büyük. Daha küçük bir ekran görüntüsü seç.'));return;}
      const canvas=document.createElement('canvas'),scale=Math.min(1,2000/w,3000/h);canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);const ctx=canvas.getContext('2d');if(!ctx){reject(Error('Görsel işlenemedi.'));return;}ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas);};
    img.onerror=()=>{cleanup();reject(Error('Görsel okunamadı. Başka bir PNG/JPEG seç.'));};timer=setTimeout(()=>{cleanup();reject(Error('Görsel açılırken süre doldu.'));},15000);img.src=url;
  });}
  function start(files,onProgress){
    let worker,rawWorker,stopped=false,timer;let rejectCancel;
    const cancelled=new Promise((_,reject)=>{rejectCancel=reject});
    const stop=()=>{if(stopped)return;stopped=true;clearTimeout(timer);if(rawWorker)rawWorker.terminate();if(worker)worker.terminate().catch(()=>{});rejectCancel(Error('Okuma iptal edildi. Manuel giriş yapabilirsin.'));};
    const job=(async()=>{
      validate(files);if(typeof WebAssembly==='undefined'||!root.Tesseract)throw Error('Bu tarayıcıda OCR başlatılamadı. Manuel giriş yapabilirsin.');
      timer=setTimeout(stop,120000);
      const base=new URL('./vendor/ocr/',document.baseURI).href;
      worker=await root.Tesseract.createWorker('tur',1,{workerPath:base+'worker.min.js',corePath:base+'tesseract-core-lstm.wasm.js',langPath:base,workerBlobURL:false,cacheMethod:'none',onWorker:w=>{rawWorker=w;w.addEventListener('error',()=>rejectCancel(Error('OCR başlatılamadı.')));},errorHandler:()=>rejectCancel(Error('OCR dosyaları yüklenemedi veya okuma başarısız oldu.')),logger:m=>{if(!stopped)onProgress(m.status, m.progress||0);}});
      if(stopped){await worker.terminate();throw Error('Okuma iptal edildi.');}
      const pages=[];
      for(let i=0;i<files.length;i++){
        if(stopped)throw Error('Okuma iptal edildi.');onProgress(`${i+1}/${files.length} görsel okunuyor`,0);
        const canvas=await decode(files[i]);
        if(stopped){canvas.width=canvas.height=1;throw Error('Okuma iptal edildi.');}
        try{const result=await worker.recognize(canvas,{}, {blocks:true,text:true});
          pages.push({lines:(result.data.blocks||[]).flatMap(b=>b.paragraphs||[]).flatMap(p=>p.lines||[]).map(l=>({text:l.text,confidence:l.confidence}))});
        }finally{canvas.width=canvas.height=1;}
      }
      return MotorOCR.extract(pages);
    })();
    return {cancel:stop,promise:Promise.race([job,cancelled]).finally(()=>{clearTimeout(timer);stopped=true;if(rawWorker)rawWorker.terminate();if(worker)worker.terminate().catch(()=>{});})};
  }
  root.ScreenshotOCR={start,validate};
})(globalThis);
