/* MotorRadar 3.1: display formatting and explicit, non-destructive Gmail cleanup.
 * Never guesses price, kilometre, year, current listing status or live availability.
 */
(function (root) {
  'use strict';
  const clean=s=>String(s??'').trim();
  const fold=s=>clean(s).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  const parseLink=url=>{
    if(root.ListingURL?.parseLink)return root.ListingURL.parseLink(url);
    if(typeof module!=='undefined'&&module.exports) return require('./listing-url.js').parseLink(url);
    return null;
  };
  function inferredModel(x) {
    const link=parseLink(x?.url);
    if(!link || !link.url)return null;
    const path=new URL(link.url).pathname.toLowerCase();
    // Only unambiguous, explicitly stated model names in the URL slug.
    const identity=[
      ['Yamaha','Yamaha MT-25',/(?:^|[-_/])mt[-_]?25(?:[-_/]|$)/],
      ['Yamaha','Yamaha R25',/(?:^|[-_/])r[-_]?25(?:[-_/]|$)/],
      ['KTM','KTM Duke 250',/(?:^|[-_/])(?:duke[-_]?250|250[-_]?duke)(?:[-_/]|$)/]
    ];
    for(const [brand,model,re] of identity) if(re.test(path)) {
      // Don't overwrite an explicitly different known manufacturer.
      const b=fold(x?.brand);
      if(b && b!==fold(brand))return null;
      return {brand,model};
    }
    return null;
  }
  function modelLabel(x) {
    const brand=clean(x?.brand),model=clean(x?.model);
    if(!model)return brand||'Model bilinmiyor';
    if(brand && (fold(model)===fold(brand) || fold(model).startsWith(fold(brand)+' ')))return model;
    return [brand,model].filter(Boolean).join(' ');
  }
  function isBadTitle(title) {
    const s=clean(title);
    return !s || /^<?https?:\/\/|^e-posta ilan bildirimi$/i.test(s) ||
      /^motor ilani\s*[·\-]\s*gmail bildirimi$/i.test(fold(s));
  }
  function titleLabel(x) {
    const title=clean(x?.title);
    if(!isBadTitle(title))return title;
    const inferred=inferredModel(x);
    const model=clean(x?.model)||inferred?.model;
    const id=parseLink(x?.url)?.listingId||(/^\d{6,15}$/.test(String(x?.listingId||''))?String(x.listingId):'');
    return (model||'Gmail ilanı')+(id?' · #'+id:'');
  }
  function latestEvent(x) {
    const events=Array.isArray(x?.gmailEvents)?x.gmailEvents.filter(e=>
      e&&typeof e.observedAt==='string'&&!Number.isNaN(Date.parse(e.observedAt))):[];
    return events.reduce((latest,e)=>!latest||Date.parse(e.observedAt)>Date.parse(latest.observedAt)?e:latest,null);
  }
  function isGmail(x) {return Array.isArray(x?.gmailEvents)&&x.gmailEvents.length>0;}
  function matches(x,scope,status) {
    if(scope==='gmail'&&!isGmail(x))return false;
    if(scope==='manual'&&isGmail(x))return false;
    if(status!=='all'&&x.status!==status)return false;
    return true;
  }
  function cleanup(records) {
    let changed=0,titleFixed=0,modelFixed=0;
    const examples=[];
    const items=records.map(x=>{
      if(!isGmail(x))return x;
      let patched={}, inferred=inferredModel(x);
      if(!clean(x.model)&&inferred) {
        patched.model=inferred.model;
        if(!clean(x.brand))patched.brand=inferred.brand;
        modelFixed++;
      }
      if(isBadTitle(x.title)){
        const after=titleLabel({...x,...patched});
        if(after!==x.title){patched.title=after;titleFixed++;}
      }
      if(Object.keys(patched).length){
        changed++;
        if(examples.length<8)examples.push({before:titleLabel({...x,title:x.title}),
          after:patched.title||x.title,model:patched.model||x.model||'Bilinmiyor'});
        return {...x,...patched};
      }
      return x;
    });
    return {items,changed,titleFixed,modelFixed,examples};
  }
  const api={inferredModel,modelLabel,titleLabel,latestEvent,isGmail,matches,cleanup};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MotorListingQuality=api;
})(typeof globalThis!=='undefined'?globalThis:this);
