/* Actions-only evidence collection. Never publishes prices or changes verification dates. */
const fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../purchase-costs.js'),{inspect}=require('./inspect-sbm.cjs');
async function collect(data,policy,request=fetch){
 C.validate(data);const items=[];
 for(const s of [data.notary,data.notaryService,data.registration,data.insurance,...data.providers]){
  const rule=policy.sources.find(p=>p.id===s.id),url=s.documentUrl||s.sourceUrl;
  if(rule?.automatedAccess!==true||!rule.permissionUrl||!C.date(rule.permissionReviewedAt)||rule.sourceUrl!==url){items.push({id:s.id,status:'blocked-by-policy',reason:rule?.reason||'Otomatik erişim ve yeniden kullanım izni doğrulanmadı.'});continue;}
  try{
   if(!C.safeUrl(rule.permissionUrl)||!C.safeUrl(url))throw Error('HTTPS kaynak gerekli');
   // Fixed reviewed URL only; no redirects, cookies, credentials, or user supplied targets.
   const response=await request(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'MotorRadar-SourceReview/3.7.2'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>20*1024*1024)throw Error('Belge boyut sınırı');chunks.push(chunk)}const bytes=Buffer.concat(chunks);
   const evidence={id:s.id,sourceUrl:url,checkedAt:C.today(),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),status:'review-required'};
   if(s.kind==='official-cap')Object.assign(evidence,inspect(bytes,url));
   items.push(evidence);
  }catch(e){items.push({id:s.id,status:'access-error',reason:e.message,rows:[]})}
 }
 return {checkedAt:C.today(),automaticPriceUpdates:false,items};
}
if(require.main===module)collect(require('../data/cost-sources.json'),require('../data/cost-access-policy.json')).then(report=>{fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/cost-research.json',JSON.stringify(report,null,2));console.log('Kaynak araştırması tamamlandı; fiyatlar ve doğrulama tarihleri değiştirilmedi.')}).catch(()=>{process.exitCode=1});
module.exports={collect};
