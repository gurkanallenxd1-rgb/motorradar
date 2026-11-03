const {test,expect}=require('@playwright/test');
const record=(id,patch={})=>({id:String(id),title:'Kullanıcı başlığı '+id,model:'Yamaha R25',year:2023,price:240000,km:10000,url:'https://www.sahibinden.com/ilan/yamaha-r25-'+(1234567890+id)+'/detay',notes:'Sakla',history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',favorite:true,status:'unknown',lastCheckedAt:null,gmailEvents:[{kind:'new_listing',price:250000,observedAt:'2026-01-01'}],custom:{nested:['koru']},...patch});
async function seed(page,xs){await page.goto('/');await page.locator('#advancedFilters > summary').click();await page.locator('#bulkPanel > summary').click();await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),xs);await page.reload();await page.locator('#advancedFilters > summary').click();await page.locator('#bulkPanel > summary').click()}
const data=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
test('bulk confirmation, hidden selection, comparison, persistence and data safety',async({page})=>{
 const errors=[],outside=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000'))outside.push(r.url())});
 const xs=Array.from({length:40},(_,i)=>record(i));await seed(page,xs);
 await page.locator('[data-choose="0"]').check();await page.locator('[data-choose="1"]').check();await page.locator('[data-choose="2"]').check();
 await page.locator('#search').fill('başlığı 3');await expect(page.locator('.listing')).toHaveCount(11);await page.locator('#selectVisible').click();
 await page.locator('#search').fill('başlığı 0');await page.locator('#selectVisible').click();await expect(page.locator('#bulkCount')).toHaveText('12');await expect(page.locator('#selectedCount')).toHaveText('3');
 await page.locator('#bulkStatus').selectOption('sold');page.once('dialog',async d=>{expect(d.message()).toContain('12 ilanın');await d.dismiss()});await page.locator('#applyBulk').click();expect(await data(page)).toEqual(xs);
 page.once('dialog',d=>d.accept());await page.locator('#applyBulk').click();await expect(page.locator('#bulkCount')).toHaveText('0');await expect(page.locator('#selectedCount')).toHaveText('3');
 const saved=await data(page);expect(saved).toEqual(xs.map(x=>({...x,status:x.id==='0'||String(x.id).startsWith('3')?'sold':'unknown'})));
 await page.reload();await page.locator('#advancedFilters > summary').click();await page.locator('#bulkPanel > summary').click();expect(await data(page)).toEqual(saved);await expect(page.locator('#closedStat')).toHaveText('12');expect(errors).toEqual([]);expect(outside).toEqual([]);
});
test('storage failure rolls back all selected records and allows retry',async({page})=>{
 const xs=[record(0),record(1)];await seed(page,xs);await page.locator('#selectVisible').click();await page.locator('#bulkStatus').selectOption('removed');
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('quota')}});
 page.on('dialog',d=>d.accept());await page.locator('#applyBulk').click();expect(await data(page)).toEqual(xs);await expect(page.locator('#bulkCount')).toHaveText('2');await expect(page.locator('#unknownStat')).toHaveText('2');
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);await page.locator('#applyBulk').click();expect(await data(page)).toEqual(xs.map(x=>({...x,status:'removed'})));
});
test('advanced filters, historical dashboard and empty states at 320, 375, 390px',async({page})=>{
 const xs=[record(0,{model:'',year:null,km:null,price:null,history:[]}),record(1,{status:'sold',lastCheckedAt:'2026-01-02',gmailEvents:[]}),record(2,{status:'removed',gmailEvents:[]}),record(3,{status:'gave_up',km:0,gmailEvents:[]})];await seed(page,xs);
 await expect(page.locator('#gmailBudgetStat')).toHaveText('1');await expect(page.locator('#pricedStat')).toHaveText('3');
 for(const id of ['unknownPriceOnly','unknownYearOnly','unknownKmOnly','unknownModelOnly']){await page.locator('#'+id).check();await expect(page.locator('.listing')).toHaveCount(1)}
 await page.locator('#minKm').fill('0');await expect(page.locator('.listing')).toHaveCount(0);await expect(page.locator('#cards')).toContainText('Eşleşen ilan bulunamadı');
 await page.locator('#resetFilters').click();await page.locator('#uncheckedOnly').check();await expect(page.locator('.listing')).toHaveCount(2);await page.locator('#hideClosed').check();await expect(page.locator('.listing')).toHaveCount(2);
 await page.locator('#sourceFilter').selectOption('gmail');await expect(page.locator('.listing')).toHaveCount(1);await page.locator('#sourceFilter').selectOption('manual');await expect(page.locator('.listing')).toHaveCount(1);
 await page.locator('#resetFilters').click();await page.locator('#selectVisible').click();
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});await page.locator('#applyBulk').scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const box=await page.locator('#applyBulk').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);}
 await page.locator('#clearBulk').click();await expect(page.locator('#applyBulk')).toBeDisabled();
 await seed(page,[]);await expect(page.locator('#cards')).toContainText('Henüz ilan eklenmedi');await expect(page.locator('#selectVisible')).toBeDisabled();
});
