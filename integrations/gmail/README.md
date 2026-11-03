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
