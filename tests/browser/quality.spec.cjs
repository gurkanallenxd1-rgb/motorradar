const {test,expect}=require('@playwright/test');
test('iPhone: Gmail cleanup, status/source filters and email timeline preserve user data',async({page})=>{
 const errors=[],outside=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000'))outside.push(r.url())});
 await page.goto('/');
 const event=(price,date)=>({kind:'price_drop',oldPrice:price+1000,newPrice:price,price,
  observedAt:date,url:'https://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-mt25-1338808674/detay'});
 const imported={id:'mail',title:'<http://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-mt25-1338808674/detay/>',
  brand:'Yamaha',model:'',year:null,km:null,price:null,city:'',notes:'Benim notum',
  status:'unknown',favorite:true,url:'https://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-mt25-1338808674/detay',
  history:[],createdAt:'2026-11-03T01:00:00Z',gmailEvents:[event(273000,'2026-10-18T08:00:00Z'),event(270000,'2026-11-01T10:00:00Z')]};
 const manual={id:'manual',title:'Manuel MT',brand:'Yamaha',model:'Yamaha MT-25',year:2023,km:12000,
  price:250000,url:'',notes:'Elle girildi',status:'following',favorite:false,
  createdAt:'2026-11-01T01:00:00Z',history:[{price:250000,at:'2026-11-01T01:00:00Z'}]};
 await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),[imported,manual]);
 await page.reload();
 await expect(page.locator('.listing')).toHaveCount(2);
 await expect(page.locator('#gmailCount')).toHaveText('1');
 await expect(page.locator('#unknownCount')).toHaveText('1');
 await expect(page.locator('.listing h3').first()).toHaveText('Yamaha MT-25 · #1338808674');
 await page.locator('#sourceFilter').selectOption('gmail');
 await expect(page.locator('.listing')).toHaveCount(1);
 await page.locator('#statusFilter').selectOption('sold');
 await expect(page.locator('.listing')).toHaveCount(0);
 await page.locator('#statusFilter').selectOption('unknown');
 await expect(page.locator('.listing')).toHaveCount(1);
 await page.locator('[data-detail=mail]').click();
 await expect(page.locator('#detailContent')).toContainText('Gmail fiyat bildirim geçmişi (2)');
 await expect(page.locator('#detailContent')).toContainText('273.000 ₺');
 await expect(page.locator('#detailContent')).toContainText('270.000 ₺');
 await page.locator('[data-close=detailDialog]').click();
 const downloading=page.waitForEvent('download');
 await page.locator('#cleanupGmail').click();
 await downloading;
 const records=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));
 const saved=await records();
 expect(saved[0].title).toBe('Yamaha MT-25 · #1338808674');
 expect(saved[0].model).toBe('Yamaha MT-25');
 expect(saved[0].status).toBe('unknown');
 expect(saved[0].price).toBe(null);
 expect(saved[0].favorite).toBe(true);
 expect(saved[0].notes).toBe('Benim notum');
 expect(saved[0].gmailEvents).toHaveLength(2);
 expect(saved[1]).toEqual(manual);
 await page.locator('#resetFilters').click();
 await expect(page.locator('.listing')).toHaveCount(2);
 for(const width of [320,375,390]){
  await page.setViewportSize({width,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);
 expect(outside).toEqual([]);
});
