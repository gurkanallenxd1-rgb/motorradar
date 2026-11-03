const {test}=require('node:test'),assert=require('node:assert/strict'),{inspect}=require('../scripts/inspect-sbm.cjs');
const url='https://sbm.org.tr/UploadContent/Documents/Trafik_Azami_Prim_2026_Kas%C4%B1m.pdf';
test('HTML error pages, malformed, scanned and encrypted PDF never yield prices',()=>{
 for(const [bytes,extract] of [[Buffer.from('<html>502</html>'),()=>{throw Error()}],[Buffer.from('%PDF-broken'),()=>{throw Error()}],[Buffer.from('%PDF-scan'),()=> ''],[Buffer.from('%PDF-encrypted'),()=>{throw Error('encrypted')}],[Buffer.from('%PDF-invalid-text'),()=> '\uFFFD']]){const r=inspect(bytes,url,extract);assert.equal(r.status,'review-required');assert.deepEqual(r.rows,[]);assert.equal(r.sha256.length,64);assert.match(r.reason,/PDF/)}
});
test('readable but unrecognized table layout stays review-only and has its evidence hash',()=>{const r=inspect(Buffer.from('%PDF-fixture'),url,()=> '34 motorcycles 4 1.234,00');assert.equal(r.rows.length,0);assert.match(r.reason,/insan incelemesi/);assert.ok(r.text)});
test('only official source addresses accepted for PDF evidence',()=>{for(const u of ['https://example.com/a.pdf','http://sbm.org.tr/a.pdf','https://a:b@sbm.org.tr/a.pdf'])assert.throws(()=>inspect(Buffer.from('%PDF-test'),u))});
test('tariff importer rejects rows without provenance, wrong periods, future checks and HTML masquerading as PDF',()=>{
 const {review}=require('../scripts/import-costs.cjs'),crypto=require('node:crypto'),base=require('../data/cost-sources.json'),bytes=Buffer.from('<html>not a PDF</html>'),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 const make=()=>{const data=structuredClone(base);data.insurance.rows=[{province:34,step:4,amount:1234,vehicleClass:'motorcycle',usageProfile:'private-other-no-disability',sourceUrl:data.insurance.documentUrl,validFrom:'2026-11-01',validTo:'2026-11-30',verifiedAt:'2026-11-03'}];return {data,audit:{reviewedAt:'2026-11-03',evidence:[{sourceUrl:data.insurance.documentUrl,sha256:hash}]}}};
 for(const change of [c=>delete c.data.insurance.rows[0].sourceUrl,c=>c.data.insurance.rows[0].validTo='2026-12-31',c=>c.data.insurance.checkedAt='2026-11-04',()=>{}]){const c=make();change(c);assert.throws(()=>review(c,[bytes],'2026-11-03'))}
});
