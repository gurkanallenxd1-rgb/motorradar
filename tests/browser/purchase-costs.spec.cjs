const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',screenshot:'only-on-failure'});
const base=require('../../data/cost-sources.json');
const rec=(id,model='Yamaha R25',price=240000)=>({id,title:'Motor '+id,model,price,verifiedPrice:price,priceVerifiedAt:'2026-01-01',year:2024,km:10000,status:'following',notes:'koru',history:[],createdAt:'2026-01-01',custom:{keep:true}});
async function seed(page,data=base){await page.route('**/data/cost-sources.json',route=>route.fulfill({json:data}));await page.goto('/');await page.evaluate(xs=>{localStorage.setItem('motorradar-v1',JSON.stringify(xs));localStorage.setItem('motorradar-budget','275000');localStorage.setItem('motorradar-drive-sentinel','koru')},[rec('a'),rec('b','Yamaha MT-25',230000),rec('c','KTM Duke 250',220000)]);await page.reload();await expect(page.locator('#researchDialog')).toHaveCount(1)}
async function fits(page){for(const width of [320,375,390]){await page.setViewportSize({width,height:844});const g=await page.locator('#researchDialog .dialog-content').evaluate(e=>({overflow:e.scrollWidth-e.clientWidth,scrollLeft:e.scrollLeft,controls:[...e.querySelectorAll('input,select,label,p')].filter(n=>n.scrollWidth>n.clientWidth+1&&n.getClientRects().length).map(n=>({tag:n.tagName,id:n.id,type:n.type,overflow:n.scrollWidth-n.clientWidth,html:n.outerHTML.slice(0,1000),whiteSpace:getComputedStyle(n).whiteSpace,display:getComputedStyle(n).display})),offenders:[...e.querySelectorAll('*')].filter(n=>n.getBoundingClientRect().right>e.getBoundingClientRect().right+1).map(n=>({tag:n.tagName,id:n.id,type:n.type,width:n.getBoundingClientRect().width}))}));expect(g.overflow,JSON.stringify(g)).toBeLessThanOrEqual(1)}}
test('research never modifies listings/photos/budget; exact SBM step changes and quote stays separate',async({page})=>{
 const d=structuredClone(base),at=new Date().toISOString().slice(0,10);d.insurance.access='verified';d.insurance.verifiedAt=at;d.insurance.validFrom=at;d.insurance.validTo='2026-12-31';d.insurance.rows=[{province:34,step:4,amount:5000},{province:34,step:8,amount:2000}];
 await seed(page,d);await page.evaluate(async()=>{const b=new Blob(['photo-original']);await MotorPhotoStore.set('a',[{image:b,thumb:b}])});
 const before=await page.evaluate(()=>({listings:localStorage.getItem('motorradar-v1'),budget:localStorage.getItem('motorradar-budget'),drive:localStorage.getItem('motorradar-drive-sentinel')}));
 await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();await page.locator('#research-province').selectOption('34');await page.locator('#research-step').selectOption('4');
 await expect(page.locator('#researchResult')).toContainText('5.000');await expect(page.locator('#researchResult')).toContainText('teklif değildir');
 await page.locator('#research-step').selectOption('8');await expect(page.locator('#researchResult')).toContainText('2.000');
 await page.locator('#research-providerId').selectOption('yamanlar-alibeykoy');await expect(page.locator('#researchResult')).toContainText('4.500');await expect(page.locator('#researchResult')).toContainText('Erişim hatası');
 await fits(page);await page.locator('#research-insuranceMode').selectOption('quote');await page.locator('[data-research="quoteApproved"]').check();await page.locator('#research-insuranceQuote').fill('3000');await page.locator('#research-insuranceQuote').press('Tab');await page.locator('[data-research="quoteDate"]').fill(at);await page.locator('[data-research="quoteDate"]').press('Tab');
 for(const [key,value] of [['notaryService','500'],['registration','1511']]){await page.locator('#research-'+key).fill(value);await page.locator('#research-'+key).press('Tab')}
 await page.getByRole('tab',{name:'Masraflar ve Bütçe'}).click();
 for(const [key,value] of [['service','2000'],['parts','0'],['other','0']]){await page.locator('#research-'+key).fill(value);await page.locator('#research-'+key).press('Tab')}
 for(const key of ['service','parts','other'])await page.locator(`[data-research="${key}Approved"]`).check();
 await expect(page.locator('#researchResult')).toContainText('Tahmini senaryo toplamı');await expect(page.locator('#researchResult')).toContainText('252.511');await expect(page.locator('#researchResult')).not.toContainText('Kesinleşen toplam');
 await fits(page);
 await page.locator('#researchDialog .close').click();await page.locator('[data-research-open="b"]').first().click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();await expect(page.locator('#research-insuranceQuote')).toHaveValue('');await page.locator('#researchDialog .close').click();await page.reload();
 expect(await page.evaluate(()=>({listings:localStorage.getItem('motorradar-v1'),budget:localStorage.getItem('motorradar-budget'),drive:localStorage.getItem('motorradar-drive-sentinel')}))).toEqual(before);
 expect(await page.evaluate(async()=>{const p=await MotorPhotoStore.get('a');return [await p[0].image.text(),await p[0].thumb.text()]})).toEqual(['photo-original','photo-original']);
 await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();await expect(page.locator('#research-insuranceQuote')).toHaveValue('3000');
});
test('inaccessible sources and expired duty do not produce a complete total or reuse old-year duty',async({page})=>{
 const d=structuredClone(base);d.notary.validTo='2025-12-31';await seed(page,d);await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();await expect(page.locator('#researchResult')).toContainText('Eksik kalemli ara toplam');await expect(page.locator('#researchResult')).toContainText('Tam bütçe hesaplanamadı');await expect(page.locator('#researchResult')).toContainText('Bilinmiyor');await expect(page.locator('#researchResult')).toContainText('2025-12-31');
});
test('static source request failure leaves unknowns explicit and storage untouched',async({page})=>{
 await page.route('**/data/cost-sources.json',route=>route.abort());await page.goto('/');await page.evaluate(x=>localStorage.setItem('motorradar-v1',JSON.stringify([x])),rec('a'));await page.reload();const before=await page.evaluate(()=>JSON.stringify(localStorage));await page.locator('[data-research-open="a"]').click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();await expect(page.locator('#researchDialog')).toContainText('Kaynak verisi alınamadı');await expect(page.locator('#researchResult')).toContainText('Tam bütçe hesaplanamadı');expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});
test('one tap research preserves manual inputs, explicit source choice and failed refresh',async({page})=>{
 await seed(page);await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();
 await page.locator('[data-research="transaction"]').selectOption('other');await expect(page.locator('[data-research="registrationRequired"]')).toHaveValue('unknown');await page.locator('[data-research="transaction"]').selectOption('used-sale');await expect(page.locator('[data-research="registrationRequired"]')).toHaveValue('yes');
 await page.locator('#research-registration').fill('2000');await page.locator('#research-registration').press('Tab');
 const before=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.locator('#autoResearch').click();await expect(page.locator('#autoResearchStatus')).toContainText('Daha önce kaydedilmiş fiyat kullanıldı');
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
 await expect(page.locator('#research-registration')).toHaveValue('2000');
 await page.getByRole('tab',{name:'Masraflar ve Bütçe'}).click();await page.locator('[data-edit-cost="registration"]').click();await page.locator('[data-use-source="registration"]').click();
 await expect(page.locator('#researchResult [data-cost-status]').filter({hasText:'Ruhsat / tescil belgesi'})).toContainText('1.511');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-costs-v37')).a.registration)).toBe(2000);
 await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('[data-research="registrationRequired"]').selectOption('no');
 await expect(page.locator('#researchResult')).toContainText('Belge düzenlenmiyor');
 await page.getByText('İstanbul motosiklet ekspertiz paketleri',{exact:true}).click();await page.locator('#providerLocation').selectOption({label:'Ataşehir / İstanbul'});await expect(page.locator('#providerCards .cost-card')).toHaveCount(1);await expect(page.locator('#providerCards')).toContainText('6.000');
 await page.locator('#providerCards [data-package]').click();await page.locator('#providerSort').selectOption('price');await fits(page);
 const saved=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.route('**/data/cost-sources.json',route=>route.abort());await page.locator('#autoResearch').click();await expect(page.locator('#autoResearchStatus')).toContainText('güncellemesi başarısız');expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(saved);
});

test('source refresh discloses its limits and preserves all 81 listings and manual amounts',async({page})=>{
 await seed(page);
 await page.evaluate(xs=>{
  localStorage.setItem('motorradar-v1',JSON.stringify(xs));
  localStorage.setItem('motorradar-costs-v37',JSON.stringify({a:{notaryService:2345,registration:2000,insuranceMode:'quote',insuranceQuote:7654,quoteDate:'2026-11-03',quoteApproved:true}}));
 },Array.from({length:81},(_,i)=>rec(i===0?'a':'listing-'+i)));
 await page.reload();await page.locator('[data-research-open="a"]').first().click();await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();
 await expect(page.getByRole('button',{name:'Kaynak dosyasını yenile',exact:true})).toBeVisible();
 await expect(page.locator('#sourceRefreshHelp')).toContainText('Canlı sigorta, noter veya ekspertiz fiyatı araştırması yapmaz');
 const before=await page.evaluate(()=>JSON.stringify(localStorage));
 const requests=[];page.on('request',r=>requests.push(r.url()));
 const next=JSON.parse(JSON.stringify(base));next.registration.amount=1600;
 await page.route('**/data/cost-sources.json',route=>route.fulfill({json:next}));
 await page.locator('#autoResearch').click();
 await expect(page.locator('#autoResearchStatus')).toContainText('Yeni yayımlanmış kaynak dosyası');
 await expect(page.locator('#autoResearchStatus')).toContainText('canlı fiyat alınmadı');
 await expect(page.locator('#research-notaryService')).toHaveValue('2345');
 await expect(page.locator('#research-registration')).toHaveValue('2000');
 await expect(page.locator('#research-insuranceQuote')).toHaveValue('7654');
 expect(requests).toHaveLength(1);expect(new URL(requests[0]).pathname).toBe('/data/cost-sources.json');
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')).length)).toBe(81);
 await page.route('**/data/cost-sources.json',route=>route.fulfill({json:next,headers:{'X-MotorRadar-Source-Cache':'stale'}}));
 await page.locator('#autoResearch').click();await expect(page.locator('#autoResearchStatus')).toContainText('Güncelleme başarısız');
 await page.route('**/data/cost-sources.json',route=>route.fulfill({json:{invalid:true}}));
 await page.locator('#autoResearch').click();await expect(page.locator('#autoResearchStatus')).toContainText('güncellemesi başarısız');
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
});

test('smart cards compare without writes, bind provider quotes, preserve 290000 and suppress missing-sale remainder',async({page})=>{
 await seed(page);await page.evaluate(xs=>{localStorage.setItem('motorradar-v1',JSON.stringify(xs));localStorage.setItem('motorradar-budget','290000');localStorage.setItem('motorradar-costs-v37',JSON.stringify({a:{registration:1000,providerId:'custom',inspectionQuote:1234}}))},Array.from({length:81},(_,i)=>rec(i===0?'a':'listing-'+i)));
 await page.reload();await page.locator('[data-research-open="a"]').first().click();
 const registration=page.locator('[data-cost-key="registration"]');await expect(registration).toContainText('Kullanıcı tarafından girildi');await expect(page.locator('#costEditor')).not.toHaveAttribute('open','');
 const before=await page.evaluate(()=>JSON.stringify(localStorage));await registration.locator('[data-edit-cost]').click();await expect(registration.locator('.cost-comparison')).toContainText('1.000');await expect(registration.locator('.cost-comparison')).toContainText('1.511');await expect(registration.locator('.cost-comparison')).toContainText('511');expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);await fits(page);
 await registration.locator('[data-use-source]').click();await expect(registration).toContainText('Resmî kaynaktan hesaplandı');await expect(registration.locator('.cost-heading')).toContainText('1.511');
 await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#costEditor > summary').click();await page.locator('#research-providerId').selectOption('yamanlar-alibeykoy');
 const inspection=page.locator('[data-cost-key="inspection"]');await expect(inspection.locator('.cost-heading')).toContainText('4.500');await expect(inspection).toContainText('Sağlayıcının yayımladığı fiyat; teyit gerekli');
 await page.locator('#research-providerQuote').fill('4000');await page.locator('#research-providerQuote').press('Tab');await page.locator('[data-research="providerQuoteDate"]').fill('2026-11-03');await page.locator('[data-research="providerQuoteDate"]').press('Tab');await page.locator('[data-research="providerQuoteApproved"]').check();await expect(inspection.locator('.cost-heading')).toContainText('4.000');await expect(inspection).toContainText('Kullanıcı tarafından doğrulanmış gerçek teklif');
 await page.getByRole('tab',{name:'Masraflar ve Bütçe'}).click();await inspection.locator('[data-edit-cost]').click();await expect(inspection.locator('.cost-comparison')).toContainText('500');await fits(page);
 await page.getByRole('tab',{name:'Kaynaklar ve Teklifler'}).click();await page.locator('#research-providerId').selectOption('atolye-light');await expect(inspection.locator('.cost-heading')).toContainText('6.000');await expect(page.locator('[data-research="providerQuoteApproved"]')).not.toBeChecked();
 await page.locator('#research-providerId').selectOption('custom');await expect(inspection.locator('.cost-heading')).toContainText('1.234');
 await page.locator('#research-insuranceMode').selectOption('quote');await page.locator('[data-research="quoteApproved"]').check();await page.locator('#research-insuranceQuote').fill('5000');await page.locator('#research-insuranceQuote').press('Tab');await page.locator('[data-research="quoteDate"]').fill('2026-11-03');await page.locator('[data-research="quoteDate"]').press('Tab');
 await expect(page.locator('[data-cost-key="insurance"]')).toContainText('Kullanıcı tarafından doğrulanmış gerçek teklif');
 await page.locator('[data-research="registrationRequired"]').selectOption('unknown');await page.getByRole('tab',{name:'Masraflar ve Bütçe'}).click();await registration.locator('[data-edit-cost]').click();await expect(registration.locator('[data-use-source]')).toHaveCount(0);await expect(registration.locator('.cost-comparison')).toContainText('Bilinmiyor');
 await fits(page);await page.locator('#researchDialog .close').click();
 await page.evaluate(()=>{const xs=JSON.parse(localStorage.getItem('motorradar-v1'));xs[0].priceVerifiedAt=null;localStorage.setItem('motorradar-v1',JSON.stringify(xs))});await page.reload();await page.locator('[data-research-open="a"]').first().click();await expect(page.locator('.research-summary').last()).toContainText('Motor fiyatı eksik, tam bütçe hesaplanamaz');await expect(page.locator('#researchResult .research-summary')).not.toContainText('kalan:');
 expect(await page.evaluate(()=>localStorage.getItem('motorradar-budget'))).toBe('290000');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')).length)).toBe(81);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-costs-v37')).a.registration)).toBe(1000);
});
