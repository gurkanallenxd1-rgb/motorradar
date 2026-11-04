const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',screenshot:'only-on-failure',trace:'retain-on-failure'});
async function seed(page){
 await page.goto('/');await page.evaluate(()=>{
 const xs=Array.from({length:81},(_,i)=>({id:'ui-'+i,title:['Yamaha R25','Yamaha MT-25','KTM Duke 250'][i%3],model:['Yamaha R25','Yamaha MT-25','KTM Duke 250'][i%3],year:2024,km:5400+i,price:225000+i*1000,verifiedPrice:225000+i*1000,priceVerifiedAt:'2026-11-03',status:'following',notes:'İlan notu korunur',createdAt:'2026-11-03',history:[],decision:{inspection:{checks:{chassis:'Sorun var'},notes:'Ekspertiz notu'}}}));localStorage.setItem('motorradar-v1',JSON.stringify(xs));localStorage.setItem('motorradar-costs-v37',JSON.stringify({'ui-0':{service:500,serviceApproved:true}}));localStorage.setItem('motorradar-preparation-v39',JSON.stringify({'ui-0':{price:{status:'Tamamlandı',updatedAt:'2026-11-03'}}}));
 });await page.reload();await expect(page).toHaveTitle('MotorRadar 4.0 Beta');
}
for(const width of [320,375,390])test(`product cards, six tabs and status rows fit ${width}px without changing data`,async({page})=>{
 await page.setViewportSize({width,height:844});await seed(page);const before=await page.evaluate(()=>JSON.stringify(localStorage));
 const card=page.locator('.listing').first();await expect(card.locator('.price')).toContainText('225.000');await expect(card).toContainText('Fiyat doğrulandı');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 await card.locator('[data-research-open]').click();const dialog=page.locator('#researchDialog');
 for(const name of ['Özet','Masraflar','Ekspertiz','Teklifler','Notlar','Durum']){
 await test.step(`${width}px · ${name}`,async()=>{await dialog.getByRole('tab',{name,exact:true}).click();await expect(dialog.getByRole('tab',{name,exact:true})).toHaveAttribute('aria-selected','true');expect(await dialog.locator('.dialog-content').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1)});
 }
 await dialog.locator('[data-preparation-details] > summary').click();await expect(dialog.locator('.preparation-task')).toHaveCount(7);await dialog.locator('.task-edit').first().locator('summary').click();await expect(dialog.locator('[data-preparation-task="price"]')).toHaveValue('Tamamlandı');await dialog.locator('.close').click();
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
 await page.screenshot({path:`work/product-${width}.png`,fullPage:false});
});
test('three comparison cards keep disclosures and status changes persist independently',async({page})=>{
 await seed(page);const before=await page.evaluate(()=>localStorage.getItem('motorradar-v1'));for(const i of [0,1,2])await page.locator(`[data-choose="ui-${i}"]`).check();await page.locator('#compareBtn').click();
 const dialog=page.locator('#compareDialog');await expect(dialog.locator('.decision-card')).toHaveCount(3);
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1)}
 const prep=dialog.locator('[data-preparation="ui-0"]');await prep.locator('[data-preparation-details] > summary').click();await prep.locator('.task-edit').first().locator('summary').click();await prep.locator('[data-preparation-task="price"]').selectOption('Devam ediyor');await expect(prep.locator('.task-badge').first()).toHaveText('Devam ediyor');expect(await page.evaluate(()=>localStorage.getItem('motorradar-v1'))).toBe(before);
 await dialog.locator('.close').click();await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-preparation-v39'))['ui-0'].price.status)).toBe('Devam ediyor');
});
