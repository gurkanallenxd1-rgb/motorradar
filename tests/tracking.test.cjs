const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const original={id:'legacy',title:'Eski',model:'Yamaha R25',year:2023,km:10000,price:240000,url:'https://m.sahibinden.com/ilan/eski-1234567890/detay',notes:'Not',createdAt:'2026-01-01',history:[{price:240000,at:'2026-01-01'}],custom:'preserve'};
function app(records=[original]){const els={};const events={};let stored=JSON.stringify(records),fail=false;const alerts=[];const element=id=>els[id]??=( {value:['modelFilter','sourceFilter','statusFilter'].includes(id)?'all':'',checked:false,files:[],addEventListener(t,f){events[id+':'+t]=f},showModal(){this.open=true},close(){this.open=false},reset(){for(const k in els)if(k.startsWith('f'))els[k].value=''},querySelector(){return element("saveButton")},append(){}} );
 const context={ListingURL:require('../listing-url.js'),MotorSelector:require('../selector.js'),MotorListingQuality:require('../listing-quality.js'),document:{getElementById:element,querySelectorAll:()=>[]},localStorage:{getItem:()=>stored,setItem:(k,v)=>{if(fail)throw Error();assert.equal(k,'motorradar-v1');stored=v}},navigator:{},crypto:{randomUUID:()=> 'new'},alert:x=>alerts.push(x),confirm:()=>true,console,Intl,URL,Blob,Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-11-03T12:00:00Z']))}static now(){return Date.parse('2026-11-03T12:00:00Z')}},window:{},setTimeout};
 vm.runInNewContext(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],context);
 return {els,events,alerts,data:()=>JSON.parse(stored),fail:()=>fail=true,submit:()=>events['listingForm:submit']({preventDefault(){}})};
}

const click=(a,key,id='legacy')=>a.events['cards:click']({target:{closest:selector=>selector===`[data-${key}]`?{dataset:{[key]:id}}:null}});
const status=(a,value,id='legacy')=>a.events['cards:change']({target:{dataset:{status:id},value}});
const quick=(a,value)=>{click(a,'price');a.els.quickPrice.value=value;a.events['quickPriceForm:submit']({preventDefault(){}})};
const warnings=a=>(a.els.cards.innerHTML.match(/Kontrol zamanı:/g)||[]).length;
test('legacy defaults, exact seven day boundary, terminal states and invalid dates',()=>{
 const at='2026-10-27T12:00:00Z';
 const a=app([{...original,createdAt:at},{...original,id:'fresh',lastCheckedAt:'2026-10-27T12:00:00.001Z'},...['sold','removed','gave_up'].map(status=>({...original,id:status,status})),{...original,id:'invalid',createdAt:'bad',lastCheckedAt:'bad',status:'unknown'}]);
 assert.equal(warnings(a),1);assert.match(a.els.cards.innerHTML,/Henüz kontrol edilmedi/);
 click(a,'checked');assert.equal(a.data()[0].status,'following');assert.equal(a.data()[0].lastCheckedAt,'2026-11-03T12:00:00.000Z');assert.equal(warnings(a),0);assert.deepEqual(a.data()[0].history,original.history);assert.equal(a.data()[0].custom,'preserve');
});
test('status changes persist and checks/quick prices never implicitly change status',()=>{
 const a=app();for(const value of ['sold','removed','gave_up','following']){status(a,value);assert.equal(a.data()[0].status,value);assert.equal(warnings(a),value==='following'?1:0)}
 status(a,'sold');click(a,'checked');quick(a,'230000');assert.equal(a.data()[0].status,'sold');assert.equal(a.data()[0].lastCheckedAt,'2026-11-03T12:00:00.000Z');
});
test('quick prices share history rules, reject invalid values and preserve metadata',()=>{
 const a=app([{...original,favorite:true}]);quick(a,'240000');assert.deepEqual(a.data()[0].history,original.history);
 quick(a,'230000');assert.equal(a.data()[0].price,230000);assert.equal(a.data()[0].history.length,2);assert.equal(a.data()[0].history[1].price,230000);assert.equal(a.data()[0].favorite,true);assert.equal(a.data()[0].lastCheckedAt,null);assert.equal(a.data()[0].custom,'preserve');
 quick(a,'230000');assert.equal(a.data()[0].history.length,2);quick(a,'250000');assert.equal(a.data()[0].history.length,3);
 for(const value of ['', '0','-1','NaN','Infinity','1000000001']){quick(a,value);assert.equal(a.data()[0].price,250000);assert.equal(a.data()[0].history.length,3)}
 const b=app([{...original,price:null,history:[]}]);quick(b,'200000');assert.equal(b.data()[0].history.length,1);
});
test('failed status, check and price saves roll back and keep dialog open',()=>{
 const a=app();a.fail();status(a,'sold');assert.equal(warnings(a),1);click(a,'checked');assert.equal(warnings(a),1);quick(a,'220000');assert.equal(a.els.priceDialog.open,true);assert.deepEqual(a.data()[0],original);assert.match(a.els.cards.innerHTML,/240.000/);
});
test('old and new JSON backups round trip without losing history or extra fields',async()=>{
 const a=app();const records=[original,{...original,id:'new',url:'',status:'gave_up',lastCheckedAt:'2026-10-20T12:00:00Z',favorite:true}];
 const restore=async listings=>a.els.importFile.onchange({target:{files:[{size:100,text:async()=>JSON.stringify({app:'MotorRadar',version:'2.5',listings})}],value:'backup'}});
 await restore(records);assert.equal(a.data()[0].status,'following');assert.equal(a.data()[0].lastCheckedAt,null);assert.equal(a.data()[1].status,'gave_up');assert.equal(a.data()[1].lastCheckedAt,records[1].lastCheckedAt);assert.deepEqual(a.data()[0].history,original.history);assert.equal(a.data()[0].custom,'preserve');const saved=a.data();await restore(saved);assert.deepEqual(a.data(),saved);
});
