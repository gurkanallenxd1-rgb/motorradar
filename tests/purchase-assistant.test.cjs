const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../purchase-assistant'),B=require('../backup'),C=require('../purchase-costs'),S=require('../selector'),data=require('../data/cost-sources.json');
const x={id:'bike',model:'Yamaha R25',price:220000,verifiedPrice:220000,priceVerifiedAt:'2026-11-03',decision:{inspection:{checks:{chassis:'Sorun var'}}}};
function storage(seed={}){const map=new Map(Object.entries(seed));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map}}
const state=status=>({status,updatedAt:'2026-11-03T12:00:00Z'});
test('missing data never completes tasks; price date, quote requirement and chassis problems are explicit',()=>{
 const before=JSON.stringify(x),cost=C.calculate(x,{},data,210000,'2026-11-03'),p=A.evaluate(x,{},cost);
 assert.equal(p.completed,0);assert.equal(p.percent,0);assert.match(p.rows[0].hint,/2026-11-03/);assert.equal(p.rows[1].hint,'Teklif gerekli');assert.match(p.rows[4].hint,/Öncelikli kontrol gerekli/);
 assert.ok(p.critical.some(r=>r.key==='history'));assert.equal(JSON.stringify(x),before);
 const unknown=A.evaluate({...x,verifiedPrice:null});assert.match(unknown.rows[0].hint,/gerekli/);
});
test('only explicit user completion counts; ongoing and problems do not count; evidence warnings remain',()=>{
 const p=A.evaluate(x,{bike:{price:state('Tamamlandı'),insurance:state('Tamamlandı'),history:state('Sorun var'),parts:state('Devam ediyor')}});
 assert.equal(p.completed,2);assert.equal(p.percent,29);assert.equal(p.rows[1].critical,true);assert.equal(p.rows[1].hint,'Teklif gerekli');
 const all={bike:Object.fromEntries(Object.keys(A.tasks).map(k=>[k,state('Tamamlandı')]))};assert.equal(A.evaluate(x,all).percent,100);
});
test('approved quotes are read from unchanged unified calculation; published inspection fee never proves a report',()=>{
 const c=C.calculate(x,{insuranceMode:'quote',insuranceQuote:2000,quoteApproved:true,quoteDate:'2026-11-03',parts:0,partsApproved:true},data,250000,'2026-11-03');
 const p=A.evaluate(x,{},c);assert.match(p.rows[1].hint,/onaylı teklif/);assert.equal(p.rows[1].critical,false);assert.match(p.rows[3].hint,/raporu/);assert.equal(p.completed,0);
 const before=JSON.stringify(S.rank([x,{...x,id:'other',price:230000,verifiedPrice:230000}],2026));A.evaluate(x,{bike:{price:state('Tamamlandı')}},c);assert.equal(JSON.stringify(S.rank([x,{...x,id:'other',price:230000,verifiedPrice:230000}],2026)),before);
});
test('four task states persist independently and never write listing or cost stores; stale tabs and quota fail safely',()=>{
 const st=storage({[B.STORE]:'81 listings',[B.COSTS]:'existing scenarios',drive:'keep'});
 for(const status of A.states){A.save(st,'bike','price',status,st.getItem(A.KEY));assert.equal(A.read(st).bike.price.status,status)}
 assert.equal(st.getItem(B.STORE),'81 listings');assert.equal(st.getItem(B.COSTS),'existing scenarios');assert.equal(st.getItem('drive'),'keep');
 const raw=st.getItem(A.KEY);assert.throws(()=>A.save(st,'bike','price','Tamamlandı',null),/başka sekmede/);assert.equal(st.getItem(A.KEY),raw);
 st.setItem=()=>{throw Error('quota')};assert.throws(()=>A.save(st,'bike','price','Yapılmadı',raw));assert.equal(st.getItem(A.KEY),raw);
});
test('backup roundtrip, legacy import and recovery preserve all 81 listings and tasks',()=>{
 const xs=Array.from({length:81},(_,i)=>({...x,id:'id'+i,custom:'keep'})),tasks={id0:{price:state('Devam ediyor'),history:state('Sorun var')}},st=storage({[B.STORE]:JSON.stringify(xs),[A.KEY]:JSON.stringify(tasks),[B.COSTS]:'{}'});
 const d=B.snapshot(xs,st),p=B.preview(d,[],{},()=>true,()=>false);assert.deepEqual(JSON.parse(JSON.stringify(p.preparation)),tasks);
 const legacy=B.preview({app:'MotorRadar',listings:[]},xs,{},()=>true,()=>false,tasks);assert.equal(legacy.listings.length,81);assert.deepEqual(JSON.parse(JSON.stringify(legacy.preparation)),tasks);
 const expected={listings:st.getItem(B.STORE),costs:st.getItem(B.COSTS),preparation:st.getItem(A.KEY)};
 for(const failAt of [1,2,3,4,5]){const target=storage(Object.fromEntries(st.map)),write=target.setItem;let count=0;target.setItem=(k,v)=>{if(++count===failAt)throw Error('quota');write(k,v)};assert.throws(()=>B.apply(p,target,expected));for(const [key,value] of st.map)assert.equal(target.getItem(key),value)}
 B.apply(legacy,st,expected);assert.deepEqual(JSON.parse(st.getItem(A.KEY)),tasks);assert.equal(JSON.parse(st.getItem(B.STORE)).length,81);assert.deepEqual(JSON.parse(st.getItem(B.RECOVERY)).purchasePreparation,tasks);
 st.setItem(A.KEY,'{}');assert.throws(()=>B.apply(p,st,expected),/başka sekmede/);
});
test('reject corrupt and prototype task data and render untrusted IDs safely',()=>{
 for(const value of [[],JSON.parse('{"__proto__":{}}'),{bike:{token:state('Yapılmadı')}},{bike:{price:{status:'done',updatedAt:'bad'}}}])assert.throws(()=>A.validate(value));
 const st=storage({[A.KEY]:'corrupt'});assert.throws(()=>A.save(st,'bike','price','Yapılmadı','corrupt'));assert.equal(st.getItem(A.KEY),'corrupt');assert.match(A.html(x,st),/disabled/);
 assert.ok(!A.html({...x,id:'"><script>alert(1)</script>'},storage()).includes('<script>'));
});
