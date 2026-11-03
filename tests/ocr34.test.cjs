const {test}=require('node:test');const assert=require('node:assert/strict');const {extract}=require('../ocr-parser.js');
const read=(...texts)=>extract([{lines:texts.map(text=>({text,confidence:95}))}]);
test('unlabeled explicit motorcycle names are suggestions, missing facts stay unknown',()=>{
 const x=read('Temiz Yamaha MT-25','250.000 TL','16.000 km');assert.equal(x.values.brand,'Yamaha');assert.equal(x.values.model,'Yamaha MT-25');assert.equal(x.values.price,250000);assert.equal(x.values.km,16000);assert.equal(x.values.year,undefined);assert.equal(x.values.city,undefined);
});
test('conflicting known models, prices and years are not invented',()=>{
 const x=read('Yamaha MT-25','Honda CBR250R','Fiyat: 250.000 TL','Fiyat: 230.000 TL','Yıl: 2023','Yıl: 2024');for(const k of ['model','brand','price','year']){assert.equal(x.values[k],undefined);assert.ok(x.ambiguous.includes(k))}
});
test('low confidence motorcycle text and unknown model are not guessed',()=>{
 assert.deepEqual(extract([{lines:[{text:'Yamaha MT-25',confidence:70}]}]).values,{});assert.deepEqual(read('Motor 250 cc','2023','Ankara').values,{});
});
