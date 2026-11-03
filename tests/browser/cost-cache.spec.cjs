const {test,expect}=require('@playwright/test');
test('source HTTP failure retains dated verified snapshot and identifies cached data without writing listings',async({page,context})=>{
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.evaluate(()=>localStorage.setItem('motorradar-v1',JSON.stringify([{id:'cache',title:'Motor cache',model:'Yamaha R25',year:2024,km:1000,price:240000,verifiedPrice:240000,priceVerifiedAt:'2026-01-01',history:[],createdAt:'2026-01-01'}])));
 await context.addCookies([{name:'motorradar-test-outage',value:'1',url:'http://127.0.0.1:8000/'}]);await page.reload();const before=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.locator('[data-research-open="cache"]:visible').click();await expect(page.locator('#researchDialog')).toContainText('son kaydedilmiş kaynak verisi');await expect(page.locator('#researchResult')).toContainText('2026-11-03');await expect(page.locator('#researchResult')).toContainText('1.000');expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});

test('invalid source payload cannot replace the last valid PWA snapshot',async({page,context})=>{
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 const before=await page.evaluate(async()=>{const r=await fetch('/data/cost-sources.json',{cache:'no-cache'});return r.json()});
 await context.addCookies([{name:'motorradar-test-invalid',value:'1',url:'http://127.0.0.1:8000/'}]);
 const after=await page.evaluate(async()=>{const r=await fetch('/data/cost-sources.json',{cache:'no-cache'});return {data:await r.json(),stale:r.headers.get('X-MotorRadar-Source-Cache')}});
 expect(after.data).toEqual(before);expect(after.stale).toBe('stale');
});
