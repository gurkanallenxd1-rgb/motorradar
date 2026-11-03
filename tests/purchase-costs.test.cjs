const {test}=require('node:test'),assert=require('node:assert/strict');const C=require('../purchase-costs.js'),{audit}=require('../scripts/audit-costs.cjs');const data=require('../data/cost-sources.json');
const at='2026-11-03',record=(model='Yamaha R25',price=240000)=>({id:model,model,price,verifiedPrice:price,priceVerifiedAt:'2026-11-01'});
const clone=()=>JSON.parse(JSON.stringify(data));
test('2026 duty floors, rate, transaction scope and authorized buyer exception',()=>{
 for(const [price,expected] of [[100,1000],[500000,1000],[750000,1500]])assert.equal(C.notary(price,{},data,at),expected);
 assert.equal(C.notary(240000,{authorizedBuyer:true},data,at),0);assert.equal(C.notary(240000,{authorizedBuyer:true,transaction:'first-registration'},data,at),1000);
 assert.equal(C.notary(240000,{transaction:'other'},data,at),null);assert.equal(C.notary(240000,{},data,'2027-01-01'),null);
 const d=clone();d.notary.access='error';assert.equal(C.notary(240000,{},d,at),null);
});
test('SBM joins exact province/step, never invents missing rows, expired last verified cap stays dated',()=>{
 const d=clone();d.insurance.access='verified';d.insurance.verifiedAt=at;d.insurance.rows=[{province:34,step:4,amount:5000},{province:34,step:8,amount:2000},{province:6,step:4,amount:4000}];
 assert.equal(C.cap({province:34,step:4},d,at).amount,5000);assert.equal(C.cap({province:34,step:8},d,at).amount,2000);assert.equal(C.cap({province:6,step:4},d,at).amount,4000);
 assert.equal(C.cap({province:34,step:''},d,at).amount,null);assert.equal(C.cap({province:35,step:4},d,at).amount,null);
 assert.equal(C.cap({province:34,step:4},d,'2026-12-01').current,false);d.insurance.access='error';assert.equal(C.cap({province:34,step:4},d,at).current,false);assert.equal(C.cap({province:34,step:4},d,at).amount,5000);
});
test('unknowns do not become zeros; R25 MT25 Duke isolated scenarios sum verified sale plus all costs',()=>{
 const p={notaryService:500,registration:1511,providerId:'custom',inspectionQuote:4500,insuranceMode:'quote',quoteApproved:true,insuranceQuote:5000,quoteDate:at,service:2000,serviceApproved:true,parts:0,partsApproved:true,other:0,otherApproved:true};
 for(const [model,price] of [['Yamaha R25',240000],['Yamaha MT-25',230000],['KTM Duke 250',220000]]){const x=record(model,price),before=JSON.stringify(x),c=C.calculate(x,p,data,250000,at);assert.equal(c.total,price+14511);assert.equal(c.label,'Tahmini senaryo toplamı');assert.equal(c.remaining,250000-price-14511);assert.equal(JSON.stringify(x),before)}
 assert.equal(C.calculate(record(),{},data,250000,at).total,null);assert.equal(C.calculate(record(),{...p,serviceApproved:false},data,250000,at).total,null);
 assert.equal(C.calculate({...record(),priceVerifiedAt:null},p,data,250000,at).total,null);assert.equal(C.calculate(record(),{...p,insuranceQuote:-5},data,250000,at).total,null);assert.equal(C.calculate(record(),{...p,quoteDate:'2027-01-01'},data,250000,at).total,null);
});
test('audit preserves data and last verification dates through source failure and expired tariffs',()=>{
 const before=JSON.stringify(data),r=audit(data,'2027-01-01');assert.ok(r.items.every(s=>!s.current));assert.equal(JSON.stringify(data),before);assert.equal(r.automaticPriceUpdates,false);assert.ok(r.items.some(s=>s.access==='error'));
});
test('source schema rejects unverified motorcycle services, unsafe links and duplicate SBM rows',()=>{
 for(const mutate of [d=>d.providers[0].motorcycleVerified=false,d=>d.notary.sourceUrl='javascript:alert(1)',d=>d.insurance.rows=[{province:34,step:4,amount:1},{province:34,step:4,amount:2}]]){const d=clone();mutate(d);assert.throws(()=>C.validate(d))}assert.equal(C.validate(data),data);
});
test('evidence importer refuses forged documents and leaves validated prices untouched',()=>{
 const {review}=require('../scripts/import-costs.cjs'),crypto=require('node:crypto'),evidence=Buffer.from('fixture evidence, not production tariff');const before=JSON.stringify(data),candidate={data:clone(),audit:{reviewedAt:at,evidence:[{sourceUrl:data.notary.sourceUrl,sha256:crypto.createHash('sha256').update(evidence).digest('hex')}]}};
 assert.equal(review(candidate,[evidence],at).data.notary.minimum,1000);assert.throws(()=>review(candidate,[Buffer.from('tampered')],at));candidate.data.insurance.rows=[{province:34,step:4,amount:1234}];assert.throws(()=>review(candidate,[evidence],at));assert.equal(JSON.stringify(data),before);
});

test('decimal expenses use cents and exact budget boundary never reports a zero-value overrun',()=>{
 const p={notaryService:.1,registration:.2,insuranceMode:'quote',quoteApproved:true,insuranceQuote:.3,quoteDate:at,providerId:'custom',inspectionQuote:.4,service:.5,serviceApproved:true,parts:.6,partsApproved:true,other:.7,otherApproved:true};
 const c=C.calculate(record(),p,data,241002.8,at);assert.equal(c.total,241002.8);assert.equal(c.remaining,0);assert.equal(C.calculate(record(),p,data,241002.79,at).remaining,-.01);
});
