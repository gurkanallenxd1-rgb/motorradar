const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../purchase-costs.js'),B=require('../backup.js'),{collect}=require('../scripts/research-costs.cjs');
const d=require('../data/cost-sources.json'),at='2026-11-03',x=price=>({verifiedPrice:price,priceVerifiedAt:at,price});
test('requested R25 and MT25 examples have partial balances, never complete totals',()=>{
 for(const [price,balance] of [[220000,67489],[285500,1989]]){const c=C.calculate(x(price),{},d,290000,at);assert.equal(c.subtotal,price+2511);assert.equal(c.partialRemaining,balance);assert.equal(c.total,null);assert.equal(c.unknown.find(l=>l.key==='insurance').amount,null);assert.equal(c.estimates.length,0)}
});
test('document scope, preserved manual amount and explicit source selection survive backup',()=>{
 const p={registration:2000,registrationRequired:'no'};const before=JSON.stringify(p);
 assert.equal(C.calculate(x(220000),p,d,290000,at).lines.find(l=>l.key==='registration').amount,2000);
 assert.equal(JSON.stringify(p),before);
 const sourced={...p,registrationSource:true};assert.equal(C.calculate(x(220000),sourced,d,290000,at).lines.find(l=>l.key==='registration').amount,0);
 assert.equal(B.scenarios({a:sourced}).a.registration,2000);
 assert.equal(C.calculate(x(220000),{registrationRequired:'unknown'},d,290000,at).lines.find(l=>l.key==='registration').amount,null);
 assert.equal(C.calculate(x(220000),{transaction:'other'},d,290000,at).lines.find(l=>l.key==='registration').amount,null);
});
test('expired sources cannot fill fees and personal quote requires consent',()=>{
 assert.equal(C.calculate(x(220000),{},d,290000,'2027-01-01').lines.find(l=>l.key==='registration').amount,null);
 assert.equal(C.calculate(x(220000),{insuranceMode:'quote',insuranceQuote:1234,quoteDate:at},d,290000,at).lines.find(l=>l.key==='insurance').amount,null);
});
test('unapproved remote sources never contacted; approved PDF failures stay unknown',async()=>{
 let calls=0;const before=JSON.stringify(d);const r=await collect(d,require('../data/cost-access-policy.json'),async()=>{calls++;throw Error('PDF inaccessible')});assert.equal(calls,0);assert.ok(r.items.every(i=>i.status==='blocked-by-policy'));
 const policy={sources:[{id:d.insurance.id,automatedAccess:true,permissionUrl:d.insurance.sourceUrl,permissionReviewedAt:at,sourceUrl:d.insurance.documentUrl}]};const failed=await collect(d,policy,async()=>{calls++;throw Error('PDF inaccessible')});assert.equal(calls,1);assert.deepEqual(failed.items.find(i=>i.id===d.insurance.id).rows,[]);assert.equal(JSON.stringify(d),before);
});
