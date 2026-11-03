/* Maintainer-reviewed, offline evidence import. Source evidence stays local, never copied to the repository. */
const fs=require('node:fs');const crypto=require('node:crypto');const C=require('../purchase-costs.js');
const hosts=new Set(['www.resmigazete.gov.tr','resmigazete.gov.tr','www.gib.gov.tr','gib.gov.tr','sbm.org.tr','www.sbm.org.tr','higm.adalet.gov.tr','ms.hmb.gov.tr','mkt.sbm.org.tr','motocv.com','motoatolye.com.tr','yamanlarotoekspertizalibeykoy.com','www.yamanlarotoekspertizalibeykoy.com','www.yamanlarotoekspertizcekmekoy.com']);
function review(candidate,evidence,at=C.today()){
 const d=C.validate(candidate.data),a=candidate.audit;
 if(Object.keys(d).some(k=>!['schemaVersion','reviewedAt','notary','notaryService','registration','insurance','providers'].includes(k)))throw Error('Beklenmeyen üst alan');
 if(!a||!C.date(a.reviewedAt)||a.reviewedAt>at||!Array.isArray(a.evidence)||!a.evidence.length)throw Error('Tarihli insan incelemesi ve kanıt gerekli');
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers])if(!hosts.has(new URL(s.sourceUrl).hostname))throw Error('Kaynak alan adı kod incelemesi gerektirir');
 for(const e of a.evidence){if(!C.safeUrl(e.sourceUrl)||!hosts.has(new URL(e.sourceUrl).hostname)||!/^[a-f0-9]{64}$/.test(e.sha256)||!evidence.some(b=>crypto.createHash('sha256').update(b).digest('hex')===e.sha256))throw Error('Kanıt özeti eşleşmedi')}
 if(d.reviewedAt!==a.reviewedAt)throw Error('Veri ve inceleme tarihleri eşleşmeli');
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers])if(s.checkedAt>a.reviewedAt||s.verifiedAt&&s.verifiedAt>s.checkedAt)throw Error('Kaynak doğrulama tarihleri tutarsız');
 // Whitelisted schema rejects policy/identity/token/phone fields and accidental private payloads.
 const sourceKeys=new Set(['id','kind','sourceUrl','amount','checkedAt','verifiedAt','validFrom','validTo','access','rate','minimum','gibUrl','scope','reason','documentUrl','rows','name','location','motorcycleVerified','verificationMethod','publishedAt','amendmentUrl']);
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers])if(Object.keys(s).some(k=>!sourceKeys.has(k)))throw Error('Kaynak kaydında beklenmeyen alan');
 for(const r of d.insurance.rows)if(Object.keys(r).some(k=>!['province','step','amount','vehicleClass','usageProfile','sourceUrl','validFrom','validTo','verifiedAt'].includes(k)))throw Error('SBM satırında beklenmeyen alan');
 for(const r of d.insurance.rows)if(!C.date(r.verifiedAt)||!C.date(r.validFrom)||!C.date(r.validTo)||!C.safeUrl(r.sourceUrl)||!['sbm.org.tr','www.sbm.org.tr','higm.adalet.gov.tr','ms.hmb.gov.tr','mkt.sbm.org.tr'].includes(new URL(r.sourceUrl).hostname)||!r.vehicleClass||!r.usageProfile||r.sourceUrl!==d.insurance.documentUrl||r.validFrom!==d.insurance.validFrom||r.validTo!==d.insurance.validTo||r.verifiedAt>a.reviewedAt)throw Error('Her SBM satırı için kaynak, dönem, doğrulama ve profil gerekli');
 if(d.insurance.rows.length&&!a.evidence.some(e=>e.sourceUrl===d.insurance.documentUrl&&evidence.some(b=>crypto.createHash('sha256').update(b).digest('hex')===e.sha256&&b.subarray(0,5).equals(Buffer.from('%PDF-')))))throw Error('SBM satırları için eşleşen resmî PDF kanıtı gerekli');
 const before=JSON.parse(fs.readFileSync('data/cost-sources.json'));
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers]){
  const old=[before.notary,before.notaryService,before.registration,before.insurance,...before.providers].find(o=>o.id===s.id);
  if(JSON.stringify(old)!==JSON.stringify(s)&&!a.evidence.some(e=>e.sourceUrl===s.sourceUrl||e.sourceUrl===s.documentUrl))throw Error('Değişen kaynak için eşleşen kanıt gerekli');
 }
 return {data:d,audit:{reviewedAt:a.reviewedAt,evidence:a.evidence.map(({sourceUrl,sha256})=>({sourceUrl,sha256}))}};
}
if(require.main===module){const [candidate,...files]=process.argv.slice(2);if(!candidate||!files.length)throw Error('Kullanım: node scripts/import-costs.cjs work/candidate.json work/evidence.pdf [...]');const result=review(JSON.parse(fs.readFileSync(candidate)),files.map(f=>fs.readFileSync(f)));fs.mkdirSync('data/cost-reviews',{recursive:true});const auditPath='data/cost-reviews/'+result.audit.reviewedAt+'.json',dataPath='data/cost-sources.json';try{fs.writeFileSync(dataPath+'.tmp',JSON.stringify(result.data,null,2)+'\n');fs.writeFileSync(auditPath+'.tmp',JSON.stringify(result.audit,null,2)+'\n');fs.renameSync(auditPath+'.tmp',auditPath);fs.renameSync(dataPath+'.tmp',dataPath)}finally{for(const p of [dataPath+'.tmp',auditPath+'.tmp'])if(fs.existsSync(p))fs.unlinkSync(p)};console.log('İncelenmiş veri yerel branch üzerinde hazır; diff ve testlerden sonra PR açın.');}
module.exports={review};
