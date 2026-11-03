/* No network access or price/date rewriting. Produces an auditable static-site update queue. */
const fs=require('node:fs');const path=require('node:path');const C=require('../purchase-costs.js');
function audit(data,at=C.today(),policy={sources:[]}){
 C.validate(data);
 return {checkedAt:at,automaticPriceUpdates:false,items:[data.notary,data.notaryService,data.registration,data.insurance,...data.providers].map(s=>({id:s.id,sourceUrl:s.sourceUrl,lastVerifiedAt:s.verifiedAt,validFrom:s.validFrom,validTo:s.validTo,current:C.current(s,at),amount:s.amount,missing:s.kind==='official-duty'?false:s.kind==='official-cap'?s.rows.length===0:s.amount===null,access:s.access,action:s.access!=='verified'?'Kaynak erişimini doğrula':!C.current(s,at)?'Geçerlilik dönemini incele':'Dönem sonuna kadar izle',automaticAccess:policy.sources.find(p=>p.id===s.id)?.automatedAccess===true}))};
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/cost-sources.json'))),policy=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/cost-access-policy.json'))),report=audit(data,process.argv[2]||C.today(),policy);
 fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/cost-audit.json',JSON.stringify(report,null,2)+'\n');
 console.log('Kaynak denetimi: '+report.items.length+' kayıt; '+report.items.filter(s=>!s.current||s.missing).length+' inceleme gerekiyor. Fiyatlar ve doğrulama tarihleri değiştirilmedi.');
}
module.exports={audit};
