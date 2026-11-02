/* URL-only helpers: never request a listing page. */
(function(root){
  'use strict';
  function sahibinden(value){
    try{
      const u=new URL(value.trim());
      if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||!['sahibinden.com','www.sahibinden.com','m.sahibinden.com'].includes(u.hostname))return null;
      const match=u.pathname.match(/^\/ilan\/(?:([a-z0-9-]+)-)?([1-9][0-9]{5,14})\/detay\/?$/i);
      if(!match)return null;
      return {id:match[2],url:'https://www.sahibinden.com'+u.pathname.replace(/\/$/,''),slug:match[1]||''};
    }catch{return null;}
  }
  const models=[['Yamaha MT-25',/\byamaha-mt-?25\b/],['Yamaha R25',/\byamaha-r-?25\b/],['KTM Duke 250',/\bktm-(?:duke-250|250-duke)\b/],['Bajaj Dominar 250',/\bbajaj-dominar-250\b/],['CFMOTO 250NK',/\bcfmoto-250-?nk\b/],['Honda CBR250R',/\bhonda-cbr-?250-?r\b/],['Suzuki GSX250R',/\bsuzuki-gsx-?250-?r\b/]];
  function suggestion(value){const p=sahibinden(value);if(!p)return '';const hits=models.filter(([,pattern])=>pattern.test(p.slug.toLowerCase()));return hits.length===1?hits[0][0]:'';}
  function key(value){const p=sahibinden(value);if(p)return 'sahibinden:'+p.id;try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))return '';u.hash='';return u.href;}catch{return '';}}
  const api={sahibinden,suggestion,key};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ListingURL=api;
})(typeof globalThis!=='undefined'?globalThis:this);
