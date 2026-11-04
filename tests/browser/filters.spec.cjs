const {test,expect}=require('@playwright/test');
test('iPhone: favorites persist, bounds combine and reset preserves sorting',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');for(const id of ['advancedFilters']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};
 const record=(id,price,km)=>({id,title:id,model:'Honda',year:2023,price,km,url:'',history:price===null?[]:[{price,at:'2026-01-01'}],createdAt:'2026-01-01'});
 await page.evaluate(xs=>localStorage.setItem('motorradar-v1',JSON.stringify(xs)),[record('legacy',240000,10000),record('other',300000,20000),record('unknown',null,null)]);await page.reload();for(const id of ['advancedFilters']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};
 const star=page.locator('[data-favorite=legacy]');await expect(star).toHaveAttribute('aria-pressed','false');await star.click();await page.reload();for(const id of ['advancedFilters']){if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+' > summary').click()};await expect(star).toHaveAttribute('aria-pressed','true');
 await page.locator('#favoritesOnly').check();await expect(page.locator('.listing')).toHaveCount(1);
 await page.locator('#maxPrice').fill('240000');await page.locator('#minKm').fill('10000');await page.locator('#maxKm').fill('10000');await expect(page.locator('.listing')).toHaveCount(1);
 await page.locator('#minPrice').fill('240001');await expect(page.locator('.listing')).toHaveCount(0);
 await page.locator('#sort').selectOption('expensive');await page.locator('#resetFilters').click();await expect(page.locator('.listing')).toHaveCount(3);await expect(page.locator('#sort')).toHaveValue('expensive');await expect(page.locator('.listing h3').first()).toHaveText('other');
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('#favoritesOnly').check();await star.click();await expect(page.locator('.listing')).toHaveCount(0);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('motorradar-v1')));expect(saved[0].history).toEqual([{price:240000,at:'2026-01-01'}]);expect(saved[0].favorite).toBe(false);expect(errors).toEqual([]);
});
