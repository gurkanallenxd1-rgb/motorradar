const {test,expect}=require('@playwright/test');
async function image(page,lines){const b64=await page.evaluate(lines=>{const c=document.createElement('canvas');c.width=1000;c.height=lines.length*65+80;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.fillStyle='black';x.font='32px Arial';lines.forEach((s,i)=>x.fillText(s,40,60+i*65));return c.toDataURL('image/png').split(',')[1]},lines);return {name:'screenshot.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')};}
const records=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')||'[]'));
test('real on-device OCR: multiple images, Turkish fields, editable form, confirmation, offline and no upload',async({page,context})=>{
 test.setTimeout(120000);const outside=[],uploads=[],errors=[];
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000')&&!r.url().startsWith('blob:'))outside.push(r.url());if(r.method()!=='GET')uploads.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 let approve=false;page.on('dialog',d=>approve?d.accept():d.dismiss());
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 const top=await image(page,['İlan başlığı: Temiz Yamaha','Marka: Yamaha','Model: MT-25']);
 const details=await image(page,['Model Yılı: 2023','Fiyat: 245.000,50 TL','Kilometre: 16.000 km','Şehir: İstanbul']);
 await page.locator('#addBtn').click();await page.locator('#screenshots').setInputFiles([top,details]);await page.locator('#readScreenshots').click();
 await expect(page.locator('#ocrStatus')).toContainText('Henüz kaydedilmedi',{timeout:90000});
 for(const [id,value] of Object.entries({fBrand:'Yamaha',fModel:'MT-25',fYear:'2023',fPrice:'245000.5',fKm:'16000',fCity:'İstanbul',fTitle:'Temiz Yamaha'}))await expect(page.locator('#'+id)).toHaveValue(value);
 expect(await records(page)).toEqual([]);await page.locator('#fPrice').fill('240000.50');
 await page.locator('#listingForm button[type=submit]').click();expect(await records(page)).toEqual([]);await expect(page.locator('#editDialog')).toBeVisible();
 approve=true;await page.locator('#listingForm button[type=submit]').click();expect((await records(page))[0]).toMatchObject({brand:'Yamaha',model:'MT-25',price:240000.5,km:16000,year:2023});
 await page.reload();await expect(page.locator('#countStat')).toHaveText('1');
 // Installed shell, engine and Turkish model work with the network disconnected.
 await context.setOffline(true);await page.reload();await page.locator('#addBtn').click();await page.locator('#screenshots').setInputFiles(details);await page.locator('#readScreenshots').click();
 await expect(page.locator('#ocrStatus')).toContainText('Henüz kaydedilmedi',{timeout:90000});await expect(page.locator('#fPrice')).toHaveValue('245000.5');await expect(page.locator('#fTitle')).toHaveValue('');
 expect(outside).toEqual([]);expect(uploads).toEqual([]);expect(errors).toEqual([]);
});
test('bad files, unsupported formats, limits, blank OCR, cancellation and manual fallback',async({page})=>{
 page.on('dialog',d=>d.accept());await page.goto('/');await page.locator('#addBtn').click();await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('1–6');
 await page.locator('#screenshots').setInputFiles({name:'a.heic',mimeType:'image/heic',buffer:Buffer.from('bad')});await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('HEIC');
 await page.locator('#screenshots').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('bad')});await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('Görsel okunamadı',{timeout:60000});
 const blank=await image(page,[' ']);await page.locator('#screenshots').setInputFiles(blank);await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('Güvenilir bilgi okunamadı',{timeout:60000});
 for(const id of ['fTitle','fPrice','fYear','fKm','fBrand','fModel','fCity'])await expect(page.locator('#'+id)).toHaveValue('');
 await page.locator('#screenshots').setInputFiles(Array(7).fill(blank));await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('1–6');
 await page.locator('#screenshots').setInputFiles({name:'big.png',mimeType:'image/png',buffer:Buffer.alloc(12*1024*1024+1)});await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('12 MB');
 // Hold initialization to exercise cancellation and guard against a stale result.
 await page.evaluate(()=>{window.Tesseract.createWorker=()=>new Promise(()=>{})});await page.locator('#screenshots').setInputFiles(blank);await page.locator('#readScreenshots').click();await page.locator('#cancelOCR').click();await expect(page.locator('#ocrStatus')).toContainText('iptal');
 await page.locator('#fTitle').fill('Manuel kayıt');await page.locator('#listingForm button[type=submit]').click();expect((await records(page))[0]).toMatchObject({title:'Manuel kayıt',price:null,km:null,year:null});
});
test('conflicts stay blank, edits made during OCR survive, closing cancels, engine error recovers',async({page})=>{
 page.on('dialog',d=>d.accept());await page.goto('/');await page.locator('#addBtn').click();const png=await image(page,['Fiyat: 200.000 TL']);
 await page.locator('#screenshots').setInputFiles(png);
 await page.evaluate(()=>{window.ScreenshotOCR.start=()=>({cancel(){},promise:new Promise(resolve=>window.finishOCR=resolve)})});
 await page.locator('#readScreenshots').click();await page.locator('#fTitle').fill('Kendi başlığım');
 await page.evaluate(()=>window.finishOCR({values:{title:'OCR başlığı',brand:'Yamaha'},ambiguous:['price','year']}));
 await expect(page.locator('#fTitle')).toHaveValue('Kendi başlığım');await expect(page.locator('#fPrice')).toHaveValue('');await expect(page.locator('#ocrStatus')).toContainText('Çelişen');
 await page.locator('#screenshots').setInputFiles(png);await page.locator('#readScreenshots').click();await page.locator('[data-close="editDialog"]').first().click();await page.locator('#addBtn').click();
 await page.evaluate(()=>window.finishOCR({values:{price:100000},ambiguous:[]}));await expect(page.locator('#fPrice')).toHaveValue('');
 await page.evaluate(()=>{window.ScreenshotOCR.start=()=>({cancel(){},promise:Promise.reject(Error('OCR başlatılamadı'))})});await page.locator('#screenshots').setInputFiles(png);await page.locator('#readScreenshots').click();await expect(page.locator('#ocrStatus')).toContainText('elle');await expect(page.locator('#listingForm button[type=submit]')).toBeEnabled();
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.locator('#editDialog').evaluate(d=>d.scrollWidth<=d.clientWidth)).toBe(true);}
});
