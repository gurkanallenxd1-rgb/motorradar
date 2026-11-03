const {test,expect}=require('@playwright/test');
const row={id:'old',title:'Motorum',brand:'Yamaha',model:'MT-25',year:2023,km:10000,price:240000,status:'following',favorite:true,notes:'Korunacak',lastCheckedAt:null,history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',url:'',gmailEvents:[{kind:'new_listing',price:200000,observedAt:'2026-01-01'}]};
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
async function seed(page){await page.goto('/');await page.evaluate(x=>localStorage.setItem('motorradar-v1',JSON.stringify([x])),row);await page.reload()}
async function image(page){const b64=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2000;c.height=1500;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,2000,1500);x.fillStyle='blue';x.fillRect(200,300,1600,600);return c.toDataURL('image/png').split(',')[1]});return {name:'moto.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')}}
async function addPhoto(page,file){await page.locator('#photoFile').setInputFiles(file);await expect(page.locator('#photoCrop')).toBeVisible();await page.locator('#saveCrop').click();await expect(page.locator('#photoCrop'),await page.locator('#photoStatus').textContent()).toBeHidden()}

test('single and bulk archive, restore follow, no deletion or metadata loss',async({page})=>{
 page.on('dialog',d=>d.accept());await seed(page);
 await page.locator('[data-status]').selectOption('sold');await expect(page.locator('.listing')).toHaveCount(0);expect(await saved(page)).toEqual([{...row,status:'sold'}]);
 await page.locator('#showArchive').check();await expect(page.locator('#hideClosed')).not.toBeChecked();await expect(page.locator('.listing')).toHaveCount(1);
 await page.locator('[data-follow]').click();expect(await saved(page)).toEqual([row]);
 await page.locator('#hideClosed').check();await expect(page.locator('#showArchive')).not.toBeChecked();
 await page.locator('#selectVisible').click();await page.locator('#bulkStatus').selectOption('removed');await page.locator('#applyBulk').click();await expect(page.locator('.listing')).toHaveCount(0);
 await page.locator('#statusFilter').selectOption('removed');await expect(page.locator('.listing')).toHaveCount(1);await expect(page.locator('#showArchive')).toBeChecked();
 await page.locator('#resetFilters').click();await expect(page.locator('.listing')).toHaveCount(0);await page.reload();expect(await saved(page)).toEqual([{...row,status:'removed'}]);
});

test('local optimized photos: gallery, main, replace, download, delete, reload and backup boundaries',async({page})=>{
 const outside=[],errors=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000')&&!r.url().startsWith('blob:'))outside.push(r.url())});page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await seed(page);const file=await image(page);
 await expect(page.locator('[data-photo]')).toHaveText('Fotoğraf yok');await page.locator('[data-photos]').click();
 await addPhoto(page,file);await expect(page.locator('#photoGallery img')).toHaveCount(1);await addPhoto(page,file);await expect(page.locator('#photoGallery img')).toHaveCount(2);
 await page.locator('#photoGallery').getByText('Ana fotoğraf yap',{exact:true}).click();await expect(page.locator('#photoStatus')).toContainText('kaydedildi');
 const sizes=await page.evaluate(async()=>{const photos=await MotorPhotoStore.get('old');const img=await createImageBitmap(photos[0].image);return {count:photos.length,width:img.width,height:img.height,type:photos[0].image.type,size:photos[0].image.size}});
 expect(sizes).toMatchObject({count:2,width:1280,height:960,type:'image/jpeg'});expect(sizes.size).toBeLessThan(500000);
 const download=page.waitForEvent('download');await page.locator('#photoGallery').getByText('İndir',{exact:true}).first().click();expect((await download).suggestedFilename()).toMatch(/jpg$/);
 await page.locator('#photoGallery').getByText('Değiştir',{exact:true}).first().click();await addPhoto(page,file);await expect(page.locator('#photoGallery img')).toHaveCount(2);
 await page.locator('#photoGallery').getByText('Sil',{exact:true}).last().click();await expect(page.locator('#photoGallery img')).toHaveCount(1);
 await page.locator('[data-close=photoDialog]').click();await expect(page.locator('[data-photo] img')).toHaveAttribute('loading','lazy');expect(await saved(page)).toEqual([row]);
 const raw=await page.evaluate(()=>localStorage.getItem('motorradar-v1'));expect(raw).not.toContain('base64');expect(raw).not.toContain('blob:');
 await page.reload();await expect(page.locator('[data-photo] img')).toBeVisible();
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('[data-photos]').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('[data-close=photoDialog]').click()}
 expect(errors).toEqual([]);expect(outside).toEqual([]);
});

test('photo write failure and invalid images preserve existing photos and listing JSON',async({page})=>{
 await seed(page);const file=await image(page);await page.locator('[data-photos]').click();await addPhoto(page,file);
 await page.evaluate(()=>{MotorPhotoStore.set=async()=>{throw Error('Test: fotoğraf kaydedilemedi')}});
 await page.locator('#photoFile').setInputFiles(file);await page.locator('#saveCrop').click();await expect(page.locator('#photoStatus')).toContainText('kaydedilemedi');
 expect(await page.evaluate(async()=>(await MotorPhotoStore.get('old')).length)).toBe(1);expect(await saved(page)).toEqual([row]);
 await page.locator('#photoFile').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('bad')});await expect(page.locator('#photoStatus')).toContainText('okunamadı');
});

test('OCR preview protects existing values, tags screenshot price and stages a cropped draft photo',async({page})=>{
 page.on('dialog',d=>d.accept());await page.goto('/');const file=await image(page);await page.locator('#addBtn').click();await page.locator('#fTitle').fill('Doğruladığım başlık');
 await page.evaluate(()=>ScreenshotOCR.start=()=>({cancel(){},promise:Promise.resolve({values:{title:'OCR başlık',brand:'Yamaha',model:'MT-25',year:2023,price:200000,km:1000,city:'Ankara'},ambiguous:[]})}));
 await page.locator('#screenshots').setInputFiles(file);await page.locator('#readScreenshots').click();await expect(page.locator('#ocrPreview')).toContainText('200000');await expect(page.locator('#fPrice')).toHaveValue('');
 await page.locator('#applyOCR').click();await expect(page.locator('#fTitle')).toHaveValue('Doğruladığım başlık');await expect(page.locator('#fPrice')).toHaveValue('200000');
 await page.locator('#screenshotPhoto').click();await expect(page.locator('#photoCrop')).toBeVisible();
 await page.locator('#cropw').fill('100');await page.locator('#croph').fill('100');await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#saveCrop').click();await expect(page.locator('#photoStatus')).toContainText('tamamını değil');
 for(const [id,v] of Object.entries({cropx:'10',cropy:'20',cropw:'80',croph:'40'}))await page.locator('#'+id).fill(v);
 await page.locator('#saveCrop').click();await expect(page.locator('#photoGallery img')).toHaveCount(1);await page.locator('[data-close=photoDialog]').click();
 await page.locator('#listingForm button[type=submit]').click();await expect(page.locator('.listing')).toContainText('canlı doğrulanmadı');await expect(page.locator('[data-photo] img')).toBeVisible();
 const [x]=await saved(page);expect(x).toMatchObject({price:200000,priceSource:'screenshot',title:'Doğruladığım başlık'});
 const dims=await page.evaluate(async id=>{const p=(await MotorPhotoStore.get(id))[0],img=await createImageBitmap(p.image);return [img.width,img.height]},x.id);expect(dims).toEqual([1280,480]);
});

test('IndexedDB unavailable leaves manual listing and old backups usable',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:undefined}));await seed(page);await page.locator('[data-photos]').click();await expect(page.locator('#photoStatus')).toContainText('kullanılamıyor');expect(await saved(page)).toEqual([row]);await page.locator('[data-close=photoDialog]').click();
 await page.locator('[data-detail]').click();await expect(page.locator('#detailContent')).toContainText('Korunacak');
});
