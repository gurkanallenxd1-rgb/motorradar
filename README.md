# MotorRadar — iPhone için motosiklet ilan takip PWA'sı

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
