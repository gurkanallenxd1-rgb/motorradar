/* One main image + up to three gallery images; no remote image URLs. */
(function(root){
 'use strict';
 function mount({onChange}){
  const $=id=>document.getElementById(id),store=root.MotorPhotoStore;
  let draft=[],photos=[],listingId='',generation=0,renderGeneration=0,busy=false,source=null,screenshot=false;
  const urls={cards:[],gallery:[],crop:[]};
  // Cache only small thumbnails in memory. The IndexedDB records remain the source of truth.
  // iOS WebKit can delay lazy blob: image decoding while a modal is open.
  const cardThumbs=new Map();
  function remember(id,images){if(id)cardThumbs.set(id,images[0]?.thumb||null)}
  function release(group){urls[group].forEach(URL.revokeObjectURL);urls[group]=[]}
  function url(blob,group){const value=URL.createObjectURL(blob);urls[group].push(value);return value}
  function status(s){$('photoStatus').textContent=s}
  function lock(value){busy=value;['photoFile','saveCrop','photoAdd'].forEach(id=>$(id).disabled=value);$('photoGallery').querySelectorAll('button').forEach(b=>b.disabled=value)}
  async function save(next){const id=listingId,run=generation;lock(true);
   try{if(id)await store.set(id,next);else draft=next;if(run!==generation)return;photos=next;remember(id,next);draw();onChange();status(id?'Fotoğraflar cihazda kaydedildi.':'Fotoğraflar ilan kaydedilince saklanacak.');return true;}
   catch(e){if(run===generation)status(e.message)}finally{if(run===generation)lock(false)}
  }
  function draw(){release('gallery');$('photoGallery').replaceChildren();photos.forEach((p,index)=>{
   const box=document.createElement('div'),img=document.createElement('img');box.className='photo-tile';img.src=url(p.thumb,'gallery');img.alt=index?'Galeri fotoğrafı':'Ana fotoğraf';img.loading='lazy';box.append(img);
   for(const [label,action] of [
    [index?'Ana fotoğraf yap':'Ana fotoğraf',()=>save([p,...photos.filter((_,i)=>i!==index)])],
    ['Değiştir',()=>{$('photoReplace').value=String(index);$('photoFile').click()}],
    ['Sil',()=>{if(confirm('Bu fotoğraf silinsin mi?'))save(photos.filter((_,i)=>i!==index))}],
    ['İndir',()=>{const a=document.createElement('a');a.href=url(p.image,'gallery');a.download='motorradar-fotograf-'+(index+1)+'.jpg';a.click()}]
   ]){const b=document.createElement('button');b.type='button';b.className='btn small';b.textContent=label;b.disabled=busy||(label==='Ana fotoğraf');b.onclick=action;box.append(b)}
   $('photoGallery').append(box);
  });}
  async function crop(file,isScreenshot=false){const run=generation;source=null;$('photoCrop').hidden=true;release('crop');
   try{await store.decode(file);if(run!==generation)return;source=file;screenshot=isScreenshot;
    $('cropSource').src=url(file,'crop');for(const [key,value] of Object.entries(isScreenshot?{x:10,y:20,w:80,h:40}:{x:0,y:0,w:100,h:100}))$('crop'+key).value=value;
    $('photoCrop').hidden=false;status(isScreenshot?'Ekranın yalnızca motosiklet bölgesini seç. Önizlemeyi kontrol edip kırpmayı onayla.':'Kırpma alanını kontrol et ve eklemeyi onayla.');preview();
   }catch(e){if(run===generation)status(e.message)}
  }
  function bounds(){return Object.fromEntries(['x','y','w','h'].map(k=>[k,Number($('crop'+k).value)]))}
  function preview(){const b=bounds(),overlay=$('cropBounds');overlay.style.left=b.x+'%';overlay.style.top=b.y+'%';overlay.style.width=b.w+'%';overlay.style.height=b.h+'%'}
  ['x','y','w','h'].forEach(k=>$('crop'+k).oninput=preview);
  $('photoFile').onchange=e=>{const f=e.target.files?.[0];if(f)crop(f);e.target.value=''};
  $('photoAdd').onclick=()=>{$('photoReplace').value='';$('photoFile').click()};
  $('saveCrop').onclick=async()=>{if(!source||busy)return;const run=generation,file=source,replace=$('photoReplace').value,b=bounds();
   if(screenshot&&b.w===100&&b.h===100){status('Ekranın tamamını değil, motosiklet bölgesini kırp.');return}
   if(replace===''&&photos.length>=4){status('En fazla 4 fotoğraf saklanabilir. Önce birini sil.');return}
   lock(true);try{const photo=await store.optimize(file,b);if(run!==generation)return;
    const next=photos.slice();if(replace==='')next.push(photo);else next[Number(replace)]=photo;
    const saved=await save(next);if(saved&&run===generation){source=null;$('photoCrop').hidden=true;release('crop')}
   }catch(e){if(run===generation)status(e.message)}finally{if(run===generation)lock(false)}
  };
  async function open(id,file){generation++;const run=generation;listingId=id||'';source=null;photos=[];release('crop');$('photoCrop').hidden=true;$('photoReplace').value='';lock(true);draw();$('photoDialog').showModal();status('Fotoğraflar yükleniyor…');
   try{const loaded=id?await store.get(id):draft;if(run!==generation)return;photos=loaded;remember(id,loaded);draw();lock(false);status('Ana fotoğraf ilk sıradadır. En fazla 4 fotoğraf.');if(file)await crop(file,true)}catch(e){if(run===generation)status(e.message)}
  }
  $('photoDialog').addEventListener('close',()=>{generation++;source=null;release('gallery');release('crop')});
  function paintCard(node,thumb,run){
   if(!thumb||run!==renderGeneration||!node.isConnected)return;
   const img=document.createElement('img');
   img.alt='İlanın kullanıcı tarafından eklenen fotoğrafı';
   // Eager-loading these tiny, locally stored thumbnails avoids a Safari/WebKit
   // lazy blob URL that never starts loading while the photo dialog is open.
   img.loading='eager';img.decoding='async';
   img.src=url(thumb,'cards');
   node.replaceChildren(img);
  }
  async function hydrate(container){const run=++renderGeneration;release('cards');
   const nodes=[...container.querySelectorAll('[data-photo]')];
   // A newly saved photo is visible synchronously, without waiting for 78+
   // IndexedDB reads or a photo dialog to close.
   for(const node of nodes){const id=node.dataset.photo;if(cardThumbs.has(id))paintCard(node,cardThumbs.get(id),run)}
   await Promise.all(nodes.map(async node=>{
    const id=node.dataset.photo;if(cardThumbs.has(id))return;
    try{const images=await store.get(id);if(run!==renderGeneration||!node.isConnected)return;
     remember(id,images);paintCard(node,images[0]?.thumb,run);
    }catch{/* Keep the placeholder and retry on a later render. */}
   }));
  }
  root.addEventListener('pagehide',()=>Object.keys(urls).forEach(release));
  return {open,hydrate,resetDraft(){draft=[]},async commitDraft(id){if(!draft.length)return;const copy=draft;draft=[];try{await store.set(id,copy);remember(id,copy);onChange()}catch{alert('İlan kaydedildi; fotoğraf saklanamadı. Orijinal görseli sakla ve tekrar ekle.')} }};
 }
 root.MotorListingPhotos={mount};
})(window);
