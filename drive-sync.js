/* Browser-only GIS + Picker. Credentials and selected file live in this closure. */
(function(root){
  'use strict';
  const SCOPE='https://www.googleapis.com/auth/drive.file';
  const NAME='MotorRadar-Gmail-Guvenli-v2.json', LIMIT=5*1024*1024;
  function mount({config,onPreview,onClear}){
    const $=id=>document.getElementById(id);
    let token='',expires=0,fileId='',epoch=0,client=null,picker=null,loading=false,busy=false;
    let controller=null,lastBody='',pendingBody='',expiryTimer=null,lastSync='';
    try{lastSync=localStorage.getItem('motorradar-drive-last-sync')||''}catch{}
    const say=message=>{$('driveStatus').textContent=message};
    function paint(){
      const connected=Boolean(token)&&Date.now()<expires;
      $('driveConnect').disabled=loading;
      $('drivePick').disabled=!connected||busy||loading;
      $('driveSync').disabled=!connected||!fileId||busy||loading;
      $('driveDisconnect').disabled=!token&&!loading;
      $('driveLastSync').textContent=lastSync?new Date(lastSync).toLocaleString('tr-TR'):'Henüz eşitlenmedi';
    }
    function clear(message){
      epoch++;token='';expires=0;fileId='';client=null;loading=false;busy=false;
      clearTimeout(expiryTimer);controller?.abort();controller=null;
      picker?.dispose();picker=null;lastBody='';pendingBody='';
      $('drivePeriodic').checked=false;onClear();say(message);paint();
    }
    function loadScript(src){return new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=src;script.async=true;
      const timer=setTimeout(()=>{script.remove();reject(Error())},20000);
      script.onload=()=>{clearTimeout(timer);resolve()};
      script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error())};
      document.head.append(script);
    })}
    async function prepare(){
      if(!config.clientId||!config.projectNumber||!config.apiKey){say('Google Cloud ayarları eksik. Kurulum yönergesini kullan; manuel JSON aktarımı kullanılabilir.');return}
      if(location.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(location.hostname)){say('Google bağlantısı için HTTPS gerekli.');return}
      const run=epoch;loading=true;paint();say('Google bileşenleri yükleniyor…');
      try{
        await Promise.all([
          root.google?.accounts?.oauth2?Promise.resolve():loadScript('https://accounts.google.com/gsi/client'),
          root.gapi?Promise.resolve():loadScript('https://apis.google.com/js/api.js')
        ]);
        await new Promise((resolve,reject)=>root.gapi.load('picker',{callback:resolve,onerror:reject,timeout:20000,ontimeout:reject}));
        if(run!==epoch)return;
        client=root.google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope:SCOPE,include_granted_scopes:false,
          callback:response=>{
            if(run!==epoch)return;
            loading=false;
            if(response.error||!response.access_token||!root.google.accounts.oauth2.hasGrantedAllScopes(response,SCOPE)||!(Number(response.expires_in)>0)){
              clear('İzin alınamadı. Yeniden bağlanabilir veya manuel JSON aktarabilirsin.');return;
            }
            token=response.access_token;expires=Date.now()+Math.max(0,Number(response.expires_in)*1000-30000);
            expiryTimer=setTimeout(()=>clear('İzin süresi doldu. Yeniden bağlantı kur.'),Math.max(0,expires-Date.now()));
            say('Bağlandı. Kendi Drive hesabındaki JSON dosyasını seç.');paint();
          },error_callback:()=>{if(run===epoch){loading=false;say('Google penceresi açılamadı veya kapatıldı. Safari’de yeniden Bağlantı kur düğmesine dokun.');paint()}}
        });
        say('Google hazır. Bağlantı kur düğmesine tekrar dokun.');
      }catch{if(run===epoch)say('Google bileşenleri yüklenemedi. Ağ bağlantısını kontrol et; manuel JSON aktarımı kullanılabilir.')}
      finally{if(run===epoch){loading=false;paint()}}
    }
    $('driveConnect').onclick=()=>{
      if(!client){prepare();return}
      // Keep the OAuth popup directly inside the Safari user gesture.
      clearTimeout(expiryTimer);controller?.abort();token='';fileId='';lastBody='';pendingBody='';onClear();
      loading=true;paint();say('Google izni bekleniyor…');
      try{client.requestAccessToken({prompt:'select_account'})}catch{loading=false;say('Google penceresi açılamadı. Tekrar dene.');paint()}
    };
    $('drivePick').onclick=()=>{
      if(!token||Date.now()>=expires){clear('İzin süresi doldu. Yeniden bağlantı kur.');return}
      const run=epoch;
      picker?.dispose();
      const view=new root.google.picker.DocsView(root.google.picker.ViewId.DOCS)
        .setIncludeFolders(false).setOwnedByMe(true).setQuery(NAME);
      picker=new root.google.picker.PickerBuilder().addView(view).setOAuthToken(token)
        .setDeveloperKey(config.apiKey).setAppId(config.projectNumber).setOrigin(location.origin)
        .setTitle(NAME+' dosyasını seç').setCallback(data=>{
          if(run!==epoch||!token)return;
          if(data.action!==root.google.picker.Action.PICKED)return;
          const doc=data.docs?.[0];
          if(!doc||doc.name!==NAME||!/^[-\w]+$/.test(doc.id)){say('Yalnızca '+NAME+' dosyasını seç.');return}
          controller?.abort();epoch++;client=null;fileId=doc.id;lastBody='';pendingBody='';busy=false;onClear();
          say('Dosya seçildi. Şimdi eşitle ile önizlemeyi oku.');paint();
        }).build();
      picker.setVisible(true);
    };
    async function get(path,run){
      const response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+path,{
        headers:{Authorization:'Bearer '+token},signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'
      });
      if(run!==epoch)throw Error();
      if(response.status===401||response.status===403){clear('Drive izni geçersiz veya yetersiz. Yeniden bağlantı kur.');throw Error()}
      if(!response.ok)throw Error();
      if(Number(response.headers.get('content-length'))>LIMIT)throw Error();
      const reader=response.body.getReader(),parts=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
        if(size>LIMIT){await reader.cancel();throw Error()}parts.push(value)}
      const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length}
      return new TextDecoder().decode(bytes);
    }
    async function sync(periodic=false){
      if(busy||!fileId||!token)return;
      if(Date.now()>=expires){clear('İzin süresi doldu. Yeniden bağlantı kur.');return}
      if(periodic&&(document.visibilityState!=='visible'||pendingBody||document.querySelector('dialog[open]')))return;
      const run=epoch;busy=true;controller=new AbortController();paint();say('Seçilen JSON dosyası okunuyor…');
      const timeout=setTimeout(()=>controller?.abort(),20000);
      try{
        const meta=JSON.parse(await get('?fields=id,name,size,ownedByMe,trashed',run));
        if(meta.name!==NAME||meta.ownedByMe!==true||meta.trashed||Number(meta.size)>LIMIT)throw Error();
        const body=await get('?alt=media',run);
        if(run!==epoch)return;
        const imported=root.MotorGmailImport.read(body);
        if(periodic&&body===lastBody){say('Kontrol edildi; dosya değişmedi.');return}
        if(periodic&&document.visibilityState!=='visible')return;
        pendingBody=body;onPreview(imported);
        say('Önizleme hazır. Kaydetmek için Kontrol edip aktar düğmesini kullan.');
      }catch{if(run===epoch){pendingBody='';onClear();say('Drive dosyası okunamadı veya geçersiz. Mevcut ilanlar korundu; manuel JSON aktarımı kullanılabilir.')}}
      finally{clearTimeout(timeout);if(run===epoch){busy=false;controller=null;paint()}}
    }
    $('driveSync').onclick=()=>sync();
    $('driveDisconnect').onclick=()=>{
      const previous=token;clear('Bağlantı kesildi. Yerel ilanlar korundu.');
      if(previous)try{root.google.accounts.oauth2.revoke(previous,()=>{})}catch{}
    };
    // No background worker, silent renewal or refresh token. Hidden pages do no work.
    setInterval(()=>{if($('drivePeriodic').checked)sync(true)},5*60*1000);
    root.addEventListener('pagehide',()=>clear('Bağlantı kapatıldı. Yeniden bağlantı kur.'));
    paint();
    return {applied(){if(!pendingBody)return;lastBody=pendingBody;pendingBody='';lastSync=new Date().toISOString();
      try{localStorage.setItem('motorradar-drive-last-sync',lastSync)}catch{}
      say('Önizlemedeki bildirimler kaydedildi.');paint()},discard(){pendingBody=''},cancel(){epoch++;client=null;controller?.abort();controller=null;busy=false;loading=false;pendingBody='';onClear();paint()}};
  }
  root.MotorDriveSync={mount};
})(window);
