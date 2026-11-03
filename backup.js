/* JSON backups never access IndexedDB. Restore merges and keeps a durable recovery copy. */
(function(root){
 'use strict';
 const COSTS='motorradar-costs-v37',STORE='motorradar-v1',RECOVERY='motorradar-pre-import-v371',PENDING='motorradar-import-pending-v371';
 const unsafe=k=>['__proto__','prototype','constructor'].includes(k);
 const numbers=new Set(['insuranceQuote','inspectionQuote','notaryService','registration','service','parts','other']);
 const bools=new Set(['authorizedBuyer','serviceApproved','partsApproved','otherApproved']);
 const choices={transaction:['used-sale','first-registration','other'],insuranceMode:['cap','quote'],vehicleClass:['motorcycle','cargo-motorcycle'],usageProfile:['private-other-no-disability','corporate-other-no-disability','private-electric-no-disability']};
 function scenarios(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>10000)throw Error('Geçersiz masraf senaryoları');
  const out=Object.create(null);
  for(const [id,p] of Object.entries(value)){
   if(!id||id.length>200||unsafe(id)||!p||typeof p!=='object'||Array.isArray(p))throw Error('Geçersiz senaryo');
   for(const [k,v] of Object.entries(p)){
    if(numbers.has(k)){if(v!==null&&!(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9))throw Error('Geçersiz gider');}
    else if(bools.has(k)){if(typeof v!=='boolean')throw Error('Geçersiz onay');}
    else if(choices[k]){if(!choices[k].includes(v))throw Error('Geçersiz seçim');}
    else if(k==='province'||k==='step'){if(v!==''&&!(String(Number(v))===String(v)&&Number.isInteger(Number(v))&&Number(v)>=(k==='step'?0:1)&&Number(v)<=(k==='step'?8:81)))throw Error('Geçersiz il/basamak');}
    else if(k==='quoteDate'){if(v!==''&&!root.MotorPurchaseCosts?.date(v)&&!(typeof module!=='undefined'&&require('./purchase-costs.js').date(v)))throw Error('Geçersiz tarih');}
    else if(k==='providerId'){if(typeof v!=='string'||v.length>150||unsafe(v))throw Error('Geçersiz sağlayıcı');}
    else throw Error('Bilinmeyen senaryo alanı');
   }
   out[id]={...p};
  }
  return out;
 }
 function snapshot(listings,storage){return {app:'MotorRadar',version:'3.7.1-beta',exportedAt:new Date().toISOString(),photosIncluded:false,listings,costScenarios:scenarios(JSON.parse(storage.getItem(COSTS)||'{}'))};}
 function preview(d,existing,costs,valid,duplicate){
  if(d?.app!=='MotorRadar'||!Array.isArray(d.listings)||d.listings.length>10000||!d.listings.every(valid))throw Error('Geçersiz yedek');
  const ids=new Set();for(const x of d.listings){if(!x.id||unsafe(x.id)||ids.has(x.id))throw Error('Tekrarlanan ilan');ids.add(x.id);}
  const merged=existing.map(x=>({...x}));let added=0,updated=0;
  for(const x of d.listings){const i=merged.findIndex(y=>y.id===x.id);if(merged.some(y=>y.id!==x.id&&duplicate(x,[y])))throw Error('Çakışan ilan bağlantısı');if(i<0){merged.push(x);added++}else{merged[i]={...merged[i],...x};updated++}}
  const incoming=Object.hasOwn(d,'costScenarios')?scenarios(d.costScenarios):null;
  const current=scenarios(costs);return {listings:merged,costs:incoming===null?current:Object.assign(Object.create(null),current,incoming),added,updated,kept:existing.length-updated,scenarioCount:incoming===null?0:Object.keys(incoming).length,legacy:incoming===null};
 }
 function apply(plan,storage,expected){
  const before={listings:storage.getItem(STORE),costs:storage.getItem(COSTS)};
  if(before.listings!==expected.listings||before.costs!==expected.costs)throw Error('Veriler başka sekmede değişti; önizlemeyi yeniden açın.');
  // A write failure here prevents any mutation. This copy also survives an interrupted tab.
  storage.setItem(RECOVERY,JSON.stringify({app:'MotorRadar',version:'3.7.1-beta',photosIncluded:false,exportedAt:new Date().toISOString(),listings:JSON.parse(before.listings||'[]'),costScenarios:JSON.parse(before.costs||'{}')}));
  storage.setItem(PENDING,JSON.stringify(before));
  try{storage.setItem(COSTS,JSON.stringify(plan.costs));storage.setItem(STORE,JSON.stringify(plan.listings));storage.removeItem(PENDING);}
  catch(error){try{recover(storage)}catch{}throw Error('Kaydedilemedi. İçe aktarma öncesi ayrı yedeği kullanın.');}
 }
 function recover(storage){const raw=storage.getItem(PENDING);if(!raw)return false;const b=JSON.parse(raw);if(!b||!Object.hasOwn(b,'listings')||!Object.hasOwn(b,'costs'))throw Error('Kurtarma verisi okunamadı');for(const [k,v] of [[COSTS,b.costs],[STORE,b.listings]])v===null?storage.removeItem(k):storage.setItem(k,v);storage.removeItem(PENDING);return true;}
 const api={recover,scenarios,snapshot,preview,apply,COSTS,STORE,RECOVERY,PENDING};if(typeof module!=='undefined')module.exports=api;else {root.MotorBackup=api;try{recover(localStorage)}catch{alert('Kesilen içe aktarma kurtarılamadı. İçe aktarma öncesi ayrı JSON yedeğinizi kullanın.')}}
})(globalThis);
