const {test}=require('node:test');const assert=require('node:assert/strict');
const {number,extract}=require('../ocr-parser.js');
const page=(...texts)=>({lines:texts.map(text=>({text,confidence:95}))});
test('Turkish thousands, decimals, spaces and currency; reject damaged numbers',()=>{
 for(const [s,n] of [['245.000 TL',245000],['₺ 245.000,50',245000.5],['1.250.000,00 ₺',1250000],['24\u00a0500 km',24500],['0 km',0],['245000',245000]])assert.equal(number(s),n,s);
 for(const s of ['24.50','24,500','1.23.000','245O00','1e5','-20','24,5,0',''])assert.equal(number(s),null,s);
});
test('extract explicit Turkish labels and preserve model year distinction',()=>{
 assert.deepEqual(extract([page('İlan başlığı: Temiz Yamaha','Marka Yamaha','Model MT-25','Model Yılı 2023','Fiyat 245.000,50 TL','Kilometre 16.000 km','Şehir İstanbul')]).values,{brand:'Yamaha',model:'MT-25',year:2023,price:245000.5,km:16000,city:'İstanbul',title:'Temiz Yamaha'});
});
test('labels on separate lines, standalone currency and zero km',()=>{
 assert.deepEqual(extract([page('Marka','Honda','₺ 250.000','0 km','Model Yılı','2024')]).values,{brand:'Honda',year:2024,price:250000,km:0});
});
test('no inference from title, URL, unlabelled text or low confidence',()=>{
 const p=page('Yamaha MT-25 2023 İstanbul','https://shbd.io/s/Abc','245000');p.lines.push({text:'Fiyat 250.000 TL',confidence:40});
 assert.deepEqual(extract([p]).values,{});
});
test('conflicting fields across screenshots remain blank, repeated values survive',()=>{
 const r=extract([page('Marka Yamaha','Fiyat 240.000 TL','Model Yılı 2022'),page('Marka Yamaha','Fiyat 250.000 TL','Model Yılı 2023')]);
 assert.deepEqual(r.values,{brand:'Yamaha'});assert.deepEqual(r.ambiguous,['year','price']);
});
test('invalid ranges, malformed currency, fractional km and blank labels stay empty',()=>{
 assert.deepEqual(extract([page('Fiyat 24.50 TL','Yıl 1800','Km 12,50','Başlık','Şehir','Model')]).values,{});
});
