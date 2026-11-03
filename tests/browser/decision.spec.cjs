const {test,expect}=require('@playwright/test');
const rec=(id,patch={})=>({id,title:'Motor '+id,model:'Yamaha MT-25',price:240000,verifiedPrice:240000,priceVerifiedAt:'2026-01-01',year:2024,km:10000,status:'following',favorite:false,lastCheckedAt:null,history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',url:'',custom:'koru',...patch});
async function seed(page){await page.goto('/');await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),[rec('a'),rec('b'),rec('legacy',{priceVerifiedAt:null,year:null})]);await page.reload()}
test('weights warn, persist and update comparison; ties and legacy stay explicit',async({page})=>{
 await seed(page);await expect(page.locator('#smartSelector')).toContainText('Eşit puan');
 await page.locator('#weight-price').fill('70');await expect(page.locator('#weightWarning')).toContainText('Geçersiz toplam');await expect(page.locator('#smartSelector')).toContainText('Puanlı aday yok');
 await page.locator('#weight-km').fill('10');await expect(page.locator('#weightWarning')).toHaveText('Toplam %100');
 await page.reload();await expect(page.locator('#weight-price')).toHaveValue('70');
 await page.locator('[data-choose="a"]').check();await page.locator('[data-choose="b"]').check();await page.locator('#compareBtn').click();await expect(page.locator('#compareContent')).toContainText('Fiyat 35.0 + km 5.0 + yıl 10.0');await page.locator('[data-close="compareDialog"]').click();
 await page.locator('#decisionPanel > summary').click();await expect(page.locator('#selectorBudget')).toBeHidden();await page.locator('#decisionPanel > summary').click();
});
test('per-listing costs calculate live, inspection persists, old data and verification untouched at iPhone widths',async({page})=>{
 await seed(page);const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
 await page.locator('[data-decision="a"]').click();await expect(page.locator('#check-chassis')).toHaveValue('Kontrol edilmedi');await page.locator('#cost-insurance').fill('15000');await expect(page.locator('#costTotal')).toContainText('255.000');await expect(page.locator('#costTotal')).toContainText('Bütçe aşıldı: 5.000');
 await page.locator('#check-chassis').selectOption('Sorun var');await page.locator('#inspectionNotes').fill('Kullanıcı kontrolü');
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('#decisionContent').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true)}
 await page.locator('[data-close="decisionDialog"]').click();await page.locator('[data-decision="b"]').click();await expect(page.locator('#cost-insurance')).toHaveValue('0');await page.locator('[data-close="decisionDialog"]').click();
 await page.reload();await page.locator('[data-decision="a"]').click();await expect(page.locator('#check-chassis')).toHaveValue('Sorun var');await expect(page.locator('#inspectionNotes')).toHaveValue('Kullanıcı kontrolü');await expect(page.locator('#costTotal')).toContainText('255.000');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));for(let i=0;i<after.length;i++){const {decision,...rest}=after[i];expect(rest).toEqual(before[i])}
 await page.locator('[data-close="decisionDialog"]').click();await page.locator('[data-decision="legacy"]').click();await expect(page.locator('#costTotal')).toContainText('Toplam hesaplanamadı');
});
