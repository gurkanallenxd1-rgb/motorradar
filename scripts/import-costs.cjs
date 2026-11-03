/* Maintainer-reviewed, offline evidence import. Source evidence stays local, never copied to the repository. */
const fs=require('node:fs');const crypto=require('node:crypto');const C=require('../purchase-costs.js');
const hosts=new Set(['www.resmigazete.gov.tr','resmigazete.gov.tr','www.gib.gov.tr','gib.gov.tr','sbm.org.tr','www.sbm.org.tr','yamanlarotoekspertizalibeykoy.com','www.yamanlarotoekspertizalibeykoy.com','www.yamanlarotoekspertizcekmekoy.com']);
function review(candidate,evidence,at=C.today()){
 const d=C.validate(candidate.data),a=candidate.audit;
 if(Object.keys(d).some(k=>!['schemaVersion','reviewedAt','notary','notaryService','registration','insurance','providers'].includes(k)))throw Error('Beklenmeyen üst alan');
 if(!a||!C.date(a.reviewedAt)||a.reviewedAt>at||!Array.isArray(a.evidence)||!a.evidence.length)throw Error('Tarihli insan incelemesi ve kanıt gerekli');
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers])if(!hosts.has(new URL(s.sourceUrl).hostname))throw Error('Kaynak alan adı kod incelemesi gerektirir');
 for(const e of a.evidence){if(!C.safeUrl(e.sourceUrl)||!hosts.has(new URL(e.sourceUrl).hostname)||!/^[a-f0-9]{64}$/.test(e.sha256)||!evidence.some(b=>crypto.createHash('sha256').update(b).digest('hex')===e.sha256))throw Error('Kanıt özeti eşleşmedi')}
 // Whitelisted schema rejects policy/identity/token/phone fields and accidental private payloads.
 const sourceKeys=new Set(['id','kind','sourceUrl','amount','checkedAt','verifiedAt','validFrom','validTo','access','rate','minimum','gibUrl','scope','reason','documentUrl','rows','name','location','motorcycleVerified','verificationMethod']);
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers])if(Object.keys(s).some(k=>!sourceKeys.has(k)))throw Error('Kaynak kaydında beklenmeyen alan');
 for(const r of d.insurance.rows)if(Object.keys(r).some(k=>!['province','step','amount'].includes(k)))throw Error('SBM satırında beklenmeyen alan');
 const before=JSON.parse(fs.readFileSync('data/cost-sources.json'));
 for(const s of [d.notary,d.notaryService,d.registration,d.insurance,...d.providers]){
  const old=[before.notary,before.notaryService,before.registration,before.insurance,...before.providers].find(o=>o.id===s.id);
  if(JSON.stringify(old)!==JSON.stringify(s)&&!a.evidence.some(e=>e.sourceUrl===s.sourceUrl||e.sourceUrl===s.documentUrl))throw Error('Değişen kaynak için eşleşen kanıt gerekli');
 }
 return {data:d,audit:{reviewedAt:a.reviewedAt,evidence:a.evidence.map(({sourceUrl,sha256})=>({sourceUrl,sha256}))}};
}
if(require.main===module){const [candidate,...files]=process.argv.slice(2);if(!candidate||!files.length)throw Error('Kullanım: node scripts/import-costs.cjs work/candidate.json work/evidence.pdf [...]');const result=review(JSON.parse(fs.readFileSync(candidate)),files.map(f=>fs.readFileSync(f)));fs.writeFileSync('data/cost-sources.json',JSON.stringify(result.data,null,2)+'\n');fs.mkdirSync('data/cost-reviews',{recursive:true});fs.writeFileSync('data/cost-reviews/'+result.audit.reviewedAt+'.json',JSON.stringify(result.audit,null,2)+'\n');console.log('İncelenmiş veri yerel branch üzerinde hazır; diff ve testlerden sonra PR açın.');}
module.exports={review};
