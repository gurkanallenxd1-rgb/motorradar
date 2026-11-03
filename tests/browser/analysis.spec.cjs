const {test,expect}=require('@playwright/test');
const record=(id,overrides={})=>({id,title:id,model:'Yamaha MT-25',year:2023,km:15000,price:200000,url:'',history:[{price:200000,at:'2026-01-01'}],createdAt:'2026-01-01',...overrides});
test('iPhone WebKit: local analysis, provenance, incomplete data, descriptions and offline PWA',async({page,context,browserName})=>{
 const outside=[],errors=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000'))outside.push(r.url())});page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 const records=[record('target',{notes:'Hasar yok. Boyasız, değişen yok, tramer 0. Bakım yapıldı.',description:'<img src=x onerror=alert(1)> Boya var.',extra:'kept'}),record('a',{price:180000}),record('b',{price:220000}),record('c',{price:240000}),record('other',{model:'KTM Duke 250'}),record('incomplete',{price:null,km:null,year:null})];
 await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),records);await page.reload();
 // Filtering does not shrink the analysis universe.
 await page.locator('#search').fill('target');await page.locator('[data-analyze=target]').click();
 const panel=page.locator('#analysisContent');await expect(panel).toContainText('220.000');await expect(panel).toContainText('-20.000');await expect(panel).toContainText('-9.1%');await expect(panel).toContainText('Akıllı sıralama puanı: Hesaplanamadı');await expect(panel).toContainText('Hasar yok.');await expect(panel.locator('img')).toHaveCount(0);
 await panel.locator('summary').click();await expect(panel).toContainText('Model / marka eşleşmiyor');await expect(panel).toContainText('Kayıt: a');
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);}
 await page.locator('[data-close=analysisDialog]').click();await page.locator('#search').fill('incomplete');await page.locator('[data-analyze=incomplete]').click();await expect(panel).toContainText('Yeterli karşılaştırma verisi yok');await expect(panel).toContainText('Hesaplanamadı');await page.locator('[data-close=analysisDialog]').click();
 // Editing description preserves history, v1 key and unknown fields.
 await page.locator('#search').fill('target');await page.locator('[data-detail=target]').click();await page.locator('#detailEdit').click();await expect(page.locator('#fDescription')).toHaveValue(records[0].description);await page.locator('#fDescription').fill('Bakım faturası istendi.');await page.locator('#listingForm button[type=submit]').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));expect(saved[0]).toMatchObject({extra:'kept',description:'Bakım faturası istendi.',history:records[0].history});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 // WebKit Inspector intercepts offline navigation before its service worker.
 await context.addCookies([{name:'motorradar-test-outage',value:'1',url:'http://127.0.0.1:8000'}]);
 expect(await page.evaluate(async()=>(await fetch('/network-probe')).status)).toBe(503);
 if(browserName!=='webkit')await context.setOffline(true);
 await page.reload();await page.locator('[data-analyze=target]').click();await expect(panel).toContainText('Akıllı sıralama puanı: Hesaplanamadı');await expect(panel).toContainText('Bakım faturası istendi.');
 expect(outside).toEqual([]);expect(errors).toEqual([]);
});
