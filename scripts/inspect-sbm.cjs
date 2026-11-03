/* Offline PDF inspection only. Unknown layouts never become tariff amounts. */
const fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
function inspect(buffer,sourceUrl,extract=b=>execFileSync('pdftotext',['-layout','-','-'],{input:b,timeout:15000,maxBuffer:20*1024*1024,stdio:['pipe','pipe','pipe']}).toString('utf8')){
 const u=new URL(sourceUrl);if(u.protocol!=='https:'||!['sbm.org.tr','www.sbm.org.tr','mkt.sbm.org.tr'].includes(u.hostname)||u.username||u.password)throw Error('Resmî SBM belge adresi gerekli');
 const result={sourceUrl,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),status:'review-required',rows:[],reason:''};
 if(buffer.length>20*1024*1024||!buffer.subarray(0,5).equals(Buffer.from('%PDF-'))){result.reason='Geçersiz PDF veya boyut sınırı';return result}
 try{const text=extract(buffer);if(!text.trim()||text.includes('\uFFFD'))throw Error();result.reason='Metin çıkarıldı; tablo düzeni, dönem, il, sınıf, kullanım ve basamak eşlemesi insan incelemesi gerektirir. Otomatik prim üretilmedi.';result.text=text;}
 catch{result.reason='PDF okunamadı, taranmış/şifreli olabilir veya pdftotext kullanılamıyor. Ücret üretilmedi.'}
 return result;
}
if(require.main===module){const [file,url]=process.argv.slice(2);if(!file||!url)throw Error('Kullanım: node scripts/inspect-sbm.cjs work/sbm.pdf https://sbm.org.tr/...pdf');const r=inspect(fs.readFileSync(file),url);fs.mkdirSync('work',{recursive:true});if(r.text)fs.writeFileSync('work/sbm-extracted.txt',r.text);delete r.text;fs.writeFileSync('work/sbm-inspection.json',JSON.stringify(r,null,2)+'\n');console.log(r.reason)}
module.exports={inspect};
