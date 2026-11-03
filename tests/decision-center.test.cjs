const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../purchase-costs'),S=require('../selector'),data=require('../data/cost-sources.json');
const x={id:'r25',model:'Yamaha R25',year:2024,km:10000,price:220000,verifiedPrice:220000,priceVerifiedAt:'2026-11-03',decision:{costs:{service:99999},inspection:{checks:{chassis:'Sorun var'},notes:'koru'}}};
test('approved blank, null and absent expenses stay missing; explicit zero counts',()=>{
 for(const key of ['service','parts','other'])for(const value of [undefined,null,'',0,500]){
  const p={[key]:value,[key+'Approved']:true},before=JSON.stringify({x,p,data}),c=C.calculate(x,p,data,210000,'2026-11-03');
  assert.equal(C.expenseState(p,key),typeof value==='number'?'Onaylı · bütçeye dahil':'Tutar eksik');
  assert.equal(c.lines.find(l=>l.key===key).amount,typeof value==='number'?value:null);
  assert.equal(c.total,null);assert.ok(c.partialRemaining<0);assert.equal(JSON.stringify({x,p,data}),before);
 }
 assert.equal(C.expenseState({},'service'),'Girilmedi');
});
test('only unified calculator feeds budget; unknown sale never creates a remaining budget',()=>{
 const p={service:500,serviceApproved:true},c=C.calculate(x,p,data,250000,'2026-11-03');
 assert.equal(c.lines.find(l=>l.key==='service').amount,500);assert.ok(c.subtotal<230000);assert.equal(c.remaining,null);
 const missing=C.calculate({...x,verifiedPrice:null},p,data,250000,'2026-11-03');assert.equal(missing.partialRemaining,null);
 assert.equal(S.inspection(x).checks.chassis,'Sorun var');assert.equal(S.inspection(x).checks.documents,'Kontrol edilmedi');
});

test('approved empty quote is missing and cannot fall back to a published package',()=>{
 const p={insuranceMode:'quote',quoteApproved:true,insuranceQuote:null,quoteDate:'2026-11-03',providerId:'yamanlar-alibeykoy',providerQuoteId:'yamanlar-alibeykoy',providerQuoteApproved:true,providerQuote:null};
 const c=C.calculate(x,p,data,250000,'2026-11-03');
 for(const key of ['insurance','inspection']){assert.equal(C.missingAmount(p,key),true);assert.equal(c.lines.find(l=>l.key===key).amount,null);}
});
