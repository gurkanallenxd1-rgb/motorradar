const {test,expect}=require('@playwright/test');
const NAME='MotorRadar-Gmail-Guvenli-v2.json';
const old={id:'legacy',title:'Kendi MT-25 ilanım',model:'Yamaha MT-25',brand:'Yamaha',
 year:2023,price:250000,km:15000,url:'https://www.sahibinden.com/ilan/yamaha-mt25-1339016365/detay',
 history:[{price:250000,at:'2026-09-01'}],createdAt:'2026-09-01',lastCheckedAt:'2026-10-01',
 favorite:true,status:'sold',notes:'Özel not',description:'Açıklama',custom:'koru'};
const event=url=>({kind:'price_drop',url,oldPrice:243000,newPrice:242000,price:242000,
 observedAt:'2026-10-06T10:00:00Z',title:'MT-25',brand:'Yamaha',model:'Yamaha MT-25',year:null,km:null});
const data={app:'MotorRadar-Gmail',version:2,events:[event(old.url),
 event('https://www.sahibinden.com/ilan/yamaha-mt25-123456789/detay')]};
async function setup(page){
 const calls=[],logs=[];
 page.on('console',m=>logs.push(m.text()));
 await page.route('**/drive-config.js',r=>r.fulfill({contentType:'text/javascript',body:`
 window.MotorDriveConfig={clientId:'test.apps.googleusercontent.com',projectNumber:'123',apiKey:'test-public-key'};
 window.testDrive={mode:'ok',pickName:'${NAME}',pickId:'file_123',revoked:0,requests:0};
 const oauth2={hasGrantedAllScopes:()=>true,revoke:(token,cb)=>{testDrive.revoked++;cb({})},
 initTokenClient:options=>{testDrive.options=options;return {requestAccessToken:()=>{
 testDrive.gesture=navigator.userActivation.isActive;
 if(testDrive.mode==='closed'){options.error_callback({type:'popup_closed'});return}
 if(testDrive.mode==='denied'){options.callback({error:'access_denied'});return}
 const response={access_token:'FAKE_MEMORY_ONLY_TOKEN',expires_in:3600};
 if(testDrive.mode==='delayed')testDrive.late=()=>options.callback(response);else options.callback(response);
 }}}};
 class DocsView{setIncludeFolders(){return this}setOwnedByMe(v){testDrive.owned=v;return this}setQuery(){return this}}
 class PickerBuilder{addView(){return this}setOAuthToken(){return this}setDeveloperKey(){return this}
 setAppId(){return this}setOrigin(){return this}setTitle(){return this}
 setCallback(cb){this.cb=cb;return this}build(){const cb=this.cb;return {dispose(){},setVisible(){
 if(testDrive.mode==='cancel')return;
 cb({action:'picked',docs:[{id:testDrive.pickId,name:testDrive.pickName}]});}}}}
 window.google={accounts:{oauth2},picker:{DocsView,PickerBuilder,ViewId:{DOCS:'docs'},Action:{PICKED:'picked'}}};
 window.gapi={load:(name,options)=>options.callback()};
 `}));
 await page.route('https://www.googleapis.com/drive/v3/files/**',async r=>{
   const req=r.request();calls.push({url:req.url(),headers:await req.allHeaders(),method:req.method()});
   const mode=await page.evaluate(()=>testDrive.mode);
   if(mode==='network'){await r.abort();return}
   if(mode==='401'||mode==='403'){await r.fulfill({status:Number(mode),body:'error'});return}
   if(mode==='timeout'){await new Promise(resolve=>setTimeout(resolve,1000));await r.abort().catch(()=>{});return}
   const body=req.url().includes('alt=media')?(mode==='invalid'?'{broken':JSON.stringify(data)):
     JSON.stringify({id:'file_123',name:mode==='wrongName'?'other.json':NAME,size:mode==='large'?6000000:2000,
       ownedByMe:mode!=='foreign',trashed:false});
   await r.fulfill({contentType:'application/json',body});
 });
 await page.goto('/');
 await page.evaluate(x=>localStorage.setItem('motorradar-v1',JSON.stringify([x])),old);
 await page.reload();
 return {calls,logs};
}
async function connect(page){
 await page.locator('#driveConnect').click();
 await expect(page.locator('#driveStatus')).toContainText('Google hazır');
 await page.locator('#driveConnect').click();
}
async function choose(page){await connect(page);await page.locator('#drivePick').click()}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
const mode=(page,value)=>page.evaluate(v=>testDrive.mode=v,value);

test('Drive: preview, preservation, deduplication, memory-only token and disconnect',async({page})=>{
 page.on('dialog',d=>d.accept());
 const {calls,logs}=await setup(page);
 await page.locator('#search').fill('Kendi');
 await choose(page);
 expect(await page.evaluate(()=>testDrive.gesture)).toBe(true);
 expect(await page.evaluate(()=>testDrive.options.scope)).toBe('https://www.googleapis.com/auth/drive.file');
 expect(await page.evaluate(()=>testDrive.options.include_granted_scopes)).toBe(false);
 expect(await page.evaluate(()=>testDrive.owned)).toBe(true);
 await page.locator('#driveSync').click();
 await expect(page.locator('#gmailPreview')).toContainText('1 yeni ilan');
 expect(await saved(page)).toEqual([old]);
 await page.locator('#gmailApply').click();
 await expect(page.locator('#driveLastSync')).not.toHaveText('Henüz eşitlenmedi');
 const records=await saved(page),existing=records.find(x=>x.id==='legacy');
 const {gmailEvents,...preserved}=existing;expect(preserved).toEqual(old);expect(gmailEvents).toHaveLength(1);
 expect(records.find(x=>x.id!=='legacy')).toMatchObject({price:null,status:'unknown',history:[]});
 await expect(page.locator('#search')).toHaveValue('Kendi');
 await page.locator('#driveSync').click();await expect(page.locator('#gmailDialog')).toBeVisible();
 await page.locator('#gmailApply').click();
 expect(await saved(page)).toEqual(records);
 for(const call of calls){expect(call.url).toMatch(/^https:\/\/www.googleapis.com\/drive\/v3\/files\/file_123\?/);
   expect(call.url).not.toContain('TOKEN');expect(call.headers.authorization).toBe('Bearer FAKE_MEMORY_ONLY_TOKEN');expect(call.method).toBe('GET')}
 const storage=await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}));
 expect(storage).not.toContain('TOKEN');expect(storage).not.toContain('file_123');expect(logs.join(' ')).not.toContain('TOKEN');
 expect(page.url()).not.toContain('TOKEN');
 await page.locator('#driveDisconnect').click();expect(await saved(page)).toEqual(records);
 expect(await page.evaluate(()=>testDrive.revoked)).toBe(1);await expect(page.locator('#driveSync')).toBeDisabled();
 await page.reload();await expect(page.locator('#drivePick')).toBeDisabled();
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
});

for(const failure of ['network','401','403','invalid','large','wrongName','foreign']){
 test('Drive failure preserves local data: '+failure,async({page})=>{
   await setup(page);await choose(page);await mode(page,failure);await page.locator('#driveSync').click();
   await expect(page.locator('#driveStatus')).toContainText(failure==='401'||failure==='403'?'Drive izni':'okunamadı');
   expect(await saved(page)).toEqual([old]);
   await expect(page.locator('#gmailApply')).toBeDisabled();
   await page.locator('#gmailImportBtn').click();
   await page.locator('#gmailFile').setInputFiles({name:NAME,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
   await expect(page.locator('#gmailPreview')).toContainText('1 yeni ilan');
 });
}
test('Drive: denied, closed, stale OAuth callback, wrong selection and Picker cancel',async({page})=>{
 const {calls}=await setup(page);
 await mode(page,'denied');await connect(page);await expect(page.locator('#driveStatus')).toContainText('İzin alınamadı');
 await mode(page,'closed');await connect(page);await expect(page.locator('#driveStatus')).toContainText('kapatıldı');
 // The popup error allows retry with the prepared client.
 await mode(page,'delayed');await page.locator('#driveConnect').click();
 await page.locator('#driveDisconnect').click();await page.evaluate(()=>testDrive.late());
 await expect(page.locator('#drivePick')).toBeDisabled();
 await mode(page,'ok');await connect(page);
 await page.evaluate(()=>testDrive.pickName='other.json');await page.locator('#drivePick').click();
 await expect(page.locator('#driveSync')).toBeDisabled();
 await mode(page,'cancel');await page.locator('#drivePick').click();
 expect(calls).toEqual([]);expect(await saved(page)).toEqual([old]);
});
test('Drive: storage failure, cancelled preview and last sync',async({page})=>{
 page.on('dialog',d=>d.accept());await setup(page);await choose(page);await page.locator('#driveSync').click();
 await expect(page.locator('#gmailDialog')).toBeVisible();await page.locator('[data-close="gmailDialog"]').click();
 expect(await saved(page)).toEqual([old]);await expect(page.locator('#gmailApply')).toBeDisabled();
 await page.locator('#driveSync').click();await expect(page.locator('#gmailDialog')).toBeVisible();
 await page.evaluate(()=>Storage.prototype.setItem=function(){throw Error('quota')});
 await page.locator('#gmailApply').click();expect(await saved(page)).toEqual([old]);
 await expect(page.locator('#driveLastSync')).toHaveText('Henüz eşitlenmedi');
});
test('Drive: timeout and disconnect cancel pending reads without importing',async({page})=>{
 await page.clock.install();const {calls}=await setup(page);await choose(page);await mode(page,'timeout');
 await page.locator('#driveSync').click();await expect.poll(()=>calls.length).toBe(1);
 await page.clock.fastForward(20001);await expect(page.locator('#driveStatus')).toContainText('okunamadı');
 expect(await saved(page)).toEqual([old]);
 await page.locator('#driveSync').click();await expect.poll(()=>calls.length).toBe(2);
 await page.locator('#driveDisconnect').click();
 await expect(page.locator('#driveStatus')).toContainText('Bağlantı kesildi');
 await expect(page.locator('#gmailApply')).toBeDisabled();expect(await saved(page)).toEqual([old]);
});
test('Drive: optional polling, hidden page, pending preview and token expiration',async({page})=>{
 await page.clock.install();const {calls}=await setup(page);await choose(page);
 await page.clock.fastForward(300001);expect(calls).toHaveLength(0);
 await page.locator('#drivePeriodic').check();
 await page.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'}));
 await page.clock.fastForward(300001);expect(calls).toHaveLength(0);
 await page.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'}));
 await page.clock.fastForward(300001);await expect(page.locator('#gmailDialog')).toBeVisible();expect(calls).toHaveLength(2);
 await page.clock.fastForward(300001);expect(calls).toHaveLength(2);
 await page.clock.fastForward(3600000);await expect(page.locator('#drivePick')).toBeDisabled();
 await expect(page.locator('#gmailApply')).toBeDisabled();expect(await saved(page)).toEqual([old]);
});
test('Drive: missing Cloud configuration keeps manual importer available without Google requests',async({page})=>{
 const outside=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000'))outside.push(r.url())});
 await page.goto('/');await page.locator('#driveConnect').click();
 await expect(page.locator('#driveStatus')).toContainText('ayarları eksik');
 await page.locator('#gmailImportBtn').click();
 await page.locator('#gmailFile').setInputFiles({name:NAME,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.locator('#gmailPreview')).toContainText('2 yeni ilan');expect(outside).toEqual([]);
});
test('Drive polling and expiration preserve an open manual JSON preview',async({page})=>{
 await page.clock.install();const {calls}=await setup(page);await choose(page);
 await page.locator('#drivePeriodic').check();await page.locator('#gmailImportBtn').click();
 await page.locator('#gmailFile').setInputFiles({name:NAME,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.locator('#gmailPreview')).toContainText('1 yeni ilan');
 await page.clock.fastForward(300001);expect(calls).toHaveLength(0);
 await page.clock.fastForward(3600000);await expect(page.locator('#drivePick')).toBeDisabled();
 await expect(page.locator('#gmailApply')).toBeEnabled();expect(await saved(page)).toEqual([old]);
});
