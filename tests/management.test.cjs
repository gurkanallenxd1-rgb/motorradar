const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const original={id:'legacy',title:'Eski',model:'Yamaha R25',year:2023,km:10000,price:240000,url:'https://m.sahibinden.com/ilan/eski-1234567890/detay',notes:'Not',createdAt:'2026-01-01',history:[{price:240000,at:'2026-01-01'}],custom:'preserve'};
function app(records=[original]){const els={};const events={};let stored=JSON.stringify(records),fail=false;const alerts=[];const confirmations=[];let accepted=true;const element=id=>els[id]??=( {value:['modelFilter','sourceFilter','statusFilter'].includes(id)?'all':'',checked:false,files:[],addEventListener(t,f){events[id+':'+t]=f},showModal(){this.open=true},close(){this.open=false},reset(){for(const k in els)if(k.startsWith('f'))els[k].value=''},querySelector(){return element("saveButton")},append(){}} );
 const extraStorage=new Map();
 const context={MotorPurchaseAssistant:require('../purchase-assistant.js'),MotorBackup:require('../backup.js'),MotorPurchaseCosts:require('../purchase-costs.js'),MotorCostResearch:{reloadPreferences(){}},ListingURL:require('../listing-url.js'),MotorSelector:require('../selector.js'),MotorListingQuality:require('../listing-quality.js'),document:{getElementById:element,querySelectorAll:()=>[],createElement:()=>({click(){},remove(){}}),body:{append(){}}},localStorage:{getItem:k=>k==='motorradar-v1'?stored:extraStorage.get(k)??null,setItem:(k,v)=>{if(fail)throw Error();if(k==='motorradar-v1')stored=v;else extraStorage.set(k,v)},removeItem:k=>extraStorage.delete(k)},navigator:{},crypto:{randomUUID:()=> 'new'},alert:x=>alerts.push(x),confirm:message=>{confirmations.push(message);return accepted},console,Intl,URL,Blob,Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-11-03T12:00:00Z']))}static now(){return Date.parse('2026-11-03T12:00:00Z')}},window:{},setTimeout};
 vm.runInNewContext(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],context);
 element('bulkStatus');return {els,events,alerts,confirmations,accept:value=>accepted=value,data:()=>JSON.parse(stored),fail:()=>fail=true,submit:()=>events['listingForm:submit']({preventDefault(){}})};
}

const count=a=>(a.els.cards.innerHTML.match(/<article /g)||[]).length;
const select=(a,id,checked=true,key='bulk')=>a.events['cards:change']({target:{dataset:{[key]:id},checked}});
const apply=(a,status)=>{a.els.bulkStatus.value=status;a.els.applyBulk.onclick()};
const records=()=>Array.from({length:40},(_,i)=>({...original,id:'id'+i,title:'Kullanıcı başlığı '+i,status:'unknown',lastCheckedAt:null,favorite:i%2===0,gmailEvents:[{kind:'new_listing',price:250000,observedAt:'2026-01-01'}],custom:{nested:['koru']}}));
test('all five bulk states preserve every other field across forty records',()=>{
 for(const status of ['following','unknown','sold','removed','gave_up']){
  const xs=records(),a=app(xs);a.els.selectVisible.onclick();assert.equal(a.els.bulkCount.textContent,40);apply(a,status);
  assert.equal(a.confirmations.length,1);assert.match(a.confirmations[0],/40 ilanın/);assert.equal(a.data().length,40);
  a.data().forEach((x,i)=>assert.deepEqual(x,{...xs[i],status}));assert.equal(a.els.bulkCount.textContent,0);
 }
});
test('visible selection uses combined filters, hidden selections remain explicit, compare independent',()=>{
 const a=app(records());select(a,'id0',true,'choose');select(a,'id1',true,'choose');select(a,'id2',true,'choose');
 a.els.search.value='başlığı 3';a.els.search.oninput();assert.equal(count(a),11);a.els.selectVisible.onclick();assert.equal(a.els.bulkCount.textContent,11);
 a.els.search.value='başlığı 0';a.els.search.oninput();a.els.selectVisible.onclick();assert.equal(a.els.bulkCount.textContent,12);
 apply(a,'sold');assert.match(a.confirmations[0],/12 ilanın/);assert.equal(a.data().filter(x=>x.status==='sold').length,12);assert.equal(a.els.selectedCount.textContent,3);
 a.els.selectVisible.onclick();a.els.clearBulk.onclick();assert.equal(a.els.bulkCount.textContent,0);assert.equal(a.els.selectedCount.textContent,3);
});
test('cancel and localStorage failure preserve all data and selection; retry succeeds',()=>{
 const xs=records(),a=app(xs);a.els.selectVisible.onclick();a.accept(false);apply(a,'removed');assert.deepEqual(a.data(),xs);assert.equal(a.els.bulkCount.textContent,40);
 a.accept(true);a.fail();apply(a,'sold');assert.deepEqual(a.data(),xs);assert.equal(a.els.bulkCount.textContent,40);assert.match(a.els.cards.innerHTML,/Kullanıcı başlığı/);
 a.els.statusFilter.value='sold';a.els.statusFilter.onchange();assert.equal(count(a),0);a.els.clearBulk.onclick();assert.equal(a.els.bulkCount.textContent,0);
});
test('invalid status or empty selection never writes or requests confirmation',()=>{
 const a=app();apply(a,'sold');assert.equal(a.confirmations.length,0);select(a,'legacy');apply(a,'delete');assert.equal(a.confirmations.length,0);assert.deepEqual(a.data(),[original]);
});
test('missing fields, unchecked and terminal filters combine with existing filters and reset',()=>{
 const xs=[{...original,id:'missing',model:'',year:null,price:null,km:null,status:'unknown'}, {...original,id:'zero',km:0,lastCheckedAt:'2026-01-02',status:'sold'}, {...original,id:'removed',status:'removed'}, {...original,id:'gave',status:'gave_up'}];
 const a=app(xs);
 for(const id of ['unknownPriceOnly','unknownYearOnly','unknownKmOnly','unknownModelOnly']){a.els[id].checked=true;a.els[id].onchange();assert.equal(count(a),1)}
 a.els.minKm.value='0';a.els.minKm.oninput();assert.equal(count(a),0);a.els.resetFilters.onclick();assert.equal(count(a),2);
 a.els.uncheckedOnly.checked=true;a.els.uncheckedOnly.onchange();assert.equal(count(a),2);a.els.hideClosed.checked=true;a.els.hideClosed.onchange();assert.equal(count(a),2);
 a.els.sourceFilter.value='gmail';a.els.sourceFilter.onchange();assert.equal(count(a),0);a.els.resetFilters.onclick();assert.equal(count(a),2);
});
test('dashboard counts whole collection and keeps historical Gmail prices separate',()=>{
 const a=app([{...original,status:'unknown',price:null,history:[],gmailEvents:[{kind:'new_listing',price:250000,observedAt:'2026-01-01'}]}, {...original,id:'sold',status:'sold',lastCheckedAt:'2026-01-02'}, {...original,id:'removed',status:'removed',gmailEvents:[{kind:'new_listing',price:200000,observedAt:'2026-01-01'},{kind:'price_drop',newPrice:null,observedAt:'2026-02-01'}]}]);
 assert.equal(a.els.countStat.textContent,'3');assert.equal(a.els.unknownStat.textContent,'1');assert.equal(a.els.uncheckedStat.textContent,'2');assert.equal(a.els.closedStat.textContent,'2');assert.equal(a.els.pricedStat.textContent,'2');assert.equal(a.els.gmailBudgetStat.textContent,'1');
 a.els.search.value='no match';a.els.search.oninput();assert.equal(count(a),0);assert.equal(a.els.gmailBudgetStat.textContent,'1');
});
test('2.5, 3.0, 3.1 and 3.2 backups preserve metadata through restore and bulk edits',async()=>{
 for(const version of ['2.5','3.0','3.1','3.2']){
  const a=app(),xs=[{...records()[0],url:''}];await a.els.importFile.onchange({target:{files:[{size:100,text:async()=>JSON.stringify({app:'MotorRadar',version,listings:xs})}],value:'backup'}});a.els.beforeImportBackup.onclick();a.els.backupConsent.checked=true;a.els.backupConsent.onchange();a.els.applyBackup.onclick();
  a.els.selectVisible.onclick();apply(a,'removed');assert.deepEqual(a.data(),[{...original,favorite:false,status:'removed',lastCheckedAt:null},...xs.map(x=>({...x,status:'removed'}))]);
 }
});
test('checking a listing records date without changing status, price or Gmail history',()=>{
 const a=app(records());a.events['cards:click']({target:{closest:selector=>selector==='[data-checked]'?{dataset:{checked:'id0'}}:null}});
 const [x]=a.data();assert.ok(x.lastCheckedAt);assert.deepEqual({...x,lastCheckedAt:null},records()[0]);
});

test('single and bulk terminal changes archive immediately; archive controls stay in sync',()=>{
 const a=app(records());a.events['cards:change']({target:{dataset:{status:'id0'},value:'sold'}});assert.equal(count(a),39);
 a.els.showArchive.checked=true;a.els.showArchive.onchange();assert.equal(count(a),40);assert.equal(a.els.hideClosed.checked,false);
 assert.match(a.els.cards.innerHTML,/Tekrar takip et/);
 a.events['cards:click']({target:{closest:selector=>selector==='[data-follow]'?{dataset:{follow:'id0'}}:null}});
 a.els.hideClosed.checked=true;a.els.hideClosed.onchange();assert.equal(a.els.showArchive.checked,false);assert.equal(count(a),40);
 a.els.selectVisible.onclick();apply(a,'removed');assert.equal(count(a),0);assert.equal(a.data().length,40);
 a.els.statusFilter.value='removed';a.els.statusFilter.onchange();assert.equal(count(a),40);assert.equal(a.els.showArchive.checked,true);
 a.els.resetFilters.onclick();assert.equal(count(a),0);assert.equal(a.els.hideClosed.checked,true);
});
