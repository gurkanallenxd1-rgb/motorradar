/* MotorRadar 3.0 - PRIVATE Gmail -> Drive collector.
 * Run from your OWN Google Apps Script account. Do not deploy as a web app.
 * It never sends mail content to GitHub Pages or external services.
 * No real sender format is assumed; adjust after reviewing an actual notification.
 */
var MOTORRADAR_GMAIL = {
  query: 'newer_than:30d {from:sahibinden.com from:arabam.com}',
  outputName: 'MotorRadar-Gmail-Ilans.json',
  maxThreads: 60,
  maxListings: 1000
};

function mrSafeLink(raw) {
  if (typeof raw !== 'string') return null;
  var url = raw.replace(/&amp;/gi, '&').replace(/&#38;/g, '&')
    .replace(/[)"'>,;]+$/g, '');
  var m = url.match(/^https:\/\/(www\.sahibinden\.com|m\.sahibinden\.com|sahibinden\.com|shbd\.io|www\.arabam\.com|arabam\.com)(\/[A-Za-z0-9/_-]+)(?:[?#][^\s"'<>]*)?$/i);
  if (!m) return null;
  var host = m[1].toLowerCase();
  var path = m[2].replace(/\/$/, '');
  if (host === 'shbd.io' && !/^\/s\/[A-Za-z0-9]+$/.test(path)) return null;
  if (host.indexOf('sahibinden.com') !== -1 &&
      !/^\/ilan\/(?:[A-Za-z0-9-]+-)?[1-9][0-9]{5,14}\/detay$/.test(path)) return null;
  if (host.indexOf('arabam.com') !== -1 && !/^\/ilan\/[A-Za-z0-9/_-]+$/.test(path)) return null;
  if (host === 'm.sahibinden.com' || host === 'sahibinden.com') host = 'www.sahibinden.com';
  if (host === 'arabam.com') host = 'www.arabam.com';
  return 'https://' + host + path;
}

function mrMailSenderAllowed(from) {
  if (typeof from !== 'string') return false;
  var m = from.match(/(?:^|<|\s)([A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+))(?:>|$|\s)/);
  if (!m) return false;
  var domain = m[2].toLowerCase();
  return domain === 'sahibinden.com' || domain.endsWith('.sahibinden.com') ||
    domain === 'arabam.com' || domain.endsWith('.arabam.com');
}

function mrNumber(s, kind) {
  if (!s || typeof s !== 'string') return null;
  var v = s.trim();
  if (!/^\d+(?:\.\d{3})*$/.test(v)) return null;
  var n = Number(v.replace(/\./g, ''));
  if (!Number.isSafeInteger(n)) return null;
  if (kind === 'price') return n > 0 && n <= 1000000000 ? n : null;
  if (kind === 'km') return n >= 0 && n <= 2000000 ? n : null;
  return null;
}

function mrExtractMessage(message) {
  if (!message || !mrMailSenderAllowed(message.from)) return null;
  var html = String(message.html || '').slice(0, 200000);
  var plain = String(message.plain || '').slice(0, 200000);
  var candidates = (html + '\n' + plain).match(/https:\/\/[^\s"'<>]+/gi) || [];
  var url = null;
  for (var i = 0; i < candidates.length; i++) {
    url = mrSafeLink(candidates[i]);
    if (url) break;
  }
  if (!url) return null;
  var body = (plain || html.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li)>/gi, '\n').replace(/<[^>]*>/g, ' '))
    .replace(/\u00a0/g, ' ').replace(/\r/g, '');
  var modelMatch = body.match(/\b(Yamaha\s*MT[\s-]?25|Yamaha\s*R[\s-]?25|KTM\s*(?:Duke\s*250|250\s*Duke))\b/i);
  var model = '';
  var brand = '';
  if (modelMatch) {
    var label = modelMatch[1].toLowerCase().replace(/\s|-/g, '');
    if (label.indexOf('yamaha') === 0 && label.indexOf('mt25') !== -1) {
      brand = 'Yamaha'; model = 'Yamaha MT-25';
    } else if (label.indexOf('yamaha') === 0 && label.indexOf('r25') !== -1) {
      brand = 'Yamaha'; model = 'Yamaha R25';
    } else if (label.indexOf('ktm') === 0) {
      brand = 'KTM'; model = 'KTM Duke 250';
    }
  }
  var priceMatch = body.match(/(?:^|\n)\s*(?:ilan\s*fiyat[ıi]|fiyat)\s*[:：-]?\s*(?:₺\s*)?(\d+(?:\.\d{3})*)\s*(?:TL|₺)?/im);
  if (!priceMatch) priceMatch = body.match(/(?:^|\n)\s*(?:₺\s*)?(\d+(?:\.\d{3})*)\s*(?:TL|₺)(?:\s|$)/im);
  var kmMatch = body.match(/(?:^|\n)\s*(?:kilometre|km)\s*[:：-]?\s*(\d+(?:\.\d{3})*)\s*(?:km)?\b/im);
  if (!kmMatch) kmMatch = body.match(/(?:^|\n)\s*(\d+(?:\.\d{3})*)\s*km\b/im);
  var yearMatch = body.match(/(?:^|\n)\s*(?:model\s*y[ıi]l[ıi]|y[ıi]l)\s*[:：-]?\s*((?:19|20)\d{2})\b/im);
  var year = yearMatch ? Number(yearMatch[1]) : null;
  if (year !== null && (year < 1950 || year > new Date().getFullYear() + 1)) year = null;
  return {
    url: url,
    title: model ? model + ' · Gmail bildirimi' : 'Motor ilanı · Gmail bildirimi',
    brand: brand,
    model: model,
    year: year,
    km: kmMatch ? mrNumber(kmMatch[1], 'km') : null,
    price: priceMatch ? mrNumber(priceMatch[1], 'price') : null,
    receivedAt: message.receivedAt || new Date().toISOString()
  };
}

/* This function is safe to run with an empty Gmail inbox: it writes an empty private
 * import file for later use, never invents an ad and never publishes private data.
 */
function syncGmailToDrive() {
  var store = PropertiesService.getScriptProperties();
  var id = store.getProperty('MOTORRADAR_DRIVE_FILE_ID');
  var file = null;
  if (id) {
    try { file = DriveApp.getFileById(id); } catch (_) { file = null; }
  }
  var old = {app: 'MotorRadar-Gmail', version: 1, listings: []};
  if (file) {
    try {
      var parsed = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
      if (parsed.app === 'MotorRadar-Gmail' && Array.isArray(parsed.listings)) old = parsed;
    } catch (_) { throw new Error('Mevcut Gmail aktarım dosyası okunamadı; üzerine yazılmadı.'); }
  }
  var byUrl = {};
  old.listings.forEach(function (x) {
    if (x && mrSafeLink(x.url)) byUrl[x.url] = x;
  });
  var threads = GmailApp.search(MOTORRADAR_GMAIL.query, 0, MOTORRADAR_GMAIL.maxThreads);
  var count = 0;
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      if (count >= 300) return;
      count++;
      var extracted = mrExtractMessage({
        from: msg.getFrom(),
        plain: msg.getPlainBody(),
        html: msg.getBody(),
        receivedAt: msg.getDate().toISOString()
      });
      if (!extracted) return;
      var oldItem = byUrl[extracted.url] || {};
      var result = Object.assign({}, oldItem);
      Object.keys(extracted).forEach(function (key) {
        if (extracted[key] !== null && extracted[key] !== '') result[key] = extracted[key];
      });
      byUrl[extracted.url] = result;
    });
  });
  var listings = Object.keys(byUrl).map(function (key) { return byUrl[key]; })
    .sort(function (a, b) { return String(b.receivedAt).localeCompare(String(a.receivedAt)); })
    .slice(0, MOTORRADAR_GMAIL.maxListings);
  var snapshot = JSON.stringify({
    app: 'MotorRadar-Gmail', version: 1, exportedAt: new Date().toISOString(),
    listings: listings
  }, null, 2);
  if (file) file.setContent(snapshot);
  else {
    file = DriveApp.createFile(MOTORRADAR_GMAIL.outputName, snapshot, MimeType.PLAIN_TEXT);
    store.setProperty('MOTORRADAR_DRIVE_FILE_ID', file.getId());
  }
  console.log('MotorRadar: ' + count + ' ileti incelendi; ' +
    listings.length + ' benzersiz bağlantı özel Drive dosyasına kaydedildi.');
}

/* Run once, after reviewing permissions. Re-running will not create duplicate triggers. */
function enableHourlyGmailSync() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'syncGmailToDrive';
  });
  if (!exists) ScriptApp.newTrigger('syncGmailToDrive').timeBased().everyHours(1).create();
  console.log('MotorRadar Gmail tetikleyicisi hazır.');
}

function disableHourlyGmailSync() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncGmailToDrive') ScriptApp.deleteTrigger(t);
  });
}
