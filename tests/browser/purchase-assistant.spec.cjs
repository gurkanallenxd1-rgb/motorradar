const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const sources=require('../../data/cost-sources.json');
async function seed(page){
 await page.route('**/data/cost-sources.json',r=>r.fulfill({json:sources}));await page.goto('/');
 await page.evaluate(async()=>{
 const xs=Array.from({length:81},(_,i)=>({id:'bike-'+i,title:['R25','MT-25','Duke 250'][i%3]+' '+i,model:['Yamaha R25','Yamaha MT-25','KTM Duke 250'][i%3],year:2024,km:5000+i,price:220000+i*100,verifiedPrice:220000+i*100,priceVerifiedAt:'2026-11-03',status:'following',createdAt:'2026-11-03',history:[],gmail:{sentinel:'gmail'},ocr:{sentinel:'ocr'},custom:'keep',decision:{inspection:{checks:{chassis:'Sorun var'}}}}));
 localStorage.setItem('motorradar-v1',JSON.stringify(xs));localStorage.setItem('motorradar-costs-v37',JSON.stringify({'bike-0':{parts:0,partsApproved:true}}));localStorage.setItem('motorradar-budget','210000');localStorage.setItem('motorradar-drive-sentinel','keep');
 const b=new Blob(['original-photo']);await MotorPhotoStore.set('bike-0',[{image:b,thumb:b}]);
 });await page.reload();await expect(page).toHaveTitle('MotorRadar 3.9 Beta');
}
test('preparation persists, compares three models, exports tasks and preserves 81 records and photos at iPhone widths',async({page})=>{
 await seed(page);const before=await page.evaluate(()=>({listings:localStorage.getItem('motorradar-v1'),costs:localStorage.getItem('motorradar-costs-v37')}));
 const section=page.locator('#cards [data-preparation="bike-0"]');await expect(section).toContainText('0/7 görev tamamlandı');await section.locator('summary').click();
 await expect(section).toContainText('Teklif gerekli');await expect(section).toContainText('Öncelikli kontrol gerekli');await expect(section).toContainText('Doğrulama tarihi: 2026-11-03');
 for(const status of ['Devam ediyor','Sorun var','Tamamlandı']){await section.locator('[data-preparation-task="price"]').selectOption(status);await expect(section.locator('[data-preparation-task="price"]')).toHaveValue(status)}
 await expect(section).toContainText('14%');await expect(section).toContainText('1/7 görev tamamlandı');await page.reload();await section.locator('summary').click();await expect(section.locator('[data-preparation-task="price"]')).toHaveValue('Tamamlandı');
 for(const i of [0,1,2])await page.locator(`[data-choose="bike-${i}"]`).check();await page.locator('#compareBtn').click();
 const dialog=page.locator('#compareDialog');await expect(dialog.locator('[data-preparation]')).toHaveCount(3);await expect(dialog).toContainText('Duke 250');await expect(dialog).toContainText('MT-25');await expect(dialog).toContainText('R25');await expect(dialog).toContainText('Bütçe aşıldı');
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);const prep=dialog.locator('[data-preparation="bike-0"]');await prep.locator('summary').click();await expect(prep.locator('select').first()).toBeVisible();expect(await prep.locator('select').first().evaluate(e=>e.getBoundingClientRect().width<=e.closest('section').getBoundingClientRect().width)).toBe(true);await prep.locator('summary').click();}
 await dialog.locator('.close').click();
 const download=page.waitForEvent('download');await page.locator('#backupBtn').click();const file=await download;const fs=require('node:fs');const backup=JSON.parse(fs.readFileSync(await file.path(),'utf8'));expect(backup.listings).toHaveLength(81);expect(backup.purchasePreparation['bike-0'].price.status).toBe('Tamamlandı');
 expect(await page.evaluate(()=>({listings:localStorage.getItem('motorradar-v1'),costs:localStorage.getItem('motorradar-costs-v37')}))).toEqual(before);
 expect(await page.evaluate(async()=>{const p=await MotorPhotoStore.get('bike-0');return [await p[0].image.text(),await p[0].thumb.text()]})).toEqual(['original-photo','original-photo']);
});
test('quota and stale tab task writes are visible failures, preserving previous values',async({page})=>{
 await seed(page);const section=page.locator('#cards [data-preparation="bike-0"]');await section.locator('summary').click();
 await page.evaluate(()=>localStorage.setItem(MotorPurchaseAssistant.KEY,JSON.stringify({'bike-1':{price:{status:'Devam ediyor',updatedAt:new Date().toISOString()}}})));
 const alerts=[];page.on('dialog',async d=>{alerts.push(d.message());await d.accept()});await section.locator('[data-preparation-task="price"]').selectOption('Tamamlandı');expect(alerts.at(-1)).toContain('başka sekmede');
 await section.locator('summary').click();await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===MotorPurchaseAssistant.KEY)throw Error('quota');return set.call(this,k,v)}});
 await section.locator('[data-preparation-task="price"]').selectOption('Tamamlandı');expect(alerts.at(-1)).toContain('kaydedilemedi');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(MotorPurchaseAssistant.KEY))['bike-0'])).toBeUndefined();
});
test('restore requires backup and consent, merges tasks, and legacy backups preserve preparation',async({page})=>{
 await seed(page);const section=page.locator('#cards [data-preparation="bike-0"]');await section.locator('summary').click();await section.locator('[data-preparation-task="price"]').selectOption('Devam ediyor');
 const snapshot=await page.evaluate(()=>MotorBackup.snapshot(JSON.parse(localStorage.getItem('motorradar-v1')),localStorage));
 snapshot.listings=[];snapshot.purchasePreparation={'bike-0':{insurance:{status:'Sorun var',updatedAt:'2026-11-03T12:00:00Z'}}};
 const upload=async d=>page.locator('#importFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});
 await upload(snapshot);await expect(page.locator('#backupPreview')).toContainText('1 satın alma görev durumu');await expect(page.locator('#applyBackup')).toBeDisabled();
 await page.locator('#backupConsent').check();await expect(page.locator('#applyBackup')).toBeDisabled();let download=page.waitForEvent('download');await page.locator('#beforeImportBackup').click();await download;await expect(page.locator('#applyBackup')).toBeEnabled();
 page.on('dialog',d=>d.accept());await page.locator('#applyBackup').click();await section.locator('summary').click();await expect(section.locator('[data-preparation-task="price"]')).toHaveValue('Devam ediyor');await expect(section.locator('[data-preparation-task="insurance"]')).toHaveValue('Sorun var');
 const tasks=await page.evaluate(()=>localStorage.getItem(MotorPurchaseAssistant.KEY));await upload({app:'MotorRadar',version:'2.5',listings:[]});download=page.waitForEvent('download');await page.locator('#beforeImportBackup').click();await download;await page.locator('#backupConsent').check();await page.locator('#applyBackup').click();
 expect(await page.evaluate(()=>localStorage.getItem(MotorPurchaseAssistant.KEY))).toBe(tasks);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')).length)).toBe(81);
});
