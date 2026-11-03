const {test}=require('node:test'),assert=require('node:assert/strict'),B=require('../backup.js'),C=require('../purchase-costs.js');
function storage(seed={}){const map=new Map(Object.entries(seed));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map}}
const rec=i=>({id:'id'+i,title:'Motor '+i,model:['Yamaha R25','Yamaha MT-25','KTM Duke 250'][i%3],price:240000,year:2024,km:1000,history:[],custom:{keep:true}});
const valid=x=>typeof x.id==='string',dupe=()=>false;
test('81 listings and independent scenarios survive legacy merge; no listing omitted by a backup is deleted',()=>{
 const xs=Array.from({length:81},(_,i)=>rec(i)),costs={id0:{insuranceQuote:2345,quoteDate:'2026-11-03',insuranceMode:'quote'}};
 const p=B.preview({app:'MotorRadar',version:'2.5',listings:[{...xs[0],title:'Updated'}]},xs,costs,valid,dupe);
 assert.equal(p.listings.length,81);assert.deepEqual(p.listings.slice(1),xs.slice(1));assert.deepEqual(p.costs.id0,costs.id0);assert.equal(p.kept,80);assert.equal(p.legacy,true);
});
test('new JSON roundtrip preserves scenarios, metadata, zero amounts and explicit approvals',()=>{
 const costs={id0:{province:'34',step:'0',service:0,serviceApproved:true,quoteDate:'',providerId:'custom'}};
 const st=storage({[B.COSTS]:JSON.stringify(costs)}),d=B.snapshot([rec(0)],st),p=B.preview(JSON.parse(JSON.stringify(d)),[],{},valid,dupe);
 assert.equal(d.photosIncluded,false);assert.deepEqual(p.listings,[rec(0)]);assert.deepEqual(JSON.parse(JSON.stringify(p.costs)),costs);
});
test('reject malicious scenarios, unknown fields, invalid prices/dates, duplicates and conflicting listing URLs before writing',()=>{
 for(const c of [JSON.parse('{"__proto__":{}}'),{id0:{service:-1}},{id0:{service:'1'}},{id0:{serviceApproved:'true'}},{id0:{quoteDate:'2026-02-30'}},{id0:{token:'private'}},{id0:[]},{id0:{step:9}}])assert.throws(()=>B.scenarios(c));
 assert.throws(()=>B.preview({app:'MotorRadar',listings:[rec(1),rec(1)]},[],{},valid,dupe));
 assert.throws(()=>B.preview({app:'MotorRadar',listings:[rec(2)]},[rec(1)],{},valid,()=>true));
});
test('quota failure at each transaction phase rolls back both stores, never touches unrelated data',()=>{
 for(const failAt of [1,2,3,4]){
  const st=storage({[B.STORE]:JSON.stringify([rec(0)]),[B.COSTS]:'{"id0":{"service":10}}',drive:'keep',budget:'275000'}),before={listings:st.getItem(B.STORE),costs:st.getItem(B.COSTS)},write=st.setItem;let calls=0;
  st.setItem=(k,v)=>{if(++calls===failAt)throw Error('quota');write(k,v)};
  assert.throws(()=>B.apply({listings:[rec(1)],costs:{}},st,before));assert.equal(st.getItem(B.STORE),before.listings);assert.equal(st.getItem(B.COSTS),before.costs);assert.equal(st.getItem('drive'),'keep');assert.equal(st.getItem('budget'),'275000');
 }
});
test('interrupted transaction recovers original raw bytes on next startup; concurrent edits cancel import',()=>{
 const before={listings:JSON.stringify([rec(0)]),costs:'{"id0":{"service":10}}'},st=storage({[B.STORE]:'[]',[B.COSTS]:'{}',[B.PENDING]:JSON.stringify(before)});
 assert.equal(B.recover(st),true);assert.equal(st.getItem(B.STORE),before.listings);assert.equal(st.getItem(B.COSTS),before.costs);assert.equal(st.getItem(B.PENDING),null);
 st.setItem(B.STORE,'[]');assert.throws(()=>B.apply({listings:[],costs:{}},st,before),/başka sekmede/);assert.equal(st.getItem(B.STORE),'[]');
});
test('stale insurance and official fees stay historical and cannot complete a budget; exact profiles never cross-match',()=>{
 const d=structuredClone(require('../data/cost-sources.json'));d.insurance.access='verified';d.insurance.verifiedAt='2026-11-03';d.insurance.rows=[{province:34,step:4,amount:1234,vehicleClass:'motorcycle',usageProfile:'private-other-no-disability',sourceUrl:d.insurance.documentUrl,validFrom:'2026-11-01',validTo:'2026-11-30',verifiedAt:'2026-11-03'}];C.validate(d);
 assert.equal(C.cap({province:34,step:4},d,'2026-11-03').amount,1234);assert.equal(C.cap({province:34,step:4,usageProfile:'corporate-other-no-disability'},d,'2026-11-03').amount,null);
 const p={province:34,step:4};const r=C.calculate({...rec(0),verifiedPrice:240000,priceVerifiedAt:'2026-11-01'},p,d,250000,'2026-12-01');assert.equal(r.lines.find(x=>x.key==='insurance').amount,null);assert.equal(r.insurance.amount,1234);assert.equal(r.total,null);
});
