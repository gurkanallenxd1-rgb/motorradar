/* MotorRadar 3.5: pure calculations; no network, migration or persistence. */
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
  function rank(records,now=new Date().getFullYear()){
    const candidates=records.filter(x=>active(x)&&target(x));
    const complete=candidates.filter(x=>!missing(x,now).length);
    // A single complete record is not a comparison.
    const range=key=>{const a=complete.map(x=>x[key]);return [Math.min(...a),Math.max(...a)];};
    const ranges={price:range('price'),year:range('year'),km:range('km')};
    const rows=candidates.map(record=>{
      const reasons=missing(record,now);let components=null,score=null;
      if(!reasons.length&&complete.length<2)reasons.push('En az iki tam aday gerekli');
      if(!reasons.length){components={};for(const [key,weight] of [['price',50],['year',20],['km',30]]){const [min,max]=ranges[key];components[key]=max===min?weight/2:weight*(key==='year'?(record[key]-min):(max-record[key]))/(max-min);}score=Object.values(components).reduce((a,b)=>a+b,0);}
      return {record,missing:reasons,components,score};
    });
    return rows.sort((a,b)=>(b.score??-1)-(a.score??-1)||String(a.record.id).localeCompare(String(b.record.id)));
  }
  function budget(records,limit=250000){const groups={within:[],over:[],unknown:[]};for(const x of records.filter(x=>active(x)&&target(x))){const p=verifiedPrice(x);groups[p===null?'unknown':p<=limit?'within':'over'].push(x);}return groups;}
  function drops(records){const events=new Map();for(const record of records)for(const e of record.gmailEvents||[]){if(e?.kind!=='price_drop'||!validPrice(e.oldPrice)||!validPrice(e.newPrice)||e.newPrice>=e.oldPrice||!Number.isFinite(Date.parse(e.observedAt)))continue;const key=[e.listingId||e.url||record.id,Date.parse(e.observedAt),e.oldPrice,e.newPrice].join('|');if(!events.has(key))events.set(key,{record,event:e});}return [...events.values()].sort((a,b)=>Date.parse(b.event.observedAt)-Date.parse(a.event.observedAt));}
  function differences(x,base){return {price:verifiedPrice(x)!==null&&verifiedPrice(base)!==null?x.price-base.price:null,year:Number.isInteger(x.year)&&Number.isInteger(base.year)?x.year-base.year:null,km:Number.isInteger(x.km)&&Number.isInteger(base.km)?x.km-base.km:null};}
  const api={verifiedPrice,active,target,missing,rank,budget,drops,differences};if(typeof module!=='undefined')module.exports=api;else root.MotorSelector=api;
})(globalThis);
