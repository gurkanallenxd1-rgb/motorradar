/* Preparation is user-owned workflow data, never a mechanical reliability score. */
(function(root){
 'use strict';
 const S=typeof module!=='undefined'?require('./selector.js'):root.MotorSelector;
 const KEY='motorradar-preparation-v39';
 const tasks=Object.freeze({price:'Güncel ilan fiyatını doğrulama',insurance:'Trafik sigortası teklifi alma',documents:'Noter ve ruhsat masraflarını kontrol etme',inspection:'Bağımsız motosiklet ekspertizi yaptırma',history:'Şase, motor ve kaza geçmişini kontrol etme',maintenance:'Bakım geçmişini doğrulama',parts:'Lastik, zincir ve fren masraflarını değerlendirme'});
 const states=Object.freeze(['Yapılmadı','Devam ediyor','Tamamlandı','Sorun var']);
 const safe=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!['__proto__','constructor','prototype'].includes(id);
 function validate(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>10000)throw Error('Satın alma görev kayıtları okunamadı');
  const out=Object.create(null);
  for(const [id,record] of Object.entries(value)){
   if(!safe(id)||!record||typeof record!=='object'||Array.isArray(record))throw Error('Geçersiz görev kaydı');
   out[id]={};for(const [key,v] of Object.entries(record)){
    if(!Object.hasOwn(tasks,key)||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['status','updatedAt'].includes(k))||!states.includes(v.status)||typeof v.updatedAt!=='string'||!Number.isFinite(Date.parse(v.updatedAt)))throw Error('Geçersiz görev durumu');
    out[id][key]={status:v.status,updatedAt:v.updatedAt};
   }
  }return out;
 }
 const read=storage=>validate(JSON.parse(storage.getItem(KEY)||'{}'));
 function save(storage,id,key,status,expected){
  if(!safe(id)||!Object.hasOwn(tasks,key)||!states.includes(status))throw Error('Geçersiz görev');
  const raw=storage.getItem(KEY);if(raw!==expected)throw Error('Görevler başka sekmede değişti; yeniden deneyin.');
  const all=validate(JSON.parse(raw||'{}'));all[id]={...all[id],[key]:{status,updatedAt:new Date().toISOString()}};
  storage.setItem(KEY,JSON.stringify(all));return all;
 }
 function evaluate(x,records={},cost=null){
  const checks=S.inspection(x).checks,entry=records[x.id]||{},lines=cost?.lines||[];
  const line=key=>lines.find(l=>l.key===key),known=key=>Number.isFinite(line(key)?.amount);
  const problems=keys=>keys.filter(k=>checks[k]==='Sorun var');
  const incomplete=keys=>keys.some(k=>checks[k]==='Kontrol edilmedi');
  const history=['chassis','engine','accident'],wear=['tires','chain','brakes'];
  const hints={
   price:S.verifiedPrice(x)===null?'Güncel fiyat doğrulaması gerekli':'Doğrulama tarihi: '+x.priceVerifiedAt,
   insurance:known('insurance')&&line('insurance').origin==='quote'?'Kullanıcı onaylı teklif · '+line('insurance').note:'Teklif gerekli',
   documents:['duty','notaryService','registration'].every(known)?'Noter ve ruhsat giderleri senaryoda mevcut; kapsamını teyit edin':'Noter / ruhsat giderleri eksik; kapsam kontrolü gerekli',
   inspection:'Bağımsız ekspertiz raporu ve kapsamı kullanıcı tarafından doğrulanmalı. '+(known('inspection')?'Ekspertiz ücret kaydı var; rapor yerine geçmez.':'Ekspertiz ücret bilgisi eksik.'),
   history:problems(history).length?'Öncelikli kontrol gerekli: '+problems(history).map(k=>S.checks[k]).join(', '):incomplete(history)?'Şase, motor veya kaza geçmişi kontrolü eksik':'Kontroller kullanıcı beyanıyla sorunsuz; belgeleri teyit edin',
   maintenance:checks.maintenance==='Sorun var'?'Öncelikli kontrol gerekli: bakım geçmişi':checks.maintenance==='Kontrol edilmedi'?'Bakım belgeleri gerekli':'Bakım kontrolü kullanıcı beyanıyla kaydedildi',
   parts:problems(wear).length?'Öncelikli kontrol gerekli: '+problems(wear).map(k=>S.checks[k]).join(', '):known('parts')?'Lastik / zincir / fren gideri senaryoda mevcut'+(incomplete(wear)?'; fiziksel kontroller eksik':''):'Lastik / zincir / fren gider değerlendirmesi gerekli'
  };
  const gaps={price:S.verifiedPrice(x)===null,insurance:!known('insurance')||line('insurance')?.origin!=='quote',documents:!['duty','notaryService','registration'].every(known),inspection:entry.inspection?.status!=='Tamamlandı',history:incomplete(history)||problems(history).length>0,maintenance:checks.maintenance!=='Sorunsuz',parts:!known('parts')||incomplete(wear)||problems(wear).length>0};
  const rows=Object.entries(tasks).map(([key,label])=>({key,label,status:entry[key]?.status||states[0],updatedAt:entry[key]?.updatedAt||null,hint:hints[key],critical:!!gaps[key]||entry[key]?.status==='Sorun var'}));
  const completed=rows.filter(r=>r.status==='Tamamlandı').length;
  return {rows,completed,percent:Math.round(completed/rows.length*100),critical:rows.filter(r=>r.critical)};
 }
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function html(x,storage,cost){
  let records,error='';try{records=read(storage)}catch(e){records={};error=e.message}
  const p=evaluate(x,records,cost);
  return `<section class="purchase-preparation" data-preparation="${esc(x.id)}" aria-label="Satın Alma Hazırlığı"><h4>Satın Alma Hazırlığı</h4><p><strong>${p.percent}%</strong> · ${p.completed}/7 görev tamamlandı</p><progress max="7" value="${p.completed}" aria-label="Tamamlanan satın alma görevleri"></progress><p class="details">Bu oran görev ilerlemesidir; mekanik güvenilirlik puanı değildir. Durumlar kullanıcı beyanıdır.</p><p class="preparation-critical">Kritik eksikler / kontroller: ${p.critical.length?esc(p.critical.map(r=>r.label).join(' · ')):'Yok; bağımsız ekspertiz ve belgeleri teyit edin.'}</p>${error?'<p role="alert">'+esc(error)+'; kayıtlar değiştirilmedi.</p>':''}<details data-preparation-details="${esc(x.id)}"><summary>7 görevi düzenle</summary>${p.rows.map(r=>`<label class="preparation-task">${esc(r.label)}<select data-preparation-id="${esc(x.id)}" data-preparation-task="${r.key}" aria-label="${esc(r.label)}" ${error?'disabled':''}>${states.map(s=>`<option ${s===r.status?'selected':''}>${s}</option>`).join('')}</select><span class="details">${esc(r.hint)}</span>${r.updatedAt?'<small>Son durum değişikliği: '+esc(new Date(r.updatedAt).toLocaleString('tr-TR'))+'</small>':''}</label>`).join('')}</details></section>`;
 }
 const api={KEY,tasks,states,validate,read,save,evaluate,html};if(typeof module!=='undefined')module.exports=api;else root.MotorPurchaseAssistant=api;
})(globalThis);
