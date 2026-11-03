const test=require('node:test');
const assert=require('node:assert/strict');
const q=require('../listing-quality.js');
const url='https://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-acil-satilik-mt25-1338808674/detay';
function example(){
 return {id:'mail-1',url,listingId:'1338808674',title:'<http://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-acil-satilik-mt25-1338808674/detay/>',
 brand:'Yamaha',model:'',km:null,year:null,price:null,favorite:true,status:'unknown',notes:'User note',
 createdAt:'2026-11-03T01:00:00Z',history:[],gmailEvents:[
 {kind:'price_drop',oldPrice:280000,newPrice:273000,price:273000,observedAt:'2026-10-18T08:00:00Z'}]};
}
test('display normalizes redundant brand in model without mutating',()=>{
 const original={brand:'Yamaha',model:'Yamaha MT-25'};
 assert.equal(q.modelLabel(original),'Yamaha MT-25');
 assert.deepEqual(original,{brand:'Yamaha',model:'Yamaha MT-25'});
});
test('Gmail URL titles display as meaningful names before cleanup',()=>{
 const old=example();
 assert.equal(q.titleLabel(old),'Yamaha MT-25 · #1338808674');
 assert.equal(q.inferredModel(old).model,'Yamaha MT-25');
});
test('cleanup touches only Gmail-generated fields, preserving old data',()=>{
 const x=example(),manual={...x,id:'manual',gmailEvents:undefined};
 const result=q.cleanup([x,manual]);
 assert.equal(result.changed,1);
 assert.equal(result.titleFixed,1);
 assert.equal(result.modelFixed,1);
 assert.equal(result.items[0].title,'Yamaha MT-25 · #1338808674');
 assert.equal(result.items[0].model,'Yamaha MT-25');
 for(const key of ['price','km','year','notes','favorite','status','history','gmailEvents']){
   assert.deepEqual(result.items[0][key],x[key]);
 }
 assert.deepEqual(result.items[1],manual);
 const second=q.cleanup(result.items);
 assert.equal(second.changed,0);
});
test('unknown links and explicit differing manufacturer stay unguessed',()=>{
 assert.equal(q.inferredModel({...example(),url:'https://www.sahibinden.com/ilan/vasita-motosiklet-honda-cb250r-123456789/detay'}),null);
 assert.equal(q.inferredModel({...example(),brand:'Honda'}),null);
});
test('latest event does not rely on import array ordering',()=>{
 const x=example();
 x.gmailEvents.push({...x.gmailEvents[0],newPrice:285000,observedAt:'2026-11-01T12:00:00Z'});
 assert.equal(q.latestEvent(x).newPrice,285000);
 x.gmailEvents.reverse();
 assert.equal(q.latestEvent(x).newPrice,285000);
});
test('Gmail source and unknown status filtering is explicit',()=>{
 const x=example();
 assert.equal(q.matches(x,'gmail','unknown'),true);
 assert.equal(q.matches(x,'manual','unknown'),false);
 assert.equal(q.matches({...x,status:'sold'},'gmail','unknown'),false);
});

test('historical Gmail budget uses latest notification, not current price',()=>{
 const x=example();
 assert.equal(q.notificationPrice(x),273000);
 assert.equal(q.lastNotificationTime(x),Date.parse('2026-10-18T08:00:00Z'));
 x.gmailEvents.push({...x.gmailEvents[0],newPrice:235000,price:235000,observedAt:'2026-11-01T08:00:00Z'});
 assert.equal(q.notificationPrice(x),235000);
 assert.equal(x.price,null);
 const empty={...x,gmailEvents:[]};
 assert.equal(q.notificationPrice(empty),null);
 assert.equal(q.lastNotificationTime(empty),0);
});
