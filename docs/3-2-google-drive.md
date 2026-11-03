# MotorRadar 3.2 — güvenli Drive bağlantısı

Mevcut 3.1 main (`4eba308`) incelendi: Gmail v2 olay doğrulama, önizleme,
tekrar engelleme, bildirim geçmişi, filtreler ve manuel JSON aktarımı zaten vardı.
3.2 aynı `MotorGmailImport.read/preview/apply` akışını kullanır. Ana veri anahtarı
`motorradar-v1` değişmez. Güncel fiyat, manuel fiyat geçmişi, favori, not, durum,
son manuel kontrol, OCR ve filtreler korunur. Yeni Gmail ilanının fiyatı `null`,
durumu `unknown` olur. Drive üzerinde hiçbir dosya oluşturulmaz veya değiştirilmez.

## Google Cloud kurulumu (site yöneticisi)

1. Kendi Google Cloud projenizde **Google Drive API** ve **Google Picker API**
   etkinleştirin. OAuth client, API key ve proje numarası aynı projeden olmalı.
2. Google Auth Platform'da uygulama adı, destek e-postası, yetkili alan adları ve
   gizlilik politikasını yapılandırın. Uygun audience seçin; Testing durumunda
   deneyecek Google hesaplarını test kullanıcısı olarak ekleyin. Yayınlamadan önce
   konsolun talep ettiği doğrulama/yayın gereksinimlerini tamamlayın.
3. Data Access altında yalnızca
   `https://www.googleapis.com/auth/drive.file` kapsamını tanımlayın. Gmail veya
   tüm Drive okuma kapsamını eklemeyin. Bu kapsam Google tarafında seçilen
   dosyaları okuma/yazma yetkisi içerir; uygulama yalnızca GET yapar. Aynı uygulama
   için geçmişte seçilmiş dosyaların izni Google tarafında kalabilir; kod bu
   oturumda seçilen tek dosyanın ID'sini kullanır.
4. **Web application** türünde OAuth 2.0 Client ID oluşturun. Authorized JavaScript
   origins'e sitenin tam origin'ini ekleyin (ör. `https://gurkanallenxd1-rgb.github.io`,
   `/motorradar/` yolu olmadan). Yerel test için gerekiyorsa `http://localhost:8000`
   ve `http://127.0.0.1:8000` ekleyin. Bu popup token modeli redirect URI veya
   client secret kullanmaz. Client secret indirmeyin veya siteye eklemeyin.
5. IAM & Admin / Settings bölümündeki sayısal **project number** değerini alın;
   project ID ile karıştırmayın. Picker `setAppId` için bu numarayı kullanır.
6. Tarayıcı için ayrı API key oluşturun. Websites (HTTP referrers) kısıtlamasına
   kendi site adresinizi (ör. `https://gurkanallenxd1-rgb.github.io/*`) ve Google'ın
   Picker iframe'i için belirttiği `https://docs.google.com/*` adresini ekleyin.
   Gerekiyorsa yerel test origin'lerini de ekleyin. API restrictions altında
   yalnızca Google Picker API ve Google Drive API'yi seçin. Kotaları izleyin.
7. `drive-config.js` içindeki boş `clientId`, `projectNumber`, `apiKey` alanlarını
   bu **public browser configuration** değerleriyle doldurun. Bunlar kullanıcı
   parolası/tokenı/client secret değildir; tarayıcıdan görünürler. Gerçek kullanıcı
   kimlik bilgilerini repoya eklemeyin. Bu PR kasıtlı olarak boş ayarlarla gelir.
   Siteyi HTTPS üzerinden sunun. Ayarları daha önce dağıtılmış bir sürümde
   değiştiriyorsanız `sw.js` içindeki `CACHE` sürümünü de artırın; aksi halde
   eski boş ayarlar önbellekten gelebilir. Güncellenen service worker'ın
   etkinleşmesini bekleyin ve sayfayı yeniden açın. Yerel ilanları silmeyin.

## iPhone kullanımı

Bağlantı kur'a ilk dokunuş Google kitaplıklarını yükler. Hazır mesajından sonra
tekrar dokunmak OAuth popup'ını doğrudan kullanıcı hareketi içinde açar. Hesabınıza
izin verin, Drive dosyası seç ile kendi hesabınıza ait tam adı
`MotorRadar-Gmail-Guvenli-v2.json` olan dosyayı seçin. Şimdi eşitle yalnızca
metadata ve bu dosyanın içeriğini indirir (5 MB sınırı, 20 saniye zaman aşımı).
Önizlemedeki Kontrol edip aktar düğmesi ve onaydan sonra kayıt yapılır. Son eşitleme
tarihi yalnızca başarılı yerel kayıttan sonra güncellenir; yalnızca bu tarih ayrı
`motorradar-drive-last-sync` anahtarında saklanır.

Erişim tokenı, seçilen dosya ID'si ve indirilen JSON bellektedir. Token localStorage,
sessionStorage, uygulama URL'si veya loglara yazılmaz; Drive isteğinin Authorization
başlığında kullanılır. Google'ın resmi Picker SDK'sına `setOAuthToken` ile verilir;
SDK'nin kendi iframe/istek taşımasını Google yönetir. Service worker yalnızca aynı
origin'deki statik dosyaları önbelleğe alır, Google yanıtlarını almaz.
Bağlantıyı kes yerel oturumu hemen temizler, devam eden isteği iptal eder ve
Google revoke çağrısını dener. Ağ yoksa uzak iptal doğrulanamaz; Google Hesabı /
Üçüncü taraf bağlantılarından izni ayrıca kaldırabilirsiniz. Sayfadan ayrılınca,
yenilemede veya token süresi dolunca yeniden bağlantı ve dosya seçimi gerekir.

İsteğe bağlı 5 dakikalık kontrol varsayılan olarak kapalıdır. Yalnızca görünür
sayfada, geçerli izin ve seçili dosya varken çalışır. Değişen dosya yine önizleme
ve onay gerektirir; açık önizlemeyi tekrar okumaz. Gizli sekmede, Safari kapalıyken
veya izin süresi bittikten sonra otomatik çalışma / sessiz token yenileme yoktur.
Ağ, bozuk JSON, yanlış dosya, izin veya depolama hatası ilanları silmez. Manuel
Gmail JSON aktarımı Google yapılandırması ve Google kitaplıklarından bağımsızdır.

## Doğrulama ve sınırlar

`npm ci`, `npm test`, `npx playwright install --with-deps webkit`,
`npm run test:safari` ile iPhone 13 WebKit profili testlerini çalıştırın.
Drive testleri sahte GIS/Picker ve HTTPS Drive yanıtları kullanır; gerçek token
gerektirmez. Safari popup'ı, gerçek izin ekranı, hesap seçimi, gerçek Picker,
Cloud origin/referrer kısıtları ve uzak revoke ancak yukarıdaki ayarlar yapıldıktan
sonra gerçek iPhone üzerinde uçtan uca doğrulanabilir. Bu PR'da gerçek Cloud
değerleri veya kullanıcı hesabı olmadığından bu canlı adımlar tamamlanmış sayılmaz.

Yayın öncesi gerçek iPhone'da: ilk bağlantı, reddet/kapat, farklı hesap, dosya
seç/iptal, önizlemeyi kapat, onayla, tekrar eşitle, uçak modu, süresi dolmuş izin,
bağlantıyı kes ve sayfa yenileme senaryolarını deneyin. Öncesi/sonrası JSON yedeğinde
fiyat/geçmiş/favori/not/durum değerlerini karşılaştırın. Safari gizlilik korumalarını
kapatmak yerine sorun durumunda manuel JSON aktarımını kullanın.

Resmi kaynaklar (3 Kasım 2026'da incelendi):

- [GIS browser token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Google Picker web kurulumu ve örnek](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample)
- [Drive kapsamları ve drive.file](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
