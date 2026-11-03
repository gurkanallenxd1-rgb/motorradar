const {test,expect}=require('@playwright/test');
const rec=(id,patch={})=>({id,title:'Motor '+id,model:'Yamaha MT-25',year:2024,km:10000,price:240000,verifiedPrice:240000,priceVerifiedAt:'2026-01-01',status:'following',favorite:true,history:[{price:240000,at:'2026-01-01'}],createdAt:'2026-01-01',url:'',custom:{keep:true},...patch});
async function seed(page,xs){await page.goto('/');for(const id of ['decisionPanel']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};await page.evaluate(xs=>{localStorage.setItem('motorradar-v1',JSON.stringify(xs));localStorage.setItem('motorradar-budget','250000')},xs);await page.reload();for(const id of ['decisionPanel']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()}}
test('compact cards preserve true ties, distinguish total overrun and disclose user inspection',async({page})=>{
 const xs=[rec('a',{decision:{costs:{insurance:15000},inspection:{checks:{chassis:'Sorun var'},notes:'Kullanıcı notu <script>'}}}),rec('b'),rec('missing',{km:null,priceVerifiedAt:null})];
 await seed(page,xs);
 await expect(page.locator('.decision-metrics')).toContainText('Eşit puan · 2 aday');
 await expect(page.locator('.decision-callout')).toContainText('Tek bir kazanan seçilmedi');
 await expect(page.locator('.decision-score strong')).toHaveText(['50.0','50.0']);
 const a=page.locator('.decision-card').first();
 await expect(a.locator('.decision-budget')).toContainText('Masraf eksik');
 await expect(a.locator('.decision-budget')).not.toContainText('bütçeye uygun');
 await expect(a.locator('.decision-detail-body')).toBeHidden();await a.locator('.candidate-detail > summary').click();
 await expect(a.locator('.decision-detail-body')).toContainText('25.0 / 50');
 await expect(a.locator('.decision-detail-body')).toContainText('15.0 / 30');
 await expect(a.locator('.decision-detail-body')).toContainText('10.0 / 20');
 await expect(a.locator('.decision-detail-body')).toContainText('Sorun var: 1');
 await expect(a.locator('.inspection-note')).toHaveText('Kullanıcı notu <script>');
 const missing=page.locator('[data-panel-key="unscored"]');await expect(missing).not.toHaveAttribute('open','');
 await missing.locator('summary').click();await expect(missing).toContainText('kilometre');
 await a.locator('[data-panel-decision]').click();await page.locator('#legacyCosts > summary').click();await expect(page.locator('#legacyRows')).toContainText('15.000');await page.locator('#researchDialog .close').click();
 await expect(a.locator('.candidate-detail')).toHaveAttribute('open','');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')))).toEqual(xs);
});
test('40 candidates paginate, accordions support keyboard and narrow Safari layouts',async({page})=>{
 const xs=Array.from({length:40},(_,i)=>rec(String(i).padStart(2,'0'),{title:'Çok uzun ilan başlığı '+('MT25'.repeat(30))}));
 await seed(page,xs);await expect(page.locator('.decision-card')).toHaveCount(5);
 await page.locator('#candidateMore').click();await expect(page.locator('.decision-card')).toHaveCount(10);
 const candidates=page.locator('[data-panel-key="candidates"]');await candidates.locator(':scope > summary').focus();await page.keyboard.press('Enter');await expect(page.locator('.decision-card').first()).toBeHidden();await page.keyboard.press('Space');await expect(page.locator('.decision-card').first()).toBeVisible();
 for(const width of [320,375,390]){
  await page.setViewportSize({width,height:844});
  const card=page.locator('.decision-card').first();if(!await card.locator('.candidate-detail').evaluate(e=>e.open))await card.locator('.candidate-detail > summary').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('#decisionPanel').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  const summary=card.locator('.candidate-detail > summary');expect((await summary.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
 }
 // Re-rendering a budget preference preserves disclosure state and every stored listing byte.
 const before=await page.evaluate(()=>localStorage.getItem('motorradar-v1'));
 await page.locator('#selectorBudget').fill('230000');await page.locator('#selectorBudget').press('Tab');
 await expect(page.locator('.decision-card').first().locator('.candidate-detail')).toHaveAttribute('open','');
 await expect(page.locator('.decision-card').first().locator('.decision-budget')).toContainText('Bütçe aşıldı');
 expect(await page.evaluate(()=>localStorage.getItem('motorradar-v1'))).toBe(before);
});
test('panel contrast, accessible controls and photo bytes survive read-only decisions',async({page})=>{
 await seed(page,[rec('a'),rec('b')]);
 await page.evaluate(async()=>{const blob=new Blob(['photo-sentinel'],{type:'image/jpeg'});await MotorPhotoStore.set('a',[{image:blob,thumb:blob}])});
 const snapshot=await page.locator('#smartSelector').ariaSnapshot();expect(snapshot).toContain('spinbutton "Bütçen (TL)"');expect(snapshot).toContain('article "Motor a"');
 await page.locator('.decision-card').first().locator('.candidate-detail > summary').click();await expect(page.getByLabel('Motor a · Detayları göster')).toBeVisible();
 const contrast=await page.evaluate(()=>{
  const luminance=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
  return ['#decisionPanel','.decision-caption','.decision-budget','#smartSelector .btn'].map(selector=>{const e=document.querySelector(selector),style=getComputedStyle(e);let bg=e;while(getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;const a=luminance(style.color),b=luminance(getComputedStyle(bg).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
 });
 for(const ratio of contrast)expect(ratio).toBeGreaterThanOrEqual(4.5);
 await page.locator('[data-panel-key="scoring"] > summary').click();await page.locator('#weight-price').fill('60');await page.locator('#weight-km').fill('20');await page.reload();for(const id of ['decisionPanel']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};
 expect(await page.evaluate(async()=>{const photos=await MotorPhotoStore.get('a');return {length:photos.length,image:await photos[0].image.text(),thumb:await photos[0].thumb.text()}})).toEqual({length:1,image:'photo-sentinel',thumb:'photo-sentinel'});
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
 const footer=await page.locator('.footer-bar').boundingBox(),last=await page.locator('.listing').last().boundingBox();expect(last.y+last.height).toBeLessThanOrEqual(footer.y);
});
