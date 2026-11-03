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
 // Only a current, applicable transaction fee may be offered for adoption.
 function sourceFee(key,p,d,at=today()){
  const src=d?.[key];
  if(!current(src,at))return null;
  if(key==='registration'){
   if(p.registrationRequired==='no')return 0;
   if(p.registrationRequired==='unknown'||(!p.registrationRequired&&!['used-sale','first-registration'].includes(p.transaction||'used-sale')))return null;
  }else if(key!=='notaryService'||!Array.isArray(src.transactions)||!src.transactions.includes(p.transaction||'used-sale'))return null;
  return amount(src.amount)?src.amount:null;
 }
 const sourceStates={official:['§','Resmî kaynaktan hesaplandı'],manual:['✎','Kullanıcı tarafından girildi'],quote:['✓','Kullanıcı tarafından doğrulanmış gerçek teklif'],published:['◇','Sağlayıcının yayımladığı fiyat; teyit gerekli'],unknown:['?','Bilinmiyor veya güncelliğini kaybetmiş']};
 function calculate(x,p={},d=null,budget=250000,at=today()){
  const lines=[],add=(key,label,value,status,source=null,note='',origin=null)=>lines.push({key,label,amount:amount(value)?value:null,status:amount(value)?status:'unknown',source,note,origin:amount(value)?(origin||(status==='confirmed'?(source?'official':'manual'):'manual')):'unknown'});
  add('sale','Doğrulanmış satış fiyatı',S.verifiedPrice(x),'confirmed',null,x.priceVerifiedAt||'');
  add('duty','Satış / devir harcı',notary(S.verifiedPrice(x),p,d,at),'confirmed',d?.notary,'Harç matrahı kasko değerinin altında olamaz; noterle teyit edin.');
  for(const [key,label,src] of [['notaryService','Noter işlem bedeli',d?.notaryService],['registration','Ruhsat / tescil belgesi',d?.registration]]){
   const sourced=sourceFee(key,p,d,at),manual=amount(p[key])&&p[key+'Source']!==true;
   const accepted=p[key+'SourceAmount'];
   // A refreshed source cannot silently replace a previously accepted amount.
   const value=manual?p[key]:amount(accepted)&&accepted!==sourced?null:sourced;
   add(key,label,value,manual?'estimated':'confirmed',src,manual?'Kullanıcı senaryosu':sourced===null?'Kaynak güncel değil veya işlem kapsamı bilinmiyor':key==='registration'&&sourced===0?'Belge düzenlenmiyor; bedel uygulanmadı':amount(accepted)&&accepted!==sourced?'Kaynak tutarı değişti; yeniden onay gerekli':src?.reason,manual?'manual':'official');
  }
  const insurance=cap(p,d,at);
  const validQuote=p.insuranceMode==='quote'&&p.quoteApproved===true&&date(p.quoteDate)&&p.quoteDate<=at;
  add('insurance','Kullanıcının aldığı gerçek sigorta teklifi',validQuote?p.insuranceQuote:null,'estimated',null,date(p.quoteDate)?'Teklif tarihi: '+p.quoteDate+' · kullanıcı onayı '+(p.quoteApproved?'var':'gerekli'):'Teklif tarihi ve kullanıcı onayı gerekli','quote');
  const provider=d?.providers.find(s=>s.id===p.providerId);
  const packageAmount=provider&&(!date(provider.validTo)||provider.validTo>=at)&&(!date(provider.validFrom)||provider.validFrom<=at)?provider.amount:null;
  const inspectionConfirmed=p.providerQuoteId===p.providerId&&!!p.providerId&&p.providerQuoteApproved===true&&date(p.providerQuoteDate)&&p.providerQuoteDate<=at&&amount(p.providerQuote);
  add('inspection','Seçili motosiklet ekspertizi',inspectionConfirmed?p.providerQuote:p.providerId==='custom'?p.inspectionQuote:packageAmount,'estimated',provider,inspectionConfirmed?'Teklif tarihi: '+p.providerQuoteDate+' · seçili firma için kullanıcı onaylı gerçek teklif':provider?'Yayımlanmış fiyat, teyit gerekli. Randevu öncesi fiyat ve hizmet kapsamını teyit edin. '+provider.reason:'Farklı firma için manuel tutar; doğrulanmış teklif onayı yok',inspectionConfirmed?'quote':provider?'published':'manual');
  for(const [key,label] of [['service','İlk bakım'],['parts','Lastik / zincir / fren'],['other','Diğer masraflar']]){
   const approved=p[key+'Approved']===true;
   add(key,label,approved?p[key]:null,'estimated',null,approved?'Kullanıcı onaylı bütçe gideri':'Kullanıcı onayı gerekli; gerek yoksa 0 girip onaylayın');
  }
  const unknown=lines.filter(l=>l.amount===null),known=lines.filter(l=>l.amount!==null),subtotal=known.reduce((s,l)=>s+Math.round(l.amount*100),0)/100,extras=known.filter(l=>l.key!=='sale').reduce((s,l)=>s+Math.round(l.amount*100),0)/100;
  const estimated=known.some(l=>l.status==='estimated'),total=unknown.length?null:subtotal;
  return {known:known.filter(l=>l.status==='confirmed'),estimates:known.filter(l=>l.status==='estimated'),manual:known.filter(l=>l.origin==='manual'),motorMissing:lines[0].amount===null,partialRemaining:lines[0].amount===null?null:(Math.round(budget*100)-Math.round(subtotal*100))/100,lines,unknown,subtotal,extras,total,remaining:total===null?null:(Math.round(budget*100)-Math.round(total*100))/100,estimated,label:unknown.length?'Eksik kalemli ara toplam':estimated?'Tahmini senaryo toplamı':'Kesinleşen toplam',insurance};
 }
 // Legacy records are read-only evidence, never implicit approvals or budget inputs.
 const legacyTargets={service:'service',parts:'parts',other:'other',insurance:'insuranceQuote',inspection:'inspectionQuote'};
 function expenseState(p,key){return !amount(p[key])?'Girilmedi':p[key+'Approved']===true?'Onaylı · bütçeye dahil':'Tutar mevcut, onay gerekli';}
 function legacyRows(x,p,d,budget,at=today()){
  const c=calculate(x,p,d,budget,at);
  return Object.entries(S.costFields).filter(([key])=>Object.hasOwn(x.decision?.costs||{},key)).map(([key,label])=>{
   const old=x.decision.costs[key],line=c.lines.find(l=>l.key===key);
   const draft=['service','parts','other'].includes(key)&&amount(p[key]),value=draft?p[key]:line?.amount??null;
   return {key,label,old:amount(old)?old:null,value,budgetValue:line?.amount??null,origin:draft?'manual':line?.origin||'unknown',target:legacyTargets[key]||null,difference:amount(old)&&amount(value)?Math.round((value-old)*100)/100:null};
  });
 }
 function legacyTransfer(x,p,key,consent=false){
  const value=x.decision?.costs?.[key];
  if(consent!==true||!Object.hasOwn(legacyTargets,key)||!amount(value))throw Error('Geçerli kalem ve açık aktarım onayı gerekli');
  // An old default zero and an old price are not proof of user approval.
  if(['service','parts','other'].includes(key))return {...p,[key]:value,[key+'Approved']:false};
  if(key==='insurance')return {...p,insuranceMode:'quote',insuranceQuote:value,quoteApproved:false,quoteDate:''};
  return {...p,providerId:'custom',inspectionQuote:value,providerQuoteApproved:false};
 }
 const api={expenseState,legacyRows,legacyTransfer,sourceFee,sourceStates,amount,date,today,safeUrl,current,validate,notary,cap,calculate};if(typeof module!=='undefined')module.exports=api;else root.MotorPurchaseCosts=api;
})(globalThis);
