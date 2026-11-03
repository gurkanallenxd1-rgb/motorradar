const {test}=require('node:test');const assert=require('node:assert/strict');const S=require('../selector.js');
const rec=(id,patch={})=>({id,model:'Yamaha MT-25',price:200000,verifiedPrice:200000,priceVerifiedAt:'2026-01-01',year:2024,km:10000,status:'following',history:[],...patch});
test('default retains 3.5 scoring; custom weights reverse preference and invalid totals refuse scores',()=>{
 const xs=[rec('cheap',{km:20000,year:2023}),rec('new',{price:250000,verifiedPrice:250000,km:0,year:2025})];
 assert.deepEqual(S.rank(xs,2026),S.rank(xs,2026,{price:50,km:30,year:20}));
 assert.equal(S.rank(xs,2026,{price:100,km:0,year:0})[0].record.id,'cheap');
 assert.equal(S.rank(xs,2026,{price:0,km:0,year:100})[0].record.id,'new');
 for(const w of [{price:10,km:20,year:30},{price:NaN,km:30,year:20},{price:-1,km:81,year:20}]){assert.equal(S.validWeights(w),false);assert.ok(S.rank(xs,2026,w).every(x=>x.score===null))}
});
test('ties keep both leaders; missing zero-weight criterion still refuses invented scores; over budget retained',()=>{
 const xs=[rec('a'),rec('b'),rec('missing',{year:null}),rec('legacy',{priceVerifiedAt:undefined})];
 const rows=S.rank(xs,2026);assert.equal(S.leaders(rows).length,2);assert.equal(rows[0].score,50);
 assert.equal(S.rank(xs,2026,{price:100,km:0,year:0}).find(x=>x.record.id==='missing').score,null);
 assert.equal(S.rank([rec('over',{price:300000,verifiedPrice:300000}),rec('a')],2026).length,2);
 assert.equal(rows.find(x=>x.record.id==='legacy').score,null);
});
test('costs use verified price, preserve separate listing expenses, reject invalid inputs and never mutate',()=>{
 const a=rec('a',{decision:{costs:{insurance:3000,transfer:1000,inspection:500,service:2000,parts:2500,other:1000}}}),b=rec('b');const before=JSON.stringify(a);
 assert.equal(S.costs(a).total,210000);assert.equal(S.costs(a).remaining,40000);assert.equal(S.costs(a,205000).remaining,-5000);assert.equal(S.costs(b).total,200000);
 assert.equal(S.costs(rec('legacy',{priceVerifiedAt:null})).total,null);
 for(const value of [-1,Infinity,'200',NaN])assert.equal(S.costs(rec('invalid',{decision:{costs:{other:value}}})).total,null);
 assert.equal(JSON.stringify(a),before);assert.equal(S.costs(JSON.parse(JSON.stringify(a))).total,210000);
});
test('inspection starts unchecked, accepts only user states, preserves notes and round trips in old backup shape',()=>{
 const legacy=rec('legacy');assert.ok(Object.values(S.inspection(legacy).checks).every(v=>v==='Kontrol edilmedi'));assert.equal(legacy.decision,undefined);
 for(const state of S.checkStates){const x=rec('x',{decision:{inspection:{checks:{chassis:state},notes:'Şaseyi kontrol ettir'}}});const restored=JSON.parse(JSON.stringify({app:'MotorRadar',version:'3.1',listings:[x]})).listings[0];assert.equal(S.inspection(restored).checks.chassis,state);assert.equal(S.inspection(restored).notes,'Şaseyi kontrol ettir')}
 assert.equal(S.inspection(rec('bad',{decision:{inspection:{checks:{chassis:'otomatik iyi'}}}})).checks.chassis,'Kontrol edilmedi');
});
