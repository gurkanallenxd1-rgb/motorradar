const {test,expect}=require('@playwright/test');
test('iPhone: Gmail v2 preview and non-destructive import',async({page})=>{
 const errors=[],outside=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000'))outside.push(r.url())});
 await page.goto('/');for(const id of ['advancedFilters']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};
 const old={id:'legacy',title:'Kendi MT-25 ilanım',model:'Yamaha MT-25',brand:'Yamaha',
  year:2023,price:250000,km:15000,url:'https://www.sahibinden.com/ilan/yamaha-mt25-1339016365/detay',
  history:[{price:250000,at:'2026-09-01'}],createdAt:'2026-09-01',
  favorite:true,status:'sold',notes:'Özel ekspertiz notu'};
 await page.evaluate(x=>localStorage.setItem('motorradar-v1',JSON.stringify([x])),old);
 await page.reload();for(const id of ['advancedFilters']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};await page.locator('#hideClosed').uncheck();
 const event=(url,price,at)=>({kind:'price_drop',url,listingId:url.match(/\d{9,}/)[0],
   oldPrice:price+1000,newPrice:price,price,observedAt:at,title:'Acil MT-25',
   brand:'Yamaha',model:'Yamaha MT-25',year:null,km:null});
 const doc={app:'MotorRadar-Gmail',version:2,events:[
   event(old.url,242000,'2026-10-06T10:00:00Z'),
   event('https://www.sahibinden.com/ilan/yamaha-mt25-123456789/detay',220000,'2026-10-07T10:00:00Z')
 ]};
 await page.locator('#gmailImportBtn').click();
 await page.locator('#gmailFile').setInputFiles({name:'MotorRadar-Gmail-Guvenli-v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
 await expect(page.locator('#gmailPreview')).toContainText('1 yeni ilan');
 await expect(page.locator('#gmailPreview')).toContainText('1 mevcut ilana');
 await page.locator('#gmailApply').click();
 const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
 const saved=await data();
 expect(saved).toHaveLength(2);
 const original=saved.find(x=>x.id==='legacy');
 expect(original.price).toBe(250000);
 expect(original.history).toHaveLength(1);
 expect(original.notes).toBe('Özel ekspertiz notu');
 expect(original.status).toBe('sold');
 expect(original.favorite).toBe(true);
 expect(original.gmailEvents).toHaveLength(1);
 const added=saved.find(x=>x.id!=='legacy');
 expect(added.price).toBe(null);
 expect(added.status).toBe('unknown');
 expect(added.gmailEvents[0].newPrice).toBe(220000);
 await expect(page.locator('.listing')).toHaveCount(2);
 await expect(page.getByText('Bildirim fiyatı: 220.000 ₺')).toHaveCount(1);
 await page.locator('#gmailImportBtn').click();
 await page.locator('#gmailFile').setInputFiles({name:'same.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
 await page.locator('#gmailApply').click();
 const twice=await data();
 expect(twice).toHaveLength(2);
 expect(twice.find(x=>x.id==='legacy').gmailEvents).toHaveLength(1);
 for(const width of [320,375,390]){
   await page.setViewportSize({width,height:844});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);
 expect(outside).toEqual([]);
});
