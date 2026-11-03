const test=require('node:test');
const assert=require('node:assert/strict');
const importer=require('../gmail-import.js');
const url='https://www.sahibinden.com/ilan/yamaha-mt-25-1339016365/detay';
const now='2026-10-06T10:00:00.000Z';
const event={kind:'price_drop',url,listingId:'1339016365',oldPrice:243000,newPrice:242000,price:242000,observedAt:now,title:'Acil satılık mt25',brand:'Yamaha',model:'Yamaha MT-25',km:null,year:null};
const doc={app:'MotorRadar-Gmail',version:2,events:[event]};
test('reject legacy and unrelated documents',()=>{
  assert.throws(()=>importer.read({app:'MotorRadar-Gmail',version:1,listings:[]}));
  assert.throws(()=>importer.read({app:'MotorRadar',version:'2.5',listings:[]}));
});
test('accept valid event and remove duplicates',()=>{
  const x=importer.read({...doc,events:[event,event]});
  assert.equal(x.events.length,1);
  assert.equal(x.events[0].newPrice,242000);
});
test('do not accept forged price drop or foreign URL',()=>{
  const v=importer.read({...doc,events:[{...event,newPrice:244000,price:244000},
   {...event,url:'https://example.com/evil'}]});
  assert.equal(v.events.length,0);
  assert.equal(v.ignored,2);
});
test('import new listing without asserting historical email price is CURRENT',()=>{
  const result=importer.apply([],importer.preview([],importer.read(doc)),()=> 'imported-one');
  assert.equal(result.added,1);
  assert.equal(result.items[0].status,'unknown');
  assert.equal(result.items[0].price,null);
  assert.deepEqual(result.items[0].history,[]);
  assert.equal(result.items[0].gmailEvents[0].newPrice,242000);
  assert.equal(result.items[0].listingId,'1339016365');
});
test('match same long URL / explicit listing id, do not overwrite manual fields',()=>{
  const user={id:'local',url,listingId:'1339016365',title:'My MT',price:250000,year:2023,km:17000,
    favorite:true,notes:'Expert inspected',status:'sold',history:[{price:250000,at:now}]};
  const input=importer.preview([user],importer.read(doc));
  assert.equal(input.updateCount,1);
  const merged=importer.apply([user],input);
  assert.equal(merged.added,0);
  assert.equal(merged.updated,1);
  assert.equal(merged.items[0].price,250000);
  assert.equal(merged.items[0].status,'sold');
  assert.equal(merged.items[0].favorite,true);
  assert.equal(merged.items[0].notes,'Expert inspected');
  assert.equal(merged.items[0].history.length,1);
  const second=importer.apply(merged.items,importer.preview(merged.items,importer.read(doc)));
  assert.equal(second.items[0].gmailEvents.length,1);
});
