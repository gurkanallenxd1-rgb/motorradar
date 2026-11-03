const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const original={id:'legacy',title:'Eski',model:'Yamaha R25',year:2023,km:10000,price:240000,url:'https://m.sahibinden.com/ilan/eski-1234567890/detay',notes:'Not',createdAt:'2026-01-01',history:[{price:240000,at:'2026-01-01'}],custom:'preserve'};
function app(records=[original]){const els={};const events={};let stored=JSON.stringify(records),fail=false;const alerts=[];const element=id=>els[id]??=( {value:['modelFilter','sourceFilter','statusFilter'].includes(id)?'all':'',checked:false,files:[],addEventListener(t,f){events[id+':'+t]=f},showModal(){this.open=true},close(){this.open=false},reset(){for(const k in els)if(k.startsWith('f'))els[k].value=''},querySelector(){return element("saveButton")},append(){}} );
 const context={ListingURL:require('../listing-url.js'),MotorListingQuality:require('../listing-quality.js'),document:{getElementById:element,querySelectorAll:()=>[]},localStorage:{getItem:()=>stored,setItem:(k,v)=>{if(fail)throw Error();assert.equal(k,'motorradar-v1');stored=v}},navigator:{},crypto:{randomUUID:()=> 'new'},alert:x=>alerts.push(x),confirm:()=>true,console,Intl,URL,Blob,window:{},setTimeout};
 vm.runInNewContext(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],context);
 return {els,events,alerts,data:()=>JSON.parse(stored),fail:()=>fail=true,submit:()=>events['listingForm:submit']({preventDefault(){}})};
}

const clickFavorite=(a,id)=>a.events['cards:click']({target:{closest:selector=>selector==='[data-favorite]'?{dataset:{favorite:id}}:null}});
test('favorite defaults false, persists, survives edit and failed storage rolls back',()=>{
 const a=app();assert.match(a.els.cards.innerHTML,/aria-pressed="false"/);clickFavorite(a,'legacy');assert.equal(a.data()[0].favorite,true);assert.deepEqual(a.data()[0].history,original.history);assert.equal(a.data()[0].custom,'preserve');
 a.els.addBtn.onclick();a.els.editId.value='legacy';for(const [k,v] of Object.entries({fTitle:'Edited',fModel:original.model,fYear:'2023',fKm:'10000',fPrice:'240000',fUrl:original.url,fBrand:'',fCity:'',fNotes:'',fDescription:'',fListingId:''}))a.els[k].value=v;a.submit();assert.equal(a.data()[0].favorite,true);assert.deepEqual(a.data()[0].history,original.history);
 const b=app(a.data());assert.match(b.els.cards.innerHTML,/aria-pressed="true"/);b.fail();clickFavorite(b,'legacy');b.els.favoritesOnly.checked=true;b.els.favoritesOnly.onchange();assert.match(b.els.cards.innerHTML,/Edited/);
});
test('inclusive independent price/km bounds, unknowns, combined filters and reset preserve sorting',()=>{
 const a=app([original,{...original,id:'unknown',title:'Unknown',price:null,km:null,history:[]},{...original,id:'other',title:'Other',price:300000,km:20000,favorite:true}]);
 const count=()=> (a.els.cards.innerHTML.match(/<article /g)||[]).length;
 assert.equal(count(),3);a.els.maxPrice.value='240000';a.els.maxPrice.oninput();assert.equal(count(),1);a.els.minPrice.value='240000';a.els.minPrice.oninput();assert.equal(count(),1);a.els.minKm.value='10001';a.els.minKm.oninput();assert.equal(count(),0);
 a.els.maxPrice.value='';a.els.minPrice.value='';a.els.minKm.value='0';a.els.maxKm.value='0';a.els.maxKm.oninput();assert.equal(count(),0);
 a.els.sort.value='expensive';a.els.favoritesOnly.checked=true;a.els.search.value='Other';a.els.modelFilter.value=original.model;a.els.budgetOnly.checked=true;a.els.resetFilters.onclick();assert.equal(count(),3);assert.equal(a.els.sort.value,'expensive');assert.ok(a.els.cards.innerHTML.indexOf('Other')<a.els.cards.innerHTML.indexOf('Eski'));
 a.els.favoritesOnly.checked=true;a.els.favoritesOnly.onchange();assert.equal(count(),1);clickFavorite(a,'other');assert.equal(count(),0);
});
test('legacy and favorite JSON restore keep history and extra fields',async()=>{
 const a=app();const records=[original,{...original,id:'fav',url:'',favorite:true}];await a.els.importFile.onchange({target:{files:[{size:100,text:async()=>JSON.stringify({app:'MotorRadar',version:1,listings:records})}],value:'backup'}});
 assert.equal(a.data()[0].favorite,false);assert.equal(a.data()[1].favorite,true);assert.deepEqual(a.data()[0].history,original.history);assert.equal(a.data()[0].custom,'preserve');
});
