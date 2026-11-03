const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../purchase-costs.js'),B=require('../backup.js'),data=require('../data/cost-sources.json');
const at='2026-11-03',x={id:'a',price:240000,verifiedPrice:240000,priceVerifiedAt:at};
const line=(p,key,d=data)=>C.calculate(x,p,d,290000,at).lines.find(l=>l.key===key);
test('manual and sourced registration differ by 511 without mutating; scope and current dates gate source',()=>{
 const p={registration:1000},before=JSON.stringify(p);assert.equal(line(p,'registration').amount,1000);assert.equal(line(p,'registration').origin,'manual');assert.equal(C.sourceFee('registration',p,data,at)-p.registration,511);assert.equal(JSON.stringify(p),before);
 assert.equal(line({...p,registrationSource:true,registrationSourceAmount:1511},'registration').amount,1511);
 for(const scope of [{registrationRequired:'unknown'},{transaction:'other'}])assert.equal(C.sourceFee('registration',scope,data,at),null);
 assert.equal(C.sourceFee('registration',{registrationRequired:'no'},data,at),0);
 assert.equal(C.sourceFee('registration',{},data,'2027-01-01'),null);
 const d=structuredClone(data);d.registration.amount=1600;assert.equal(line({registrationSource:true,registrationSourceAmount:1511},'registration',d).amount,null);
 d.notaryService.amount=500;assert.equal(C.sourceFee('notaryService',{},d,at),null);
});
test('SBM reference never enters budget; quote requires date and consent',()=>{
 const d=structuredClone(data);Object.assign(d.insurance,{access:'verified',verifiedAt:at,rows:[{province:34,step:4,amount:9000}]});
 const p={province:34,step:4};assert.equal(C.calculate(x,p,d,290000,at).insurance.amount,9000);assert.equal(line(p,'insurance',d).amount,null);
 const q={...p,insuranceMode:'quote',insuranceQuote:5000,quoteDate:at,quoteApproved:true};assert.equal(line(q,'insurance',d).amount,5000);assert.equal(line(q,'insurance',d).origin,'quote');assert.equal(line({...q,quoteApproved:false},'insurance',d).amount,null);assert.equal(line({...q,quoteDate:'2027-01-01'},'insurance',d).amount,null);
});
test('custom estimate never becomes a named provider quote; real quote is bound to provider and date',()=>{
 const p={providerId:'yamanlar-alibeykoy',inspectionQuote:1234};assert.equal(line(p,'inspection').amount,4500);assert.equal(line(p,'inspection').origin,'published');
 const q={...p,providerQuote:4000,providerQuoteDate:at,providerQuoteId:p.providerId,providerQuoteApproved:true};assert.equal(line(q,'inspection').amount,4000);assert.equal(line(q,'inspection').origin,'quote');assert.equal(line({...q,providerId:'atolye-light'},'inspection').amount,6000);assert.equal(line({...q,providerQuoteDate:'2027-01-01'},'inspection').origin,'published');
 assert.equal(line({...p,providerId:'custom'},'inspection').amount,1234);assert.equal(line({...p,providerId:'custom'},'inspection').origin,'manual');
 assert.deepEqual(B.scenarios({a:q}).a,q);assert.throws(()=>B.scenarios({a:{...q,providerQuoteApproved:'yes'}}));assert.throws(()=>B.scenarios({a:{...q,providerQuoteDate:'bad'}}));
});
test('missing verified sale suppresses remaining budget; one line per expense and exact cents retained',()=>{
 const p={registration:1000,notaryService:500,providerId:'custom',inspectionQuote:4000,insuranceMode:'quote',insuranceQuote:5000,quoteDate:at,quoteApproved:true,service:0,serviceApproved:true,parts:0,partsApproved:true,other:0,otherApproved:true};
 const c=C.calculate(x,p,data,290000,at);assert.equal(c.total,251500);assert.equal(c.remaining,38500);assert.equal(new Set(c.lines.map(l=>l.key)).size,c.lines.length);
 const missing=C.calculate({...x,priceVerifiedAt:null},p,data,290000,at);assert.equal(missing.motorMissing,true);assert.equal(missing.total,null);assert.equal(missing.remaining,null);assert.equal(missing.partialRemaining,null);assert.ok(missing.unknown.length>=1);
});
