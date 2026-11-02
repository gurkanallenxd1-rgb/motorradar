const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const html=readFileSync(new URL('../index.html',`file://${__filename}`),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const prefix=script.slice(script.indexOf('const parseLink='),script.indexOf('    let items='));
const {parseLink,duplicate,validListing}=vm.runInNewContext(`(()=>{${prefix};return {parseLink,duplicate,validListing}})()`,{URL,ListingURL:require('../listing-url.js')});
const short='https://shbd.io/s/S7csE12b';
const long='https://www.sahibinden.com/ilan/vasita-motosiklet-yamaha-mt25-1234567890/detay';
test('accepts exact HTTPS listing URLs and canonicalizes tracking/trailing slash',()=>{
 assert.equal(parseLink(short+'/?utm_source=test#share').url,short);
 assert.equal(parseLink(long).listingId,'1234567890');
 assert.equal(parseLink(short).listingId,null);
 assert.ok(parseLink('https://www.arabam.com/ilan/sahibinden-satilik-yamaha/mt-25/123456'));
});
test('rejects spoofed hosts, credentials, protocols and invalid paths',()=>{
 const invalid=['http://shbd.io/s/S7csE12b','https://shbd.io.evil.com/s/S7csE12b','https://evilshbd.io/s/S7csE12b','https://www.shbd.io/s/S7csE12b','https://shbd.io@evil.com/s/S7csE12b','https://evil.com@shbd.io/s/S7csE12b','https://shbd.io./s/abc','https://shbd.io:8443/s/abc','https://%73hbd.io/s/abc','https://shbd.io/s/','https://shbd.io/s/a/b','https://shbd.io/s/a%2fb','https://shbd.io/x/../s/abc','https://shbd.io/s/abc/..','https://shbd.io/s/abc\\evil','https://sahibinden.com.evil.com/ilan/a-1234567890/detay','https://sahibinden.com/account','javascript:alert(1)','https://shbԁ.io/s/abc'];
 for(const url of invalid)assert.equal(parseLink(url),null,url);
});
test('deduplicates short URLs without inventing an ID or merging unknown aliases',()=>{
 assert.ok(duplicate({url:short+'?x=1'},[{id:'1',url:short}]));
 assert.ok(!duplicate({url:short},[{id:'1',url:long}]));
 assert.ok(!duplicate({url:short},[{id:'1',url:'https://shbd.io/s/Other'}]));
 assert.ok(duplicate({url:short,listingId:'1234567890'},[{id:'1',url:long}]));
 assert.ok(duplicate({url:long},[{id:'1',url:short,listingId:'1234567890'}]));
 assert.ok(!duplicate({id:'1',url:short},[{id:'1',url:short}]));
 assert.ok(!duplicate({url:'https://www.arabam.com/ilan/a/123456',listingId:'1234567890'},[{id:'1',url:long}]));
});
test('accepts legacy records unchanged and unknown optional values',()=>{
 const legacy={id:'old',title:'MT25',model:'Yamaha MT-25',price:245000,km:16000,year:2023,history:[{price:250000,at:'2026-01-01'}]};
 assert.ok(validListing(legacy));
 assert.ok(validListing({...legacy,model:'',price:null,km:null,year:null,history:[]}));
 assert.ok(!validListing({...legacy,price:0}));
 assert.ok(!validListing({...legacy,history:[{price:null,at:'2026-01-01'}]}));
});
