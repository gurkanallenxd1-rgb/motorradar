/* Pure, local calculations. No network or persistence. */
(function(root){
  'use strict';
  const normalize=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');
  const aliases={mt25:['mt25','yamaha'],r25:['r25','yamaha'],duke250:['duke250','ktm'],'250duke':['duke250','ktm']};
  function identity(x){
    let model=normalize(x.model),brand=normalize(x.brand);
    for(const b of ['yamaha','ktm','honda','bajaj','cfmoto','suzuki','kawasaki','bmw'])if(model.startsWith(b)){if(brand&&brand!==b)return null;brand=b;model=model.slice(b.length);break;}
    if(!model)return null;
    const a=aliases[model];if(a){if(brand&&brand!==a[1])return null;return a.join(':');}
    return brand?model+':'+brand:null; // Unknown models require an explicit manufacturer.
  }
  const price=n=>Number.isFinite(n)&&n>0;
  const year=(n,now)=>Number.isInteger(n)&&n>=1950&&n<=now;
  const km=n=>Number.isFinite(n)&&n>=0;
  function median(xs){const a=[...xs].sort((a,b)=>a-b),i=Math.floor(a.length/2);return a.length?(a.length%2?a[i]:(a[i-1]+a[i])/2):null;}
  function annual(x,now){return year(x.year,now)&&km(x.km)?x.km/Math.max(1,now-x.year):null;}
  function mentions(x){
    const rules=[['Hasar',/hasar\w*|kaza\w*/],['Boya',/boya\w*/],['Değişen',/degis\w*/],['Tramer',/tramer\w*/],['Bakım',/bakim\w*|servis\w*/]];
    return ['description','notes'].flatMap(field=>{const raw=typeof x[field]==='string'?x[field]:'';return raw.split(/\n|(?<=[.!?])\s+/).flatMap(text=>{const t=text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');return rules.filter(([,re])=>re.test(t)).map(([topic])=>({field,topic,text}));});});
  }
  function analyze(target,records,now=new Date().getFullYear(),sameListing=(a,b)=>a.id===b.id){
    const model=identity(target),peers=[],excluded=[];
    for(const x of records){
      let reason='';
      if(sameListing(target,x))reason='İncelenen ilan / aynı ilan';
      else if(!model||identity(x)!==model)reason='Model / marka eşleşmiyor veya belirsiz';
      else if(!year(target.year,now)||!year(x.year,now)||Math.abs(x.year-target.year)>1)reason='Model yılı eksik, geçersiz veya ±1 yıl dışında';
      else if(!price(x.price))reason='Geçerli fiyat yok';
      else if(peers.some(p=>sameListing(p,x)))reason='Tekrarlanan ilan';
      if(reason)excluded.push({record:x,reason});else peers.push(x);
    }
    const enough=peers.length>=3,mid=enough?median(peers.map(x=>x.price)):null;
    const delta=mid!==null&&price(target.price)?target.price-mid:null;
    const annualKm=annual(target,now),missing=[];
    if(!enough)missing.push('En az 3 uygun karşılaştırma ilanı gerekli');
    if(!price(target.price))missing.push('İlan fiyatı eksik veya geçersiz');
    if(!model)missing.push('Model / marka belirsiz');
    if(annualKm===null)missing.push('Geçerli model yılı ve kilometre gerekli');
    if(peers.some(x=>annual(x,now)===null))missing.push('Karşılaştırma ilanlarında kilometre eksik');
    const medianAnnual=enough&&peers.every(x=>annual(x,now)!==null)?median(peers.map(x=>annual(x,now))):null;
    const clamp=n=>Math.max(0,Math.min(100,n));
    let components=null,score=null;
    if(!missing.length){
      components={price:clamp(50-100*delta/mid),usage:medianAnnual===0?(annualKm===0?50:0):clamp(50-50*(annualKm-medianAnnual)/medianAnnual),year:clamp(50+25*(target.year-median(peers.map(x=>x.year))))};
      score=Math.round(.6*components.price+.25*components.usage+.15*components.year);
    }
    return {now,model,peers,excluded,median:mid,delta,percent:delta===null?null:100*delta/mid,annualKm,medianAnnual,mentions:mentions(target),missing,components,score};
  }
  const api={identity,median,annual,mentions,analyze};if(typeof module!=='undefined')module.exports=api;else root.MotorAnalysis=api;
})(globalThis);
