/* URL-only helpers: never request or resolve a listing page. */
(function(root){
'use strict';
const parseLink=value=>{
      if(typeof value!=='string'||!value.trim())return null;
      const raw=value.trim();
      if(!/^https:\/\//i.test(raw)||/[\\\s\u0000-\u001f\u007f]/.test(raw))return null;
      try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
        const authority=raw.slice(raw.indexOf('://')+3).split(/[/?#]/)[0];
        if(authority.toLowerCase()!==u.hostname)return null;
        // Check the literal path too: URL parsing must not hide dot segments or encoded slashes.
        const path=raw.slice(raw.indexOf('://')+3).replace(/^[^/]*(?=\/|$)/,'').split(/[?#]/)[0];
        if(path!==u.pathname||/%|(?:^|\/)\.\.?(?:\/|$)/.test(path))return null;
        let listingId=null;
        if(u.hostname==='shbd.io'){if(!/^\/s\/[A-Za-z0-9]+\/?$/.test(path))return null;}
        else if(['sahibinden.com','www.sahibinden.com','m.sahibinden.com'].includes(u.hostname)){
          const match=path.match(/^\/ilan\/(?:([a-zA-Z0-9-]+)-)?([1-9][0-9]{5,14})\/detay\/?$/);if(!match)return null;listingId=match[2];u.hostname='www.sahibinden.com';
        }else if(['arabam.com','www.arabam.com'].includes(u.hostname)){
          if(!/^\/ilan\/[a-zA-Z0-9/_-]+$/.test(path))return null;
        }else return null;
        u.search='';u.hash='';u.pathname=path.replace(/\/$/,'');
        return {url:u.href,key:u.href.replace('https://www.','https://'),listingId,short:u.hostname==='shbd.io'};
      }catch{return null}
    };
function sahibinden(value){const p=parseLink(value);if(!p||p.short||!p.listingId)return null;const match=new URL(p.url).pathname.match(/^\/ilan\/(?:([a-z0-9-]+)-)?[1-9][0-9]{5,14}\/detay$/i);return {id:p.listingId,url:p.url,slug:match?.[1]||''}}
  const models=[['Yamaha MT-25',/\byamaha-mt-?25\b/],['Yamaha R25',/\byamaha-r-?25\b/],['KTM Duke 250',/\bktm-(?:duke-250|250-duke)\b/],['Bajaj Dominar 250',/\bbajaj-dominar-250\b/],['CFMOTO 250NK',/\bcfmoto-250-?nk\b/],['Honda CBR250R',/\bhonda-cbr-?250-?r\b/],['Suzuki GSX250R',/\bsuzuki-gsx-?250-?r\b/]];
  function suggestion(value){const p=sahibinden(value);if(!p)return '';const hits=models.filter(([,pattern])=>pattern.test(p.slug.toLowerCase()));return hits.length===1?hits[0][0]:'';}

function key(value){const p=parseLink(value);return p?(p.listingId?'sahibinden:'+p.listingId:p.key):''}
const api={parseLink,sahibinden,suggestion,key};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ListingURL=api;
})(typeof globalThis!=='undefined'?globalThis:this);
