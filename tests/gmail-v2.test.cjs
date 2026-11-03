const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {Date, console};
vm.runInNewContext(fs.readFileSync('integrations/gmail/CodeV2.gs','utf8'),context);

const mail = (overrides={}) => ({
  from:'sahibinden <notification@sahibinden.com>',
  subject:'Favori İlanınızın Fiyatı Düştü',
  plain:'Acil satılık mt25\n#1339016365\nEski Fiyat: 243.000 TL\nYeni Fiyat: 242.000 TL\nhttp://www.sahibinden.com/ilan/acil-satilik-mt25-1339016365/detay',
  receivedAt:'2026-10-06T12:00:00.000Z',
  ...overrides
});

test('price fall notification: correct old/new price and link upgrade',()=>{
  const item=context.mr3DataFromMail(mail());
  assert.equal(item.kind,'price_drop');
  assert.equal(item.oldPrice,243000);
  assert.equal(item.newPrice,242000);
  assert.equal(item.price,242000);
  assert.equal(item.listingId,'1339016365');
  assert.equal(item.url,'https://www.sahibinden.com/ilan/acil-satilik-mt25-1339016365/detay');
  assert.equal(item.model,'Yamaha MT-25');
  assert.equal(item.status,'unknown');
  assert.equal(item.km,null);
  assert.equal(item.year,null);
});
test('duplicate occurrences of same URL do not mean multiple listings',()=>{
  const m=mail();
  m.html='<a href="http://www.sahibinden.com/ilan/acil-satilik-mt25-1339016365/detay">Aç</a>';
  assert.equal(context.mr3DataFromMail(m).newPrice,242000);
});
test('multiple DIFFERENT listing links cannot inherit one email-wide price',()=>{
  const m=mail();
  m.plain+='\nhttp://www.sahibinden.com/ilan/yamaha-r25-123456789/detay';
  assert.equal(context.mr3DataFromMail(m),null);
});
test('spoofed sender and unknown host rejected',()=>{
  assert.equal(context.mr3DataFromMail(mail({from:'x@sahibinden.com.evil.net'})),null);
  assert.equal(context.mr3DataFromMail(mail({plain:'Eski Fiyat: 243.000 TL Yeni Fiyat: 242.000 TL http://attacker.net/a'})),null);
});
test('informational mails do not create false new ads',()=>{
  assert.equal(context.mr3DataFromMail(mail({subject:'Fatura bildirimi'})),null);
});
test('price rise is not misreported as price drop',()=>{
  assert.equal(context.mr3DataFromMail(mail({plain:'Eski Fiyat: 242.000 TL\nYeni Fiyat: 243.000 TL\nhttp://www.sahibinden.com/ilan/acil-satilik-mt25-1339016365/detay'})),null);
});
test('only labeled fields are used for new listings',()=>{
  const item=context.mr3DataFromMail(mail({
    subject:'Kayitli Arama: Yeni ilan',
    plain:'Yamaha MT-25\nFiyat: 225.000 TL\nYıl: 2023\nKilometre: 15.000 km\nhttp://www.sahibinden.com/ilan/yamaha-mt25-123456789/detay'
  }));
  assert.equal(item.kind,'new_listing');
  assert.equal(item.price,225000);
  assert.equal(item.year,2023);
  assert.equal(item.km,15000);
  assert.equal(item.oldPrice,null);
});
