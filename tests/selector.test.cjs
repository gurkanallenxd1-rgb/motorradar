const {test}=require('node:test');const assert=require('node:assert/strict');const S=require('../selector.js');
const rec=(id,patch={})=>({id,model:'Yamaha MT-25',price:240000,verifiedPrice:240000,priceVerifiedAt:'2026-01-01',year:2024,km:10000,status:'following',...patch});
test('ranking excludes closed, refuses incomplete and legacy data, exposes additive contributions',()=>{
 const records=[rec('a'),rec('b',{model:'KTM Duke 250',price:250000,verifiedPrice:250000,km:20000,year:2023}),rec('legacy',{priceVerifiedAt:undefined}),rec('sold',{status:'sold'}),rec('removed',{status:'removed'}),rec('km',{km:null})];const before=JSON.stringify(records),rows=S.rank(records,2026);
 assert.deepEqual(rows.map(x=>x.record.id),['a','b','km','legacy']);assert.equal(rows[0].score,100);assert.equal(rows[1].score,0);assert.equal(rows[2].score,null);assert.equal(rows[3].score,null);assert.equal(JSON.stringify(records),before);
 assert.equal(S.rank([rec('one')])[0].score,null);
});
test('budget uses explicit matching verification, never Gmail or OCR price; boundary and changed price',()=>{
 const xs=[rec('equal',{price:250000,verifiedPrice:250000}),rec('over',{price:250001,verifiedPrice:250001}),rec('ocr',{priceVerifiedAt:null,priceSource:'screenshot'}),rec('changed',{price:230000}),rec('gmail',{price:null,gmailEvents:[{price:1}]})];const g=S.budget(xs);assert.equal(g.within.length,1);assert.equal(g.over.length,1);assert.equal(g.unknown.length,3);assert.equal(S.budget(xs,260000).within.length,2);
});
test('drops deduplicate timestamps and sort newest first without touching records',()=>{
 const e={kind:'price_drop',url:'https://example.com/1',observedAt:'2026-02-01',oldPrice:250000,newPrice:240000};const xs=[rec('a',{gmailEvents:[e,{...e}, {...e,observedAt:'2026-03-01'}]})];assert.equal(S.drops(xs).length,2);assert.equal(S.drops(xs)[0].event.observedAt,'2026-03-01');assert.equal(xs[0].gmailEvents.length,3);
});
test('comparison gives signed differences only when both prices are verified',()=>{assert.deepEqual(S.differences(rec('a',{year:2023,km:5000}),rec('b')),{price:0,year:-1,km:-5000});assert.equal(S.differences(rec('a',{priceVerifiedAt:null}),rec('b')).price,null)});
