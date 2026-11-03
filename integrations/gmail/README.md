# MotorRadar 3.0 - Gmail ilan toplayıcısı (ilk aşama)

Bu modül Sahibinden/Arabam ilan bildirimleri geldiğinde, izin verdiğiniz Gmail hesabında arar ve ilanlardan açıkça görülebilen alanları hesabınızın özel Google Drive alanındaki bir JSON dosyasında biriktirir. Sahibinden'den veri çekmez ve mevcut MotorRadar sitesini henüz değiştirmez.

## iPhone'da başlangıç

1. https://script.google.com/home adresinden kendi hesabınızda yeni Apps Script projesi açın.
2. integrations/gmail/Code.gs dosyasının içeriğini projenin kod editörüne yapıştırıp kaydedin.
3. Kodu ve izinleri gözden geçirdikten sonra syncGmailToDrive fonksiyonunu çalıştırın ve gereken Gmail/Drive izinlerini onaylayın.
4. Drive hesabınızda MotorRadar-Gmail-Ilans.json adlı bir dosya oluşur. Henüz e-posta yoksa boş listings dizisi normaldir.
5. Otomatik saatlik taramayı açmak isterseniz enableHourlyGmailSync fonksiyonunu bir kez çalıştırın. Devre dışı bırakmak için disableHourlyGmailSync çalıştırın.

**Gizlilik:** Bu kodu herkese açık web uygulaması olarak yayınlamayın ve Gmail erişim anahtarı/parolası girmeyin. Script kendi hesabınızın yetkileriyle çalışır. Google Drive'daki dosyayı başkalarıyla paylaşmayın.

**Önemli sınırlar:**
- Bu sürüm otomatik olarak MotorRadar web uygulamasına veri göndermiyor. İçe aktarım ve kimlik doğrulamalı eşitleme sonraki aşama.
- MotorRadar'ın Yedek yükle düğmesi mevcut kayıtları değiştirdiği için Gmail JSON dosyasıyla kullanmayın.
- E-posta içeriğinde bulunmayan fiyat, kilometre veya yıl tahmin edilmez.
- İlk gerçek bildirim örneği görüldükten sonra ayrıştırma kurallarını doğrulamak gerekebilir.
- Otomatik e-posta kontrolü, yeni Sahibinden ilanlarının tamamının keşfedileceği anlamına gelmez.
- Yerel testler: node --test tests/gmail-integration.test.cjs

## MotorRadar 3.0 beta - 2. aşama

Google Apps Script projesinde eski Code.gs dosyasını silmeden GitHub'daki integrations/gmail/CodeV2.gs kodunu yeni bir .gs dosyasına (ör. CodeV2) yapıştırıp kaydet.

1. Önce eski otomatik görevi kullandıysan disableHourlyGmailSync fonksiyonuyla kapat.
2. syncGmailToDriveV2 fonksiyonunu çalıştır. Drive'da MotorRadar-Gmail-Guvenli-v2.json oluşur.
3. Saatlik kontrol istersen enableHourlyGmailSyncV2 fonksiyonunu bir kez çalıştır; durdurmak için disableHourlyGmailSyncV2 çalıştır.
4. MotorRadar sitesindeki Gmail ilanlarını aktar seçeneğinden yalnızca yeni v2 dosyasını seç. Önizlemedeki kayıtları incele ve onayla.

**Güvenlik sınırları:**
- V2 farklı bir Drive dosyasına yazar. İlk aşamada toplanan 41 test kaydının bulunduğu eski dosyaya dokunmaz.
- Bir e-postada birden fazla farklı ilan bağlantısı bulunuyorsa o mesajı şimdilik atlar; fiyatı yanlış ilana bağlamaz.
- Favori ilan fiyatı düşüşü bildirimlerinde eski ve yeni fiyat ayrı tutulur. Bir e-postada yoksa kilometre ve model yılı tahmin edilmez.
- Gelen e-postalardan güncel/aktif ilan durumu doğrulanamaz. Web uygulaması eski bildirim fiyatını mevcut fiyat alanına yazmaz; bildirim fiyatı ve tarihi ayrı gösterilir.
- Yeni içe aktarılan kayıtlar Durumu bilinmiyor durumuyla başlar. Var olan ilanlar, favoriler, mevcut fiyat, geçmiş ve kullanıcı notları korunur; eşleşen ilanlara yalnızca e-posta olay geçmişi eklenir.
- Gmail yetkisi yalnızca kendi Apps Script projenizdedir; GitHub Pages üzerinde Gmail erişim yetkisi veya sunucu anahtarı yoktur.
- JSON içeriği kullanıcı tarafından seçilir; GitHub Pages'e otomatik bağlanan kimlik doğrulamalı bulut senkronizasyonu henüz YOK.
- Google Drive JSON dosyasının içeriğini herkesle paylaşmayın; Gmail bildirimlerinden gelen özel veriler bulunabilir.
- Bu sürüm ilan sitesine HTTP/HTTPS isteği göndermez, yalnızca e-postanın içindeki açık ilan bağlantılarını yerel olarak işler.
- İlk gerçek e-posta biçimindeki farklılıklar yeni örneklerle doğrulanmadan bütün bildirimlerin doğru ayrıştırılacağı garanti edilemez.

Test: npm test; npm run test:safari (WebKit simulasyonu, gerçek iPhone Safari testi yerine geçmez).
