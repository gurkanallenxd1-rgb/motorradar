const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {Date, console};
vm.runInNewContext(fs.readFileSync('integrations/gmail/Code.gs', 'utf8'), context);

test('Gmail reader extracts explicitly labeled data', () => {
  const item = context.mrExtractMessage({
    from: 'Notice <info@sahibinden.com>',
    plain: 'Yamaha MT-25\nFiyat: 245.000 TL\nKilometre: 16.000 km\nModel Yılı: 2023\nhttps://www.sahibinden.com/ilan/yamaha-mt-25-123456789/detay'
  });
  assert.equal(item.price, 245000);
  assert.equal(item.km, 16000);
  assert.equal(item.year, 2023);
});

test('Mail from untrusted domain is ignored', () => {
  assert.equal(context.mrExtractMessage({
    from: 'info@sahibinden.com.evil.com',
    plain: 'https://www.sahibinden.com/ilan/yamaha-mt-25-123456789/detay'
  }), null);
});

test('Missing details stay empty', () => {
  const item = context.mrExtractMessage({
    from: 'info@arabam.com',
    plain: 'https://www.arabam.com/ilan/motosiklet/12345'
  });
  assert.equal(item.price, null);
  assert.equal(item.km, null);
  assert.equal(item.year, null);
});
