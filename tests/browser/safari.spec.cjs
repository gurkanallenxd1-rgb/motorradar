const {test,expect}=require('@playwright/test');
test('iPhone WebKit: paste, suggest, save, reload, duplicates, history, backup and compare',async({page})=>{
 const outside=[],errors=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000'))outside.push(r.url())});page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('motorradar-v1',JSON.stringify([{id:'old',title:'Eski kayıt',model:'Honda',price:250000,km:1000,year:2023,url:'',notes:'Eski not',createdAt:'2026-01-01',history:[{price:250000,at:'2026-01-01'}],extra:'preserved'}])));
 await page.reload();await expect(page.locator('#countStat')).toHaveText('1');
 await page.locator('#quickUrl').fill('https://sahibinden.com.evil.org/ilan/yamaha-mt-25-1234567890/detay');await page.locator('#quickForm button').click();await expect(page.locator('#quickError')).toContainText('Geçerli');
 await page.locator('#quickUrl').fill('https://m.sahibinden.com/ilan/yamaha-mt-25-1234567890/detay?tracking=1');await page.locator('#quickForm button').click();
 await expect(page.locator('#editDialog')).toBeVisible();for(const id of ['fModel','fPrice','fKm'])await expect(page.locator('#'+id)).toHaveValue('');
 await page.locator('#applyModel').click();await expect(page.locator('#fModel')).toHaveValue('Yamaha MT-25');
 for(const [id,value] of Object.entries({fTitle:'Yeni motor',fYear:'2024',fKm:'5000',fPrice:'240000'}))await page.locator('#'+id).fill(value);
 await page.locator('#listingForm button[type=submit]').click();await expect(page.locator('#countStat')).toHaveText('2');await page.reload();await expect(page.locator('#countStat')).toHaveText('2');
 await page.locator('#quickUrl').fill('https://www.sahibinden.com/ilan/changed-title-1234567890/detay#x');await page.locator('#quickForm button').click();await expect(page.locator('#quickError')).toContainText('zaten');
 await page.locator('[data-detail="old"]').click();await page.locator('#detailEdit').click();await page.locator('#fPrice').fill('245000');await page.locator('#listingForm button[type=submit]').click();
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));expect(records.find(x=>x.id==='old')).toMatchObject({extra:'preserved',notes:'Eski not',price:245000});expect(records.find(x=>x.id==='old').history).toHaveLength(2);
 await page.locator('#search').fill('Yeni motor');await expect(page.locator('.listing')).toHaveCount(1);await page.locator('#search').fill('');
 await page.locator('[data-choose]').nth(0).check();await page.locator('[data-choose]').nth(1).check();await page.locator('#compareBtn').click();await expect(page.locator('#compareContent')).toContainText('Yamaha MT-25');await page.locator('[data-close="compareDialog"]').click();
 const download=page.waitForEvent('download');await page.locator('#backupBtn').click();expect((await download).suggestedFilename()).toMatch(/motorradar-yedek/);
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 expect(outside).toEqual([]);expect(errors).toEqual([]);
});
