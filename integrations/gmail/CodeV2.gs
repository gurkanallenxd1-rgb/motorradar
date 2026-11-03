/* MotorRadar 3.0 / Gmail collector v2.
 * Private Apps Script, owned by the Gmail account holder. NOT a web app.
 * No outbound network calls or marketplace scraping.
 * Separate Drive output so the first experimental file is untouched.
 */
var MR3 = {
  query: 'newer_than:90d {from:sahibinden.com from:arabam.com}',
  outputName: 'MotorRadar-Gmail-Guvenli-v2.json',
  property: 'MR3_FILE_ID',
  maxThreads: 100,
  maxMessages: 400
};

function mr3SenderAllowed(from) {
  var match = String(from || '').match(/(?:^|<|\s)[^<>\s@]+@([a-z0-9.-]+)(?:>|$|\s)/i);
  if (!match) return false;
  var host = match[1].toLowerCase();
  return host === 'sahibinden.com' || host.endsWith('.sahibinden.com') ||
    host === 'arabam.com' || host.endsWith('.arabam.com');
}

function mr3Link(raw) {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  // Only convert literal known-host links to https; never visit the HTTP page.
  var text = raw.replace(/&amp;/gi, '&').replace(/&#38;/g, '&')
    .replace(/[)"'>,;]+$/g, '');
  var match = text.match(/^https?:\/\/(www\.sahibinden\.com|m\.sahibinden\.com|sahibinden\.com|shbd\.io|www\.arabam\.com|arabam\.com)(\/[a-z0-9/_-]+)(?:[?#][^\s"'<>]*)?$/i);
  if (!match) return null;
  var host = match[1].toLowerCase();
  var path = match[2].replace(/\/$/, '');
  var id = null;
  if (host === 'shbd.io') {
    if (!/^\/s\/[a-z0-9]+$/i.test(path)) return null;
  } else if (host.indexOf('sahibinden.com') >= 0) {
    var detail = path.match(/^\/ilan\/(?:[a-z0-9-]+-)?([1-9][0-9]{5,14})\/detay$/i);
    if (!detail) return null;
    id = detail[1];
    host = 'www.sahibinden.com';
  } else {
    if (!/^\/ilan\/[a-z0-9/_-]+$/i.test(path)) return null;
    host = 'www.arabam.com';
  }
  return {url: 'https://' + host + path, listingId: id,
    provider: host === 'www.arabam.com' ? 'Arabam' : 'Sahibinden'};
}

function mr3Money(value) {
  var normalized = String(value || '').trim().replace(/\s+/g, '');
  if (!/^\d{1,9}(?:\.\d{3})*$/.test(normalized) &&
      !/^\d{1,9}$/.test(normalized)) return null;
  var num = Number(normalized.replace(/\./g, ''));
  return Number.isSafeInteger(num) && num > 0 && num <= 1000000000 ? num : null;
}

function mr3DataFromMail(message) {
  if (!message || !mr3SenderAllowed(message.from)) return null;
  var html = String(message.html || '').slice(0, 250000);
  var plain = String(message.plain || '').slice(0, 250000);
  var rawLinks = (plain + '\n' + html).match(/https?:\/\/[^\s"'<>]+/gi) || [];
  var unique = Object.create(null);
  rawLinks.forEach(function (raw) {
    var link = mr3Link(raw);
    if (link) unique[link.url] = link;
  });
  var links = Object.keys(unique);
  // A message with multiple advertisements must be parsed per-card in a later version.
  // Never attach an email-wide price to an arbitrarily chosen listing.
  if (links.length !== 1) return null;
  var link = unique[links[0]];
  var text = plain || html.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li)>/gi, '\n').replace(/<[^>]*>/g, ' ');
  text = text.replace(/\u00a0/g, ' ').replace(/\r/g, '');
  var subject = String(message.subject || '');
  var priceDrop = /favori\s*ilan[ıi]n[ıi]z[ıi]n\s*fiyat[ıi]\s*d[üu][şs]t[üu]|fiyat[ıi]\s*d[üu][şs]t[üu]/i.test(subject);
  var newAd = /yeni\s*ilan|kay[ıi]tl[ıi]\s*arama|arama\s*sonu[çc]lar[ıi]/i.test(subject);
  var old = text.match(/eski\s*fiyat\s*[:：-]?\s*(\d[\d.\s]{0,18})\s*(?:TL|₺)\b/i);
  var current = text.match(/yeni\s*fiyat\s*[:：-]?\s*(\d[\d.\s]{0,18})\s*(?:TL|₺)\b/i);
  var oldPrice = old ? mr3Money(old[1]) : null;
  var newPrice = current ? mr3Money(current[1]) : null;
  if (priceDrop && (oldPrice === null || newPrice === null || newPrice >= oldPrice)) return null;
  if (!priceDrop && !newAd) return null;
  var price = priceDrop ? newPrice : null;
  if (newAd) {
    var labeled = text.match(/(?:^|\n)\s*(?:ilan\s*fiyat[ıi]|fiyat)\s*[:：-]?\s*(\d[\d.\s]{0,18})\s*(?:TL|₺)\b/i);
    price = labeled ? mr3Money(labeled[1]) : null;
  }
  // These fields are optional and may be absent from notification emails.
  var yearMatch = text.match(/(?:^|\n)\s*(?:model\s*y[ıi]l[ıi]|y[ıi]l)\s*[:：-]?\s*((?:19|20)\d{2})\b/i);
  var kmMatch = text.match(/(?:^|\n)\s*(?:kilometre|km)\s*[:：-]?\s*(\d[\d.\s]{0,18})\s*km\b/i);
  var year = yearMatch ? Number(yearMatch[1]) : null;
  if (year !== null && (year < 1950 || year > new Date().getFullYear() + 1)) year = null;
  var km = kmMatch ? mr3Money(kmMatch[1]) : null;
  if (km !== null && km > 2000000) km = null;
  var model = '', brand = '';
  if (/\b(?:yamaha\s*)?mt[\s-]?25\b/i.test(text)) {
    model = 'Yamaha MT-25'; brand = 'Yamaha';
  } else if (/\b(?:yamaha\s*)?r[\s-]?25\b/i.test(text)) {
    model = 'Yamaha R25'; brand = 'Yamaha';
  } else if (/\bktm\s*(?:duke\s*250|250\s*duke)\b/i.test(text)) {
    model = 'KTM Duke 250'; brand = 'KTM';
  }
  var titleMatch = text.match(/(?:^|\n)\s*([^\n]{4,100})\s*\n\s*#(?:\s*\d{6,15})\b/);
  var title = titleMatch ? titleMatch[1].trim() : (model || 'E-posta ilan bildirimi');
  var at = message.receivedAt || new Date().toISOString();
  if (Number.isNaN(Date.parse(at))) return null;
  return {
    kind: priceDrop ? 'price_drop' : 'new_listing',
    url: link.url, listingId: link.listingId, provider: link.provider,
    title: title, brand: brand, model: model, year: year, km: km,
    price: price, oldPrice: priceDrop ? oldPrice : null,
    newPrice: priceDrop ? newPrice : null,
    observedAt: at, status: 'unknown'
  };
}

function mr3EventKey(item) {
  // Stable enough to de-duplicate repeats; no Gmail credentials or message body.
  return [item.kind, item.url, item.observedAt, item.oldPrice,
    item.newPrice, item.price].join('|');
}

function syncGmailToDriveV2() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(MR3.property);
  var file = null;
  if (id) {
    try { file = DriveApp.getFileById(id); }
    catch (e) { throw new Error('Mevcut güvenli dosya açılamadı. Eski veri üzerine yazılmadı.'); }
  }
  var oldEvents = [];
  if (file) {
    var saved = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
    if (saved.app !== 'MotorRadar-Gmail' || saved.version !== 2 || !Array.isArray(saved.events))
      throw new Error('Beklenmeyen dosya biçimi, üzerine yazılmadı.');
    oldEvents = saved.events;
  }
  var events = Object.create(null);
  oldEvents.forEach(function (e) { if (e && e.url && e.kind) events[mr3EventKey(e)] = e; });
  var scanned = 0, matched = 0, skipped = 0;
  GmailApp.search(MR3.query, 0, MR3.maxThreads).forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      if (scanned >= MR3.maxMessages) return;
      scanned++;
      var item = mr3DataFromMail({
        from: message.getFrom(), subject: message.getSubject(),
        plain: message.getPlainBody(), html: message.getBody(),
        receivedAt: message.getDate().toISOString()
      });
      if (!item) { skipped++; return; }
      matched++;
      events[mr3EventKey(item)] = item;
    });
  });
  var result = Object.keys(events).map(function (key) { return events[key]; })
    .sort(function (a, b) { return b.observedAt.localeCompare(a.observedAt); }).slice(0, 2000);
  var json = JSON.stringify({
    app: 'MotorRadar-Gmail', version: 2, exportedAt: new Date().toISOString(),
    events: result
  }, null, 2);
  if (!file) {
    file = DriveApp.createFile(MR3.outputName, json, MimeType.PLAIN_TEXT);
    props.setProperty(MR3.property, file.getId());
  } else file.setContent(json);
  console.log('MotorRadar v2: ' + scanned + ' ileti; ' + matched +
    ' uygun bildirim; ' + skipped + ' atlandı; ' + result.length + ' benzersiz olay.');
}

function enableHourlyGmailSyncV2() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'syncGmailToDriveV2';
  });
  if (!exists) ScriptApp.newTrigger('syncGmailToDriveV2').timeBased().everyHours(1).create();
}
function disableHourlyGmailSyncV2() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncGmailToDriveV2') ScriptApp.deleteTrigger(t);
  });
}
