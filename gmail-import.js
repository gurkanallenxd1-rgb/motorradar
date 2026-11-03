/* MotorRadar 3.0: local-only, non-destructive Gmail JSON event importer. */
(function(root) {
  'use strict';
  const isPrice = n => Number.isInteger(n) && n > 0 && n <= 1000000000;
  const isKm = n => Number.isInteger(n) && n >= 0 && n <= 2000000;
  const text = (s,max) => typeof s === 'string' ? s.slice(0,max).trim() : '';
  const validISO = s => typeof s === 'string' && !Number.isNaN(Date.parse(s)) &&
    Date.parse(s) <= Date.now() + 86400000 && Date.parse(s) >= Date.UTC(2000,0,1);
  function parseLink(url) {
    if (root.ListingURL && typeof root.ListingURL.parseLink === 'function')
      return root.ListingURL.parseLink(url);
    if (typeof require === 'function') return require('./listing-url.js').parseLink(url);
    return null;
  }
  const eventKey = e => [e.kind,e.url,e.observedAt,e.oldPrice,e.newPrice,e.price].join('|');
  function read(source) {
    const data = typeof source === 'string' ? JSON.parse(source) : source;
    if (!data || data.app !== 'MotorRadar-Gmail' || data.version !== 2 ||
        !Array.isArray(data.events) || data.events.length > 2000)
      throw Error('Yalnızca MotorRadar Gmail v2 olay dosyası kabul edilir.');
    const unique = new Map();
    let ignored=0;
    for (const x of data.events) {
      const parsed = x && parseLink(x.url);
      if (!parsed || !validISO(x.observedAt) ||
          !['price_drop','new_listing'].includes(x.kind)) {ignored++;continue;}
      const price = isPrice(x.price) ? x.price : null;
      const oldPrice = isPrice(x.oldPrice) ? x.oldPrice : null;
      const newPrice = isPrice(x.newPrice) ? x.newPrice : null;
      if (x.kind === 'price_drop' &&
         (newPrice === null || oldPrice === null || newPrice >= oldPrice ||
          price !== newPrice)) {ignored++;continue;}
      const event = {
        kind:x.kind, url:parsed.url, listingId:parsed.listingId || null,
        observedAt:x.observedAt, price, oldPrice:x.kind==='price_drop'?oldPrice:null,
        newPrice:x.kind==='price_drop'?newPrice:null,
        title:text(x.title,130),model:text(x.model,55),brand:text(x.brand,55),
        year:Number.isInteger(x.year)&&x.year>=1950&&x.year<=new Date().getFullYear()+1?x.year:null,
        km:isKm(x.km)?x.km:null, provider:parsed.url.includes('arabam.com')?'Arabam':'Sahibinden'
      };
      unique.set(eventKey(event),event);
    }
    return {events:[...unique.values()].sort((a,b)=>a.observedAt.localeCompare(b.observedAt)),
      ignored};
  }
  function sameListing(record,event) {
    const a=parseLink(record.url), b=parseLink(event.url);
    if (!a || !b) return false;
    if (a.key === b.key) return true;
    // Explicit IDs only: never infer a short URL from its opaque code.
    const idA=a.listingId || (a.short && /^\d{6,15}$/.test(record.listingId||'')?record.listingId:null);
    return Boolean(idA && event.listingId && idA===event.listingId);
  }
  function preview(records,imported) {
    const groups=new Map(),existingIds=new Set();
    for(const e of imported.events) {
      const found=records.find(r=>sameListing(r,e));
      if(found) {existingIds.add(found.id);const key='existing:'+found.id;
        if(!groups.has(key))groups.set(key,{existing:found,events:[]});
        groups.get(key).events.push(e);
      } else {
        const key=e.listingId?'id:'+e.listingId:'url:'+e.url;
        if(!groups.has(key))groups.set(key,{existing:null,events:[]});
        groups.get(key).events.push(e);
      }
    }
    const entries=[...groups.values()];
    return {entries, newCount:entries.filter(g=>!g.existing).length,
      updateCount:existingIds.size, ignored:imported.ignored};
  }
  function apply(records,prepared,generateId=()=>crypto.randomUUID()) {
    const copy=records.map(x=>({...x,history:[...x.history]}));
    const processed=new Set(),added=[];
    for(const g of prepared.entries) {
      let target=g.existing?copy.find(x=>x.id===g.existing.id):null;
      const newest=g.events[g.events.length-1];
      const previous=Array.isArray(target?.gmailEvents)?target.gmailEvents:[];
      const events=new Map();
      for(const e of [...previous,...g.events]) {
        if(e && e.url && e.observedAt && e.kind)events.set(eventKey(e),e);
      }
      const saved=[...events.values()]
        .sort((a,b)=>a.observedAt.localeCompare(b.observedAt)).slice(-100);
      if(target) {target.gmailEvents=saved;processed.add(target.id);continue;}
      target = {
        id:generateId(),title:newest.title||newest.model||'Gmail ilan bildirimi',
        brand:newest.brand,model:newest.model,year:newest.year,km:newest.km,
        price:null,city:'',listingId:newest.listingId||'',
        url:newest.url,notes:'',description:'',
        createdAt:new Date().toISOString(),history:[],
        status:'unknown',lastCheckedAt:null,favorite:false,gmailEvents:saved
      };
      copy.unshift(target);added.push(target);
    }
    return {items:copy,added:added.length,updated:processed.size};
  }
  const api={read,preview,apply,sameListing,eventKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MotorGmailImport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
