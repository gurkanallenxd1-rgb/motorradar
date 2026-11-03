/* Pure, read-only research calculations. Unknown is never zero. */
(function(root){
 'use strict';
 const S=typeof module!=='undefined'?require('./selector.js'):root.MotorSelector;
 const amount=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e9;
 const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
 function current(s,at=today()) {return !!s&&date(s.verifiedAt)&&s.verifiedAt<=at&&date(s.validFrom)&&date(s.validTo)&&s.validFrom<=at&&at<=s.validTo&&s.access==='verified';}
 function validate(d){
  if(d?.schemaVersion!==1||!date(d.reviewedAt)||!Array.isArray(d.providers)||!Array.isArray(d.insurance?.rows))throw Error('Geçersiz kaynak verisi');
  for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers]){
   if(!s||!safeUrl(s.sourceUrl)||!date(s.checkedAt)||s.verifiedAt!==null&&!date(s.verifiedAt)||s.validFrom!==null&&!date(s.validFrom)||s.validTo!==null&&!date(s.validTo)||s.amount!==null&&!amount(s.amount))throw Error('Geçersiz kaynak kaydı');
  }
  if(!['www.resmigazete.gov.tr','resmigazete.gov.tr','www.gib.gov.tr','gib.gov.tr'].includes(new URL(d.notary.sourceUrl).hostname)||!['sbm.org.tr','www.sbm.org.tr'].includes(new URL(d.insurance.sourceUrl).hostname))throw Error('Resmî kaynak alan adı gerekli');
  if(d.notary.rate!==.002||d.notary.minimum!==1000)throw Error('Mevzuat değişikliği kod incelemesi gerektirir');
  const seen=new Set();for(const r of d.insurance.rows){const key=r.province+':'+r.step+':'+(r.vehicleClass||'motorcycle')+':'+(r.usageProfile||'private-other-no-disability');if(!Number.isInteger(r.province)||r.province<1||r.province>81||!Number.isInteger(r.step)||r.step<0||r.step>8||(!amount(r.amount)||r.amount<=0)||seen.has(key))throw Error('Geçersiz SBM satırı');if(r.sourceUrl&&(!safeUrl(r.sourceUrl)||!['sbm.org.tr','www.sbm.org.tr','mkt.sbm.org.tr'].includes(new URL(r.sourceUrl).hostname)||!date(r.validFrom)||!date(r.validTo)||!date(r.verifiedAt)||r.validFrom>r.validTo||!['motorcycle','cargo-motorcycle'].includes(r.vehicleClass)||!['private-other-no-disability','corporate-other-no-disability','private-electric-no-disability'].includes(r.usageProfile)))throw Error('Geçersiz SBM satır kaynağı veya profili');seen.add(key)}
  if(d.providers.some(p=>p.motorcycleVerified!==true||!p.id||!p.location||!p.scope)||new Set(d.providers.map(p=>p.id)).size!==d.providers.length)throw Error('Doğrulanmış motosiklet hizmeti gerekli');
  return d;
 }
 function notary(price,p,d,at=today()){
  if(!current(d?.notary,at)||at.slice(0,4)!=='2026'||!['used-sale','first-registration'].includes(p.transaction||'used-sale'))return null;
  if(p.transaction!=='first-registration'&&p.authorizedBuyer===true)return 0;
  return amount(price)&&price>0?Math.max(1000,Math.round(price*.002*100)/100):null;
 }
 function cap(p,d,at=today()){
  const s=d?.insurance,r=p.province!==undefined&&p.province!==''&&p.step!==undefined&&p.step!==''?s?.rows.find(r=>r.province===Number(p.province)&&r.step===Number(p.step)&&(r.vehicleClass||'motorcycle')===(p.vehicleClass||'motorcycle')&&(r.usageProfile||'private-other-no-disability')===(p.usageProfile||'private-other-no-disability')):undefined;
  return {amount:r?.amount??null,current:current(s,at)&&(!r?.sourceUrl||(r.validFrom===s.validFrom&&r.validTo===s.validTo&&current({...s,...r},at))),source:r?.sourceUrl?{...s,...r}:s};
 }
 function calculate(x,p={},d=null,budget=250000,at=today()){
  const lines=[],add=(key,label,value,status,source=null,note='')=>lines.push({key,label,amount:amount(value)?value:null,status:amount(value)?status:'unknown',source,note});
  add('sale','Doğrulanmış satış fiyatı',S.verifiedPrice(x),'confirmed',null,x.priceVerifiedAt||'');
  add('duty','Satış / devir harcı',notary(S.verifiedPrice(x),p,d,at),'confirmed',d?.notary,'Harç matrahı kasko değerinin altında olamaz; noterle teyit edin.');
  const documentNeeded=p.registrationRequired==='no'||p.registrationRequired==='unknown'?false:p.registrationRequired==='yes'?true:['used-sale','first-registration'].includes(p.transaction||'used-sale');
  for(const [key,label,src] of [['notaryService','Noter işlem bedeli',d?.notaryService],['registration','Ruhsat / tescil belgesi',d?.registration]]){
   const applicable=key!=='registration'||documentNeeded;
   const sourced=key==='registration'&&p.registrationRequired==='no'?0:applicable&&current(src,at)?src.amount:null;
   const manual=amount(p[key])&&p[key+'Source']!==true;
   add(key,label,manual?p[key]:sourced,manual?'estimated':'confirmed',src,manual?'Kullanıcı senaryosu':key==='registration'&&!documentNeeded?(p.registrationRequired==='no'?'Belge düzenlenmiyor; bedel uygulanmadı':'Belge düzenleme ihtiyacı bilinmiyor'):src?.reason);
  }
  const insurance=cap(p,d,at);
  add('insurance',p.insuranceMode==='quote'?'Kullanıcının aldığı gerçek sigorta teklifi':'SBM resmî tavan primi · teklif değildir',p.insuranceMode==='quote'?(p.quoteApproved===true&&date(p.quoteDate)&&p.quoteDate<=at?p.insuranceQuote:null):(insurance.current?insurance.amount:null),'estimated',p.insuranceMode==='quote'?null:insurance.source,p.insuranceMode==='quote'?(date(p.quoteDate)?'Teklif tarihi: '+p.quoteDate:'Teklif tarihi eksik'):(insurance.current?'Gerçek prim farklı olabilir':'Tarife güncel değil / doğrulanamadı'));
  const provider=d?.providers.find(s=>s.id===p.providerId);
  add('inspection','Seçili motosiklet ekspertizi',p.providerId==='custom'?p.inspectionQuote:provider&&(!date(provider.validTo)||provider.validTo>=at)&&(!date(provider.validFrom)||provider.validFrom<=at)?provider.amount:null,'estimated',provider,provider?'Yayımlanmış fiyat, teyit gerekli. '+provider.reason:'Kullanıcının seçtiği firma / teklif');
  for(const [key,label] of [['service','İlk bakım'],['parts','Lastik / zincir / fren'],['other','Diğer masraflar']]){
   const approved=p[key+'Approved']===true;
   add(key,label,approved?p[key]:null,'estimated',null,approved?'Kullanıcı onaylı bütçe gideri':'Kullanıcı onayı gerekli; gerek yoksa 0 girip onaylayın');
  }
  const unknown=lines.filter(l=>l.amount===null),known=lines.filter(l=>l.amount!==null),subtotal=known.reduce((s,l)=>s+Math.round(l.amount*100),0)/100,extras=known.filter(l=>l.key!=='sale').reduce((s,l)=>s+Math.round(l.amount*100),0)/100;
  const estimated=known.some(l=>l.status==='estimated'),total=unknown.length?null:subtotal;
  return {known:known.filter(l=>l.status==='confirmed'),estimates:known.filter(l=>l.status==='estimated'),partialRemaining:(Math.round(budget*100)-Math.round(subtotal*100))/100,lines,unknown,subtotal,extras,total,remaining:total===null?null:(Math.round(budget*100)-Math.round(total*100))/100,estimated,label:unknown.length?'Eksik kalemli ara toplam':estimated?'Tahmini senaryo toplamı':'Kesinleşen toplam',insurance};
 }
 const api={amount,date,today,safeUrl,current,validate,notary,cap,calculate};if(typeof module!=='undefined')module.exports=api;else root.MotorPurchaseCosts=api;
})(globalThis);
