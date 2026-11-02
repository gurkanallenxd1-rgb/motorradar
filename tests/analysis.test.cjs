const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../analysis.js');
const record=(id,overrides={})=>({id,title:id,model:'Yamaha MT-25',year:2023,km:15000,price:200000,...overrides});
const target=record('target');
const peers=[record('a',{price:180000}),record('b',{price:220000}),record('c',{price:240000})];
test('median, signed TL / percent, annual km, exact explainable weighted score',()=>{
 const a=A.analyze(target,[target,...peers],2026);
 assert.equal(a.median,220000);assert.equal(a.delta,-20000);assert.equal(a.percent,-20000/220000*100);
 assert.equal(a.annualKm,5000);assert.equal(a.peers.length,3);assert.equal(a.score,55);
 assert.deepEqual(a.components,{price:50+100*20000/220000,usage:50,year:50});
 assert.equal(A.median([2,100,3,4]),3.5);assert.equal(A.median([]),null);
});
test('three OTHER eligible records required; wrong model, year, price and duplicates excluded',()=>{
 const rows=[target,...peers.slice(0,2),record('r25',{model:'Yamaha R25'}),record('old',{year:2021}),record('bad',{price:null}),peers[0]];
 const a=A.analyze(target,rows,2026);assert.equal(a.peers.length,2);assert.equal(a.median,null);assert.equal(a.score,null);
 assert.equal(a.excluded.length,5);
 assert.equal(A.analyze(target,[...peers,record('near',{year:2024})],2026).peers.length,4);
});
test('canonical models and other manufacturers, no substring cross-model matches',()=>{
 for(const [one,two] of [[{model:'MT 25'},{model:'MT-25',brand:'Yamaha'}],[{model:'R25'},{model:'Yamaha R-25'}],[{model:'KTM Duke 250'},{model:'250 Duke'}],[{model:'Honda CB 500 F'},{brand:'Honda',model:'CB500F'}]])assert.equal(A.identity(one),A.identity(two));
 assert.notEqual(A.identity({model:'MT25'}),A.identity({model:'R25'}));
 assert.equal(A.identity({model:'MT25',brand:'Honda'}),null);
 assert.equal(A.identity({model:'Unknown 500'}),null);
 assert.notEqual(A.identity({model:'500',brand:'Honda'}),A.identity({model:'500',brand:'Suzuki'}));
});
test('missing / invalid fields never silently become zero or produce a score',()=>{
 for(const change of [{price:null},{price:NaN},{price:0},{year:null},{year:2027},{year:2023.5},{km:null},{km:-1},{km:Infinity},{model:''}])assert.equal(A.analyze({...target,...change},peers,2026).score,null,JSON.stringify(change));
 const a=A.analyze(target,[...peers.slice(0,2),record('c',{km:null,price:240000})],2026);assert.equal(a.median,220000);assert.equal(a.score,null);
 assert.equal(A.annual({...target,year:2026},2026),15000);
 assert.equal(A.annual({...target,year:2027},2026),null);
});
test('zero mileage, extreme values and even medians are deterministic and bounded',()=>{
 const rows=[record('a',{km:0}),record('b',{km:0}),record('c',{km:0})];
 assert.equal(A.analyze({...target,km:0},rows,2026).components.usage,50);
 assert.equal(A.analyze(target,rows,2026).components.usage,0);
 for(const price of [1,1e9]){const score=A.analyze({...target,price},peers,2026).score;assert.ok(score>=0&&score<=100);}
 const a=A.analyze(target,[...peers,record('d',{price:260000})],2026);assert.equal(a.median,230000);
});
test('text flags preserve denials and evidence; never alter score or mutate source records',()=>{
 const x={...target,notes:'Hasar yok. Boyasız, değişen yok; tramer 0. Bakımları serviste.',description:'Boya var. <img src=x onerror=alert(1)>'};
 const before=JSON.stringify([x,...peers]);const a=A.analyze(x,peers,2026);
 for(const topic of ['Hasar','Boya','Değişen','Tramer','Bakım'])assert.ok(a.mentions.some(m=>m.topic===topic));
 assert.ok(a.mentions.some(m=>m.text==='Hasar yok.'));assert.ok(a.mentions.some(m=>m.field==='description'));
 assert.equal(a.score,A.analyze(target,peers,2026).score);assert.equal(JSON.stringify([x,...peers]),before);
});
test('verified listing identity callback removes aliases and repeated imported records',()=>{
 const same=(a,b)=>a.id===b.id||Boolean(a.listingId&&a.listingId===b.listingId);
 const a=A.analyze({...target,listingId:'123'},[record('alias',{listingId:'123'}),...peers,record('again',{listingId:'456'}),record('again2',{listingId:'456'})],2026,same);
 assert.equal(a.peers.length,4);assert.equal(a.excluded.length,2);
});
