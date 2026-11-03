/* MotorRadar 3.6: pure calculations; no network, migration or persistence. */
(function(root){
  'use strict';
  const analysis=typeof module!=='undefined'?require('./analysis.js'):root.MotorAnalysis;
  const validPrice=n=>Number.isFinite(n)&&n>0&&n<=1e9;
  function verifiedPrice(x){return validPrice(x.price)&&x.price===x.verifiedPrice&&typeof x.priceVerifiedAt==='string'&&Number.isFinite(Date.parse(x.priceVerifiedAt))&&Date.parse(x.priceVerifiedAt)<=Date.now()?x.price:null;}
  const active=x=>!['sold','removed','gave_up'].includes(x.status);
  const target=x=>['mt25:yamaha','r25:yamaha','duke250:ktm'].includes(analysis.identity(x));
  function missing(x,now=new Date().getFullYear()){
    const out=[];
    if(verifiedPrice(x)===null)out.push('Güncel fiyat kullanıcı tarafından doğrulanmalı');
    if(!Number.isInteger(x.year)||x.year<1950||x.year>now)out.push('Geçerli model yılı eksik');
    if(!Number.isInteger(x.km)||x.km<0||x.km>2e6)out.push('Geçerli kilometre eksik');
    if(!target(x))out.push('MT-25, R25 veya Duke 250 model bilgisi gerekli');
    return out;
  }
  const defaultWeights=Object.freeze({price:50,km:30,year:20});
  function validWeights(w){return !!w&&['price','km','year'].every(k=>Number.isFinite(w[k])&&w[k]>=0&&w[k]<=100)&&Math.abs(w.price+w.km+w.year-100)<1e-8;}
  const costFields=Object.freeze({insurance:'Zorunlu trafik sigortası',transfer:'Noter ve devir masrafı',inspection:'Ekspertiz',service:'İlk bakım',parts:'Lastik / zincir / fren gibi öngörülen giderler',other:'Diğer masraflar'});
  const checks=Object.freeze({chassis:'Şase ve şase numarası kontrolü',engine:'Motor ve şanzıman kontrolü',brakes:'Fren sistemi',suspension:'Ön maşa ve amortisör',tires:'Lastikler',chain:'Zincir ve dişli',electric:'Elektrik sistemi',accident:'Kaza / boya / değişen geçmişi',maintenance:'Bakım kayıtları',documents:'Ruhsat ve belge kontrolü'});
  const checkStates=Object.freeze(['Kontrol edilmedi','Sorunsuz','Sorun var']);
  function inspection(x){const saved=x.decision?.inspection;return {checks:Object.fromEntries(Object.keys(checks).map(k=>[k,checkStates.includes(saved?.checks?.[k])?saved.checks[k]:checkStates[0]])),notes:typeof saved?.notes==='string'?saved.notes:''};}
  function costs(x,limit=250000){
    const values={},invalid=[];
    for(const k of Object.keys(costFields)){const raw=x.decision?.costs?.[k];const n=raw===undefined||raw===''?0:raw;if(!Number.isFinite(n)||n<0||n>1e9)invalid.push(k);else values[k]=n;}
    const extras=invalid.length?null:Object.values(values).reduce((a,b)=>a+b,0),price=verifiedPrice(x);
    const total=price===null||extras===null?null:price+extras;
    return {values,invalid,extras,total,remaining:total===null?null:limit-total};
  }
  function leaders(rows){const scored=rows.filter(x=>x.score!==null);return scored.length?scored.filter(x=>Math.abs(x.score-scored[0].score)<1e-8):[];}
  function rank(records,now=new Date().getFullYear(),weights=defaultWeights){
    const candidates=records.filter(x=>active(x)&&target(x));
    const complete=candidates.filter(x=>!missing(x,now).length);
    // A single complete record is not a comparison.
    const range=key=>{const a=complete.map(x=>x[key]);return [Math.min(...a),Math.max(...a)];};
    const ranges={price:range('price'),year:range('year'),km:range('km')};
    const rows=candidates.map(record=>{
      const reasons=missing(record,now);if(!validWeights(weights))reasons.push('Ağırlıkların toplamı %100 olmalı');let components=null,score=null;
      if(!reasons.length&&complete.length<2)reasons.push('En az iki tam aday gerekli');
      if(!reasons.length){components={};for(const [key,weight] of [['price',weights.price],['year',weights.year],['km',weights.km]]){const [min,max]=ranges[key];components[key]=max===min?weight/2:weight*(key==='year'?(record[key]-min):(max-record[key]))/(max-min);}score=Object.values(components).reduce((a,b)=>a+b,0);}
      return {record,missing:reasons,components,score};
    });
    return rows.sort((a,b)=>(b.score??-1)-(a.score??-1)||String(a.record.id).localeCompare(String(b.record.id)));
  }
  function budget(records,limit=250000){const groups={within:[],over:[],unknown:[]};for(const x of records.filter(x=>active(x)&&target(x))){const p=verifiedPrice(x);groups[p===null?'unknown':p<=limit?'within':'over'].push(x);}return groups;}
  function drops(records){const events=new Map();for(const record of records)for(const e of record.gmailEvents||[]){if(e?.kind!=='price_drop'||!validPrice(e.oldPrice)||!validPrice(e.newPrice)||e.newPrice>=e.oldPrice||!Number.isFinite(Date.parse(e.observedAt)))continue;const key=[e.listingId||e.url||record.id,Date.parse(e.observedAt),e.oldPrice,e.newPrice].join('|');if(!events.has(key))events.set(key,{record,event:e});}return [...events.values()].sort((a,b)=>Date.parse(b.event.observedAt)-Date.parse(a.event.observedAt));}
  function differences(x,base){return {price:verifiedPrice(x)!==null&&verifiedPrice(base)!==null?x.price-base.price:null,year:Number.isInteger(x.year)&&Number.isInteger(base.year)?x.year-base.year:null,km:Number.isInteger(x.km)&&Number.isInteger(base.km)?x.km-base.km:null};}
  const api={defaultWeights,validWeights,costFields,checks,checkStates,inspection,costs,leaders,verifiedPrice,active,target,missing,rank,budget,drops,differences};if(typeof module!=='undefined')module.exports=api;else root.MotorSelector=api;
})(globalThis);
