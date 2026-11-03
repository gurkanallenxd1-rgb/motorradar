const {test,expect}=require('@playwright/test');
const rec=(id,patch={})=>({id,title:'Motor '+id,model:'Yamaha MT-25',price:240000,verifiedPrice:240000,priceVerifiedAt:'2026-01-01',year:2024,km:10000,status:'following',favorite:false,lastCheckedAt:null,history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',url:'',custom:'koru',...patch});
async function seed(page){await page.goto('/');await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),[rec('a'),rec('b'),rec('legacy',{priceVerifiedAt:null,year:null})]);await page.reload()}
test('weights warn, persist and update comparison; ties and legacy stay explicit',async({page})=>{
 await seed(page);await expect(page.locator('#smartSelector')).toContainText('Eşit puan');await page.locator('[data-panel-key="scoring"] > summary').click();
 await page.locator('#weight-price').fill('70');await expect(page.locator('#weightWarning')).toContainText('Geçersiz toplam');await expect(page.locator('#smartSelector')).toContainText('Puanlı aday yok');
 await page.locator('#weight-km').fill('10');await expect(page.locator('#weightWarning')).toHaveText('Toplam %100');
 await page.reload();await expect(page.locator('#weight-price')).toHaveValue('70');
 await page.locator('[data-choose="a"]').check();await page.locator('[data-choose="b"]').check();await page.locator('#compareBtn').click();await expect(page.locator('#compareContent')).toContainText('Fiyat 35.0 + km 5.0 + yıl 10.0');await page.locator('[data-close="compareDialog"]').click();
 await page.locator('#decisionPanel > summary').click();await expect(page.locator('#decisionPanel')).not.toHaveAttribute('open','');await expect(page.locator('#selectorBudget')).toBeHidden();await page.locator('#decisionPanel > summary').click();await expect(page.locator('#selectorBudget')).toBeVisible();
});
test('unified inspection persists without changing old costs or listing metadata',async({page})=>{
 await seed(page);const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
 await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Ekspertiz Kontrolleri'}).click();
 await expect(page.locator('#check-chassis')).toHaveValue('Kontrol edilmedi');await page.locator('#check-chassis').selectOption('Sorun var');await page.locator('#inspectionNotes').fill('Kullanıcı kontrolü');
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.locator('#researchDialog .dialog-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true)}
 await page.locator('#researchDialog .close').click();await page.locator('[data-research-open="b"]').first().click();await page.getByRole('tab',{name:'Ekspertiz Kontrolleri'}).click();await expect(page.locator('#check-chassis')).toHaveValue('Kontrol edilmedi');await page.locator('#researchDialog .close').click();
 await page.reload();await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Ekspertiz Kontrolleri'}).click();await expect(page.locator('#check-chassis')).toHaveValue('Sorun var');await expect(page.locator('#inspectionNotes')).toHaveValue('Kullanıcı kontrolü');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));for(let i=0;i<after.length;i++){const {decision,...rest}=after[i];expect(rest).toEqual(before[i])}
 await page.locator('#researchDialog .close').click();await page.locator('[data-research-open="legacy"]').first().click();await expect(page.locator('#researchResult')).toContainText('Motor fiyatı eksik');
});
