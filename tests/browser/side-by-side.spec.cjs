const {test,expect}=require('@playwright/test');
const rec=(id,patch={})=>({id,title:'Motor '+id,model:'Yamaha MT-25',price:240000,verifiedPrice:240000,priceVerifiedAt:'2026-01-01',year:2024,km:10000,status:'following',notes:'Notları koru',history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',url:'',...patch});
async function seed(page,xs){await page.goto('/');await page.locator('#decisionPanel > summary').click();await page.evaluate(xs=>{localStorage.setItem('motorradar-v1',JSON.stringify(xs));localStorage.setItem('motorradar-budget','250000');localStorage.setItem('motorradar-gmail-url','https://example.test/gmail');localStorage.setItem('motorradar-drive-sentinel','ayarları koru')},xs);await page.reload();await page.locator('#decisionPanel > summary').click()}
async function geometry(region,count){
 const result=await region.evaluate((e,count)=>{const cards=[...e.querySelectorAll('.decision-card')],r=cards.map(c=>c.getBoundingClientRect());return {count:cards.length,sameRow:Math.abs(r[0].top-r[1].top)<1,overlap:r.some((b,i)=>i&&b.left<r[i-1].right),fits:count===2?r.at(-1).right<=e.getBoundingClientRect().right+1:true,overflow:[...e.querySelectorAll('.decision-card,.decision-card h3,.decision-card dd,.decision-card summary,.decision-detail-body')].filter(n=>n.getClientRects().length).some(n=>n.scrollWidth>n.clientWidth+1),localScroll:e.scrollWidth>e.clientWidth}},count);
 expect(result).toMatchObject({count,sameRow:true,overlap:false,fits:true,overflow:false,localScroll:count===3});
}
for(const count of [2,3])test(`${count} candidates: compact columns, disclosure and scrolling at 320/375/390px`,async({page})=>{
 const xs=[rec('a',{title:'Uzun başlık '+('MT25'.repeat(10)),price:230000,verifiedPrice:230000,km:5000,decision:{costs:{insurance:15000},inspection:{checks:{chassis:'Sorun var'},notes:'Kullanıcı beyanı <script>'}}}),rec('b',{year:2023}),rec('c',{year:2022,km:20000})].slice(0,count);
 await seed(page,xs);const before=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.evaluate(async()=>{const blob=new Blob(['photo-original']);await MotorPhotoStore.set('a',[{image:blob,thumb:blob}])});
 for(const width of [320,375,390]){
  await page.setViewportSize({width,height:844});
  const region=page.locator('#smartSelector .decision-cards');await geometry(region,count);
  const first=region.locator('.decision-card').first();await first.locator('.candidate-detail > summary').click();await expect(first.locator('.decision-detail-body')).toBeVisible();await geometry(region,count);
  await expect(first).toContainText('Fiyat avantajı · 10.000 TL');await expect(first).toContainText('Daha düşük kilometre · 5.000 km');
  await expect(first.locator('.decision-detail-body')).toContainText('Girilmedi');await expect(first.locator('.inspection-note')).toHaveText('Kullanıcı beyanı <script>');
  await first.locator('.candidate-detail > summary').click();
  if(count===3){await region.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>region.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);await region.locator('.decision-card').last().scrollIntoViewIfNeeded();await expect.poll(()=>region.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);await region.evaluate(e=>e.scrollLeft=0)}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));const footer=await page.locator('.footer-bar').boundingBox(),last=await page.locator('.listing').last().boundingBox();expect(last.y+last.height).toBeLessThanOrEqual(footer.y);
 }
 for(const x of xs)await page.locator(`[data-choose="${x.id}"]`).check();await page.locator('#compareBtn').click();
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});await geometry(page.locator('#compareContent .decision-cards'),count)}
 await page.locator('[data-close="compareDialog"]').click();await page.reload();await page.locator('#decisionPanel > summary').click();
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
 expect(await page.evaluate(async()=>{const p=await MotorPhotoStore.get('a');return [await p[0].image.text(),await p[0].thumb.text()]})).toEqual(['photo-original','photo-original']);
});
test('ties and unverified prices remain explicit in selected cards',async({page})=>{
 await seed(page,[rec('a'),rec('b'),rec('unknown',{price:100000,priceVerifiedAt:null})]);
 await expect(page.locator('#smartSelector .decision-callout')).toContainText('Tek bir kazanan seçilmedi');await expect(page.locator('#smartSelector .decision-advantage')).toHaveText(['Eşit puan','Eşit puan']);
 for(const id of ['a','b','unknown'])await page.locator(`[data-choose="${id}"]`).check();await page.locator('#compareBtn').click();
 const card=page.locator('#compareContent .decision-card').last();await expect(card.locator('.decision-facts')).toContainText('Doğrulanmadı');await expect(card.locator('.decision-budget')).toContainText('Fiyat doğrulaması bekleniyor');await expect(card.locator('.decision-advantage')).toHaveCount(0);
 await expect(page.locator('#compareContent .decision-callout')).toContainText('Tek bir kazanan seçilmedi');
});
