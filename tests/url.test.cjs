const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sahibinden,suggestion,key}=require('../listing-url.js');
const url='https://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-mt-25-1234567890/detay';
test('strict host, protocol, credentials and listing path validation',()=>{
 for(const u of ['javascript:alert(1)','https://sahibinden.com.evil.org/ilan/x-1234567890/detay','https://evil@sahibinden.com/ilan/x-1234567890/detay','https://sahibinden.com:444/ilan/x-1234567890/detay','https://sahibinden.com/arama','invalid'])assert.equal(sahibinden(u),null);
 assert.equal(sahibinden(url).id,'1234567890');
});
test('same listing despite mobile host, slug, tracking and hash',()=>{
 assert.equal(key(url),key('http://m.sahibinden.com/ilan/new-title-1234567890/detay/?tracking=1#x'));
 assert.notEqual(key(url),key(url.replace('1234567890','1234567891')));
});
test('model only from explicit, unambiguous supported name in slug',()=>{
 assert.equal(suggestion(url),'Yamaha MT-25');
 assert.equal(suggestion(url.replace('yamaha-mt-25','mt-25')),'');
 assert.equal(suggestion(url.replace('yamaha-mt-25','yamaha-mt-250')),'');
 assert.equal(suggestion(url.replace('yamaha-mt-25','yamaha-r25-honda-cbr250r')),'');
 assert.equal(suggestion('https://sahibinden.com/ilan/1234567890/detay?model=yamaha-mt-25'),'');
});
