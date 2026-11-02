# MotorRadar 2.2 — iPhone için motosiklet ilan takip PWA'sı

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
3. Oluşturulan repoda **Add file → Upload files** ile ZIP içindeki `index.html`, `manifest.webmanifest`, `sw.js`, `listing-url.js`, `ocr-parser.js`, `screenshot-ocr.js`, `vendor/ocr/` dizini, `icon.svg` ve tüm `icon-*.png` dosyalarını yükle. (Dosyaları ZIP olarak değil, içinden çıkarılmış hâliyle yükle.) `README.md` isteğe bağlıdır.
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

## MotorRadar 2.1

- Ana ekrandaki bağlantı alanı `https://shbd.io/s/S7csE12b` gibi kısa bağlantıları doğrudan ilan formuna taşır; kaydedilen bağlantı **İlanı aç** ile kullanıcı tarafından açılır.
- HTTPS ve tam alan adı doğrulanır. Kısa bağlantıda yalnızca `shbd.io` ve `/s/harfVeyaRakam` yolu kabul edilir; sahte alt alan adları, kullanıcı bilgileri, özel portlar, kodlanmış veya nokta segmentli yollar reddedilir. İzleme sorguları ve fragment tekrar kontrolü için kaldırılır; kısa kodun büyük/küçük harfi korunur.
- Sahibinden'in `sahibinden.com`, `www.sahibinden.com`, `m.sahibinden.com` uzun ilan bağlantıları ve Arabam'ın `arabam.com`, `www.arabam.com` ilan bağlantıları desteklenir. Yeni bağlantılar HTTPS olmalıdır.
- Aynı kısa bağlantı yeniden kaydedilemez. Kısa koddan ilan numarası çıkarılmaz. Kısa/uzun eşleştirme yalnızca uzun bağlantıdaki ilan numarası veya kısa bağlantı için kullanıcının ilanda görüp doğrulayarak girdiği numara ile yapılır. Numara bilinmiyorsa farklı bağlantıların aynı ilan olduğu varsayılmaz.
- Bilinmeyen model boş metin; fiyat, kilometre ve yıl `null` olarak saklanır. Boş fiyat için fiyat geçmişi üretilmez; fiyat istatistiği ve bütçe filtresi yalnızca bilinen fiyatları kullanır. Model önerisi yalnızca uzun URL'de açıkça varsa ve kullanıcı **Öneriyi kullan** düğmesine basarsa uygulanır.
- `motorradar-v1` localStorage anahtarı korunur. Mevcut kayıtlar ve ek alanlar, fiyat geçmişleri, karşılaştırmalar ve eski JSON yedekleri desteklenir. Depolama başarısız olursa bellekteki değişiklik geri alınır.
- Kısa bağlantı çözümleme, scraping, arka plan taraması veya koruma aşma yapılmaz.

### Kontroller

```sh
npm ci
npm test
npx playwright install --with-deps webkit
npm run test:safari
```

Safari testleri iPhone 13 ayarlarında Playwright WebKit kullanır; 320/375/390 piksel genişlik, eski kayıtlar, kısa bağlantı, boş bilgiler, tekrar kontrolü, karşılaştırma, manuel fiyat geçmişi ve yedek geri yüklemeyi kapsar. Bunlar gerçek iPhone üzerinde Safari testinin yerine geçmez. CI `.github/workflows/test.yml` içindedir.

## MotorRadar 2.2: Cihazda ekran görüntüsü okuma

**Yeni ilan ekle** ekranında isteğe bağlı olarak 1–6 PNG/JPEG/WebP seç ve **Görselleri oku** düğmesine dokun. Görsel başına üst sınır 12 MB / 24 milyon pikseldir. HEIC desteklenmez; PNG/JPEG olarak dışa aktar. Görseller sırayla, en fazla 2000×3000 boyutlu tuvalde işlenir; iPhone belleğini korumak için her tuval okuma sonrası serbest bırakılır.

Tesseract.js + Türkçe LSTM modeli uygulamayla birlikte gelir. Görseller yalnızca cihaz üzerinde Web Worker / WebAssembly ile okunur; hiçbir sunucuya, OCR servisine veya ilan sitesine gönderilmez. Sahibinden kısa/uzun bağlantı doğrulaması ve URL önerileri 2.1 ile aynıdır; kısa bağlantı çözülmez ve scraping yapılmaz. İlk başarılı uygulama önbelleklemesinden sonra OCR çevrimdışı da çalışır. Tarayıcının önbelleği silmesi veya depolama kısıtları çevrimdışı kullanımı etkileyebilir.

Marka, model, model yılı, fiyat, kilometre, şehir ve başlık **açık alan etiketleriyle** okunmaya çalışılır; tek başına TL/₺ fiyatı ve km değeri de tanınır. Etiketsiz ilan başlığından veya URL'den yıl/fiyat gibi bilgiler tahmin edilmez. Satır güveni %75 altında olan, biçimi/rakamı bozuk, sınır dışındaki veya birden fazla görselde farklı bulunan alanlar boş kalır. `245.000 TL`, `₺ 245.000,50`, `16.000 km` ve boşlukla ayrılmış Türkçe sayılar desteklenir. OCR kesin doğruluk garantisi vermez; özellikle küçük yazı, kesilmiş alan ve karmaşık yerleşimde elle düzeltme gerekebilir.

Okunan değerler düzenlenebilir forma yerleşir; okuma sırasında elle değiştirdiğin alan korunur. Dolu bir form yeniden okutulmadan önce üzerine yazma onayı alınır. İptal, 120 saniyelik zaman aşımı, bozuk/desteklenmeyen dosya veya motor hatasında manuel giriş devam eder. Fotoğraf hiçbir zaman zorunlu değildir. **Kaydet** sonrası kullanıcı onaylamadan kayıt yapılmaz. Görseller ve ham OCR metni saklanmaz.

`motorradar-v1` anahtarı değişmez; eski kayıtlar, ek alanlar, v1/2.x JSON yedekleri, fiyat geçmişi ve karşılaştırmalar korunur. Marka yeni ve isteğe bağlı bir alandır; eski birleşik marka/model metni değiştirilmez. Fiyat geçmişi yalnızca onaylanan kayıtta fiyat değişmişse eklenir; OCR tek başına fiyat geçmişi oluşturmaz.

Tüm kök dosyaları, `listing-url.js`, `ocr-parser.js`, `screenshot-ocr.js` ve **`vendor/ocr/` dizinini** birlikte dağıt. OCR motorunun tekrar üretimi ve lisansları `vendor/ocr/README.md` içindedir.

2.2 testleri gerçek OCR motoruyla üretilmiş Türkçe görselleri, çoklu dosyayı, çevrimdışı okumayı, yükleme/dış istek yapılmamasını, onay reddini, alan düzenlemeyi, çelişkileri, boş/düşük güvenli sonuçları, iptali, bozuk/HEIC/büyük dosyaları ve manuel kaydı kapsar. Eski veri/yedek/geçmiş/karşılaştırma testleri sürer. `npm run test:safari` varsayılan olarak iPhone 13 WebKit profili kullanır; yerel Chromium için `LOCAL_CHROMIUM=1 npm run test:safari` (sistem Chromium'u gerekir). Fiziksel iPhone Safari/PWA'da Fotoğraflar seçimi, klavye ve bellek davranışını ayrıca denemek gerekir.

## MotorRadar 2.3 — cihazda ilan analizi

Her karttaki **İlanı analiz et** düğmesi yalnızca kayıtlı ilanları kullanır. Harici AI, anahtar, scraping veya veri gönderimi yoktur. Filtrelenmiş görünüm örnek havuzunu etkilemez. `motorradar-v1`, eski JSON yedekleri, ek alanlar, fiyat geçmişi, OCR ve bağlantı kuralları korunur. İsteğe bağlı `description` alanı eklenmiştir; eski kayıtlarda gerekli değildir.

- Model adı boşluk / noktalama / büyük-küçük harf farklarından arındırılır. MT-25, R25 ve Duke 250 marka eşlemeleri vardır; diğer modellerde marka (model metninde veya marka alanında) gerekir. Farklı modeller birleştirilmez.
- Aynı model / marka ve ±1 model yılı, geçerli pozitif fiyat. İncelenen ilan ve bilinen aynı kimlik / URL / doğrulanmış ilan numaraları hariç. Çözümlenmemiş kısa bağlantıların uzun URL ile aynı olduğu tahmin edilmez.
- En az üç örnek gerekir. Medyan, TL farkı (`ilan − medyan`), yüzde (`fark / medyan × 100`) ve örnek sayısı gösterilir. Kayıtlı fiyatlar tüm piyasayı veya gerçekleşen satış fiyatını temsil etmez.
- Yıllık km = `km / max(1, güncel yıl − model yılı)`. Gelecek / eksik yıl geçersizdir. Bu yaklaşık kullanım miktarıdır, mekanik durum tespiti değildir.
- Puan: `%60 fiyat + %25 yıllık km + %15 model yılı`. Bileşenler sırasıyla `50 − 100 × fiyat farkı / medyan fiyat`, `50 − 50 × (yıllık km − medyan yıllık km) / medyan yıllık km`, `50 + 25 × (yıl − medyan yıl)`; her biri 0–100'e sınırlanır, toplam yuvarlanır. Medyan yıllık km sıfırsa ilan da sıfır olduğunda km bileşeni 50, aksi halde 0. İlanın veya örneklerin gerekli alanları eksikse puan üretilmez. Puan teknik kalite veya satın alma garantisi değildir.
- Açıklama / notlardaki hasar, kaza, boya, değişen, tramer, bakım ve servis ifadeleri bağlamıyla gösterilir; “hasar yok” gibi olumsuzlamalar korunur. Bu ifadeler puanı değiştirmez, hasar / dolandırıcılık çıkarımı yapılmaz.
- Panelde kullanılan / dışlanan kayıtlar, gerekçeler ve tüm formüller açılabilir. Analiz kayıtları değiştirmez; açıldığında yeniden hesaplanır.

### Doğrulama

`npm ci && npm test` hesaplama, bağlantı, OCR ve kayıt regresyonlarını çalıştırır. `npx playwright install --with-deps webkit && npm run test:safari` iPhone 13 WebKit emülasyonunda OCR, eski kayıt, fiyat geçmişi, JSON yedekleme, karşılaştırma, analiz, XSS metni, 320/375/390px taşma ve çevrimdışı analizi doğrular. Fiziksel iPhone testi değildir. GitHub Actions aynı kontrolleri çalıştırır.
