# MotorRadar 2.0 — iPhone için motosiklet ilan takip PWA'sı

Bu proje **Sahibinden, Arabam ve diğer ilan sitelerinin resmi API'sine bağlı değildir**. Bu sitelerden otomatik veri çekmez, korumaları aşmaz, fiyatları kendiliğinden güncellemez.

## Özellikler

- İlan başlığı, model, yıl, km, fiyat, şehir, bağlantı ve not saklama
- Sahibinden/Arabam bağlantıları tanıma; ilanı ilgili sitede açma
- 250.000 TL bütçe filtresi, arama, sıralama ve model filtresi
- 2–3 ilanı karşılaştırma
- Manuel fiyat güncelleme sonrası fiyat geçmişi, düşüş/yükseliş ve grafik
- JSON dosyasına yedek alma / geri yükleme
- HTTPS üzerinden ana ekrana eklenebilir PWA, offline uygulama kabuğu

## iPhone üzerinden kurulum (bilgisayar yok)

1. iPhone'daki **Dosyalar** uygulamasından ZIP dosyasına dokunup çıkar.
2. [github.com/new](https://github.com/new) adresinden `motorradar` adlı **public** repository oluştur.
3. Oluşturulan repoda **Add file → Upload files** ile ZIP içindeki `index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg` ve tüm `icon-*.png` dosyalarını yükle. (Dosyaları ZIP olarak değil, içinden çıkarılmış hâliyle yükle.) `README.md` isteğe bağlıdır.
4. GitHub repo **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.
5. GitHub Pages adresi genellikle `https://KULLANICI_ADI.github.io/motorradar/` şeklindedir; dağıtımın tamamlandığını kontrol et.
6. Safari'de adresi aç → Paylaş → Ana Ekrana Ekle.

GitHub Pages ve menü seçenekleri değişebilir; masaüstü sitesi görünümünü açman gerekebilir.

## Codex ile geliştirme

Codex Cloud ortamını ChatGPT'nin web arayüzünden oluştur ve repo ile bağla. iPhone Codex arayüzünde oluşturulan ortamdan yeni görev başlat. Örnek prompt:

> `motorradar` deposunu incele. Uygulamayı Türkçe ve mobil öncelikli tut. İlk iş olarak yeni ilan formunda linki doğrula, verileri yalnızca yerel depolamada tut, fiyat geçmişini sadece kullanıcı fiyatı elle değiştirdiğinde güncelle, güvenlik testleri ekle. Sahibinden veya başka bir siteyi otomatik tarama/scraping yapma. İzinli/resmi bir API olursa ayrı sağlayıcı arayüzü eklenebilmesi için plan oluştur. Testleri çalıştır ve değişiklikleri commit et.

## Veri güvenliği ve sınırlamalar

- Bilgiler `localStorage` içinde cihaz/tarayıcı bazında tutulur. Tarayıcı verileri silinirse kayıtlar kaybolabilir: düzenli JSON yedeği al.
- Birden fazla iPhone arasında senkronizasyon YOK.
- Arka planda otomatik site tarama veya bildirim YOK.
- Uygulamayı iPhone'da kullanmak için bir Mac'e ihtiyacın yok; Codex'in yeni bir Cloud ortamını başlatması için web arayüzü gerekir.
- İlan bilgileri kullanıcı tarafından girilir; uygulama fiyatı doğrulamaz.

## 2.0: Bağlantıyla kolay ekleme

Ana sayfada Sahibinden ilan URL’sini yapıştır ve **Bilgileri tamamla** düğmesine dokun. Uygulama yalnızca `sahibinden.com`, `www.sahibinden.com` ve `m.sahibinden.com` üzerindeki `/ilan/...-ilanNo/detay` bağlantılarını kabul eder. Kısaltılmış bağlantıları açmaz; tam ilan bağlantısını kullan.

URL başlığında desteklenen marka/model açıkça varsa **Öneriyi kullan** düğmesi gösterilir. Öneri fiyat, kilometre veya yıl doldurmaz; tüm bilgiler elle düzenlenebilir. Belirsiz veya tanınmayan modellerde öneri gösterilmez. İlan sayfasına hiçbir otomatik istek yapılmaz.

Aynı Sahibinden ilan numarası; mobil adres, değişmiş başlık, takip parametresi veya fragment ile tekrar kaydedilemez. Kontrol hem kolay eklemede hem standart formda çalışır; mevcut ilan kendisiyle çakışmadan düzenlenebilir. Yedek içindeki tekrarlı ilanlar dosya değiştirilmeden reddedilir. Eski kayıtlar otomatik silinmez veya birleştirilmez.

`motorradar-v1` localStorage anahtarı ve sürüm 1 JSON yedekleri korunur. Güncelleme aynı site adresinde kullanıldığında mevcut verilerle devam eder. Başka bir alan adı/origin için JSON yedeğini kullan. Mevcut arama, bütçe/model filtresi, sıralama, karşılaştırma ve manuel fiyat geçmişi devam eder.

## Geliştirme ve test

- `npm ci && npm test`: URL doğrulama, model önerisi, eski kayıt yükleme, tekrar engelleme ve depolama hatası testleri.
- `npx playwright install --with-deps webkit && npm run test:safari`: iPhone 13 profiliyle WebKit uçtan uca testi (320/375/390 px taşma, eski kayıtlar, öneri, kayıt, yeniden yükleme, tekrar kontrolü, fiyat geçmişi, arama, karşılaştırma, JSON indirme ve dış ağa istek yapılmaması).
- GitHub Actions aynı kontrolleri çalıştırır. WebKit emülasyonu fiziksel iPhone testi değildir. Gerçek Safari’de ana ekrana ekleme, sanal klavye, güvenli ekran boşlukları ve Dosyalar üzerinden yedek geri yükleme ayrıca denenmelidir.

Bu geliştirme ortamında Node testleri geçti. WebKit indirme sunucuları ortam ağ politikasında `403 Domain forbidden` döndürdüğünden yerel Safari/WebKit çalıştırması tamamlanamadı; CI sonucu ayrıca değerlendirilmelidir.
