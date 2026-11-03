const {test,expect}=require('@playwright/test');
const rec=(id,patch={})=>({id,title:'Motor '+id,model:'Yamaha MT-25',price:240000,year:2024,km:10000,status:'following',notes:'koru',favorite:true,history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',url:'',...patch});
async function seed(page,xs){await page.goto('/');await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),xs);await page.reload()}
test('explicit price confirmation, same-price date, budget, changed-price invalidation and persistence',async({page})=>{
 const xs=[rec('a'),rec('b',{model:'KTM Duke 250',price:260000,verifiedPrice:260000,priceVerifiedAt:'2026-01-01'})];await seed(page,xs);
 await expect(page.locator('#smartSelector')).toContainText('Fiyat bilinmiyor / doğrulanmadı (1)');
 await page.locator('[data-price="a"]').click();await expect(page.locator('#quickVerifyPrice')).not.toBeChecked();await page.locator('#quickVerifyPrice').check();await page.locator('#quickPriceForm button[type=submit]').click();
 await expect(page.locator('#smartSelector')).toContainText('Bütçeye uygun (1)');await expect(page.locator('#smartSelector')).toContainText('/100');
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));expect(saved[0].history).toEqual(xs[0].history);expect(saved[0].notes).toBe('koru');expect(saved[0].priceVerifiedAt).toBeTruthy();
 await page.locator('#selectorBudget').fill('270000');await page.locator('#selectorBudget').press('Tab');await expect(page.locator('#smartSelector')).toContainText('Bütçeye uygun (2)');
 await page.reload();await expect(page.locator('#selectorBudget')).toHaveValue('270000');
 await page.locator('[data-price="a"]').click();await page.locator('#quickPrice').fill('230000');await page.locator('#quickPriceForm button[type=submit]').click();await expect(page.locator('#smartSelector')).toContainText('Fiyat bilinmiyor / doğrulanmadı (1)');
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));expect(saved[0].priceVerifiedAt).toBeNull();expect(saved[0].history).toHaveLength(2);
});
test('top five, closed exclusion, missing fields, dated duplicate drops, signed comparison and mobile width',async({page})=>{
 const e={kind:'price_drop',url:'https://www.sahibinden.com/ilan/a-1234567890/detay',oldPrice:270000,newPrice:240000,observedAt:'2026-01-01'};
 await seed(page,[rec('a',{verifiedPrice:240000,priceVerifiedAt:'2026-01-01',gmailEvents:[e,e]}),rec('b',{verifiedPrice:250000,price:250000,priceVerifiedAt:'2026-01-01',year:2023,km:20000}),rec('closed',{status:'sold'}),rec('missing',{km:null})]);
 await expect(page.locator('#smartSelector')).toContainText('Gmail fiyat düşüşleri (1)');await expect(page.locator('#smartSelector')).not.toContainText('Motor closed');
 await page.locator('[data-choose="a"]').check();await page.locator('[data-choose="b"]').check();await page.locator('#compareBtn').click();await expect(page.locator('#compareContent')).toContainText('+10.000 TL');await expect(page.locator('#compareContent')).toContainText('-1 yıl');await page.locator('[data-close="compareDialog"]').click();
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
});
