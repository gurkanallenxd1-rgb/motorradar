const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../purchase-costs.js'),B=require('../backup.js'),data=require('../data/cost-sources.json');
const at='2026-11-03',x={id:'r25-1',model:'Yamaha R25',price:220000,verifiedPrice:220000,priceVerifiedAt:at,decision:{costs:{service:0,parts:1200,transfer:2000},inspection:{checks:{chassis:'Sorun var'},notes:'Korunacak'}}};
const p={service:500,serviceApproved:true,notaryService:2000,providerId:'yamanlar-alibeykoy'};
test('R25 220000: approved 500 wins over legacy zero; 290000 budget stays incomplete without insurance',()=>{
 const before=JSON.stringify({x,p,data}),c=C.calculate(x,p,data,290000,at),line=k=>c.lines.find(l=>l.key===k);
 assert.equal(line('service').amount,500);assert.equal(line('registration').amount,1511);assert.equal(line('inspection').amount,4500);assert.equal(line('notaryService').amount,2000);assert.equal(line('insurance').amount,null);assert.equal(c.subtotal,229511);assert.equal(c.total,null);assert.equal(c.remaining,null);
 const row=C.legacyRows(x,p,data,290000,at).find(r=>r.key==='service');assert.equal(row.old,0);assert.equal(row.value,500);assert.equal(row.difference,500);assert.equal(C.expenseState(p,'service'),'Onaylı · bütçeye dahil');assert.equal(JSON.stringify({x,p,data}),before);
});
test('specific legacy transfer requires explicit consent, clears approval even for zero and keeps unrelated values',()=>{
 for(const consent of [undefined,false,'yes'])assert.throws(()=>C.legacyTransfer(x,p,'service',consent));
 const next=C.legacyTransfer(x,p,'service',true);assert.equal(next.service,0);assert.equal(next.serviceApproved,false);assert.equal(next.notaryService,2000);assert.equal(p.service,500);assert.equal(x.decision.costs.service,0);assert.equal(C.calculate(x,next,data,290000,at).lines.find(l=>l.key==='service').amount,null);
 assert.throws(()=>C.legacyTransfer(x,p,'transfer',true));assert.throws(()=>C.legacyTransfer(x,p,'constructor',true));
 const draft=C.legacyRows(x,{service:123},data,290000,at).find(r=>r.key==='service');assert.equal(draft.value,123);assert.equal(draft.budgetValue,null);assert.equal(draft.difference,123);assert.equal(C.expenseState({service:123},'service'),'Tutar mevcut, onay gerekli');assert.equal(C.expenseState({},'service'),'Girilmedi');assert.equal(C.expenseState({service:0,serviceApproved:true},'service'),'Onaylı · bütçeye dahil');
});
test('legacy quotes transfer as unapproved drafts; IDs and missing motor price stay independent',()=>{
 const q={...x,decision:{costs:{insurance:8000,inspection:4000}}};const insurance=C.legacyTransfer(q,{quoteApproved:true},'insurance',true);assert.equal(insurance.quoteApproved,false);assert.equal(insurance.quoteDate,'');assert.equal(C.calculate(q,insurance,data,290000,at).lines.find(l=>l.key==='insurance').amount,null);
 const inspection=C.legacyTransfer(q,{providerId:'yamanlar-alibeykoy',providerQuoteApproved:true},'inspection',true);assert.equal(inspection.providerId,'custom');assert.equal(inspection.providerQuoteApproved,false);
 const all=B.scenarios({'r25-1':p,'r25-2':{service:700,serviceApproved:true},'mt25-1':{service:900}});all['r25-1']=C.legacyTransfer(x,all['r25-1'],'service',true);assert.equal(all['r25-2'].service,700);assert.equal(all['mt25-1'].service,900);
 const c=C.calculate({...x,priceVerifiedAt:null},p,data,290000,at);assert.equal(c.motorMissing,true);assert.equal(c.total,null);assert.equal(c.partialRemaining,null);
});
test('81 records, legacy decisions and scenario approvals round trip backup without mutation',()=>{
 const xs=Array.from({length:81},(_,i)=>({...x,id:'record-'+i})),scenarios={'record-0':p,'record-1':{service:0,serviceApproved:false}},before=JSON.stringify(xs),raw=JSON.stringify(scenarios),backup=B.snapshot(xs,{getItem:()=>raw});
 const restored=B.preview(JSON.parse(JSON.stringify(backup)),xs,scenarios,()=>true,()=>false);assert.equal(restored.listings.length,81);assert.equal(JSON.stringify(restored.listings),before);assert.deepEqual(JSON.parse(JSON.stringify(restored.costs)),scenarios);assert.equal(backup.photosIncluded,false);assert.equal(JSON.stringify(xs),before);
});
