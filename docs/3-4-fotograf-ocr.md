# MotorRadar 3.4 Beta

Başlangıç: güncel main `bc731a4` (3.3). Drive OAuth/config dosyaları, Gmail v2 olay
aktarıcısı, analizler ve `motorradar-v1` anahtarı değiştirilmedi.

## Arşiv

Satıldı/Kaldırıldı kayıtlar varsayılan takip listesinden hemen gizlenir; tekli ve
toplu değişiklik aynı durum alanını kullanır. Silinmezler. Arşivi göster kutusu
`hideClosed` kutusunun tersidir, ayrı bir gizleme durumu oluşturmaz. Satıldı veya
Kaldırıldı durum filtresi seçilince arşiv açılır. Tekrar takip et yalnızca durumu
following yapar; tarih, Gmail olayları, not ve favoriler değişmez. Filtreleri sıfırla
varsayılan gizli arşive döner. Sayaçlar tüm koleksiyonu saymaya devam eder.

## Fotoğraflar ve yedek

Karttaki Fotoğraflar veya düzenleme formundaki fotoğraf düğmesiyle Fotoğraflar /
Dosyalar'dan PNG, JPEG, WebP seçilebilir. HEIC desteklenmiyorsa iPhone'da JPEG olarak
dışa aktarılmalıdır. Dosya başına 12 MB / 24 megapiksel sınırı; en fazla dört resim.
Yeşil çerçeve kaydedilecek bölgedir; sol/üst/genişlik/yükseklik yüzde alanlarıyla
ayarlanır ve kullanıcı onaylar. İlk resim ana fotoğraftır; galeride ana yap,
değiştir, sil ve indir bulunur. Yeni ilandaki fotoğraflar ilan kaydedilene kadar
bellektedir; vazgeçme halinde sonraki ilana taşınmaz. Kaydedilmiş ilanların fotoğraf
işlemleri kendi onay düğmeleriyle anında saklanır.

Resimler cihazda canvas ile en fazla 1280 piksel JPEG'e küçültülür, kartlar için
400 piksel küçük resim üretilir. Canvas yeniden kodlaması EXIF metadatasını taşımaz.
Veri `motorradar-photos` IndexedDB veritabanında ilan ID'sine bağlı JPEG ikili verisi olarak
saklanır (WebKit uyumu için diskte ArrayBuffer, görüntülerken Blob); localStorage'a resim/base64 yazılmaz. Object URL'ler görünüm yenilenince
serbest bırakılır; kart resimleri lazy yüklenir. Depolama hatası ilan JSON'unu
silmez veya değiştirmez. Tarayıcı depolaması kalıcı yedek değildir; iOS alan baskısı,
site verilerini silme veya özel gezinme fotoğraf kaybına yol açabilir.

**JSON yedeği fotoğraf içermez.** Her fotoğrafı galerideki İndir ile ayrı JPEG olarak
Dosyalar'a kaydedin; orijinalleri Fotoğraflar/Dosyalar'da saklayın. Yeni cihazda önce
eski JSON yedeği yüklenir, sonra fotoğraflar ilgili karttan yeniden seçilir. Aynı
cihazdaki JSON geri yüklemesi aynı ilan ID'sini kullanırsa yerel fotoğraflar tekrar
görünür. Fotoğraf veritabanı ilan durum değişikliği veya JSON geri yüklemesinde
silinmez; gerek kalmayan fotoğrafları galeriden açıkça silebilirsiniz.

## OCR

Mevcut vendored Tesseract ve Türkçe model cihazda çalışır. Açık etiketler, para/km
birimleri ve yüksek güvenli, açık motosiklet adları okunur. Küçük desteklenen model
sözlüğü tüm modelleri kapsamaz. Yıl/şehir/başlık için açık etiket yoksa tahmin
edilmez; URL, düşük güven ve çelişkiler veri üretmez. Sonuç önce önizlemeye gelir.
Önizlemeyi onayla düğmesi yalnızca okuma başladığında ve onay anında boş olan
alanları doldurur. Mevcut veya bu sırada elle değiştirilen alanlara dokunmaz.

Ekran görüntüsü tarihsel bir görüntüdür; fiyat canlı doğrulanmış değildir. OCR ile
doldurulup değişmeden kaydedilen fiyat `priceSource: screenshot` etiketiyle gösterilir.
Elle yeni fiyat girilirse kaynak manual olur. Gmail bildirim fiyatı ayrı kalır.
İlk ekran görüntüsünden fotoğraf kırp düğmesi kullanıcıyı ayrı görsel onayına götürür;
tüm ekran otomatik ana fotoğraf yapılmaz. Özel bilgiler ve ekran başlıkları yerine
yalnız motosiklet bölgesini seçin. Kesin otomatik fotoğraf bölgesi tespiti iddiası yoktur.

## İlan bağlantısından veri — erişim sınırı ve adaptör tasarımı

Sahibinden'in resmî API veri taşıma süreci kurumsal mağaza, sözleşme ve yetkili
entegratör koşullarına bağlıdır; herkese açık rastgele ilan okuma yetkisi değildir.
Arabam için bu projeye verilmiş doğrulanmış bir API erişimi bulunmuyor. Bu nedenle
URL'den fotoğraf, canlı fiyat veya km indiren aktif adaptör yoktur. Mevcut izinli
link normalleştirme/model önerisi, manuel giriş ve yerel OCR kullanılabilir.

İleride yetki sağlanırsa adaptör sınırı şöyle olmalıdır:

- Girdi: doğrulanmış sağlayıcı + ilan ID'si; belgelenmiş erişim sözleşmesi ve
  sağlayıcının izin verdiği alanlar. Rastgele URL fetch/proxy yapılmaz.
- Çağrı: yalnız sözleşmedeki HTTPS uçları ve kota/hız limitleri. Gizli anahtar
  gerektiren sağlayıcı için kullanıcı tokenından ayrı, yetkilendirilmiş sunucu
  gerekir; tarayıcıya client secret eklenmez.
- Çıktı: `{provider, listingId, fetchedAt, fields, provenance}`. Yanıt şeması,
  yetki, tarih ve sayı aralıkları doğrulanır. Fotoğraf için kullanım/indirme hakkı
  ve MIME/boyut denetimi gerekir. Oturum/cookie/token cevaplara veya loglara konmaz.
- Uygulama: OCR gibi önizleme ve kullanıcı onayı; kullanıcı doğruladığı alanlar
  korunur. Bildirim zamanı, ekran görüntüsü zamanı ve API gözlem zamanı karıştırılmaz.
  Aktiflik veya güncel fiyat yalnız sağlayıcı gerçekten doğruluyorsa etiketlenir.
- Hata: timeout/izin/kota/eksik veri yerel kaydı değiştirmez; manuel/OCR alternatifi
  sunulur. CAPTCHA aşma, gizli proxy veya oturum kopyalama kullanılmaz.

Resmî kaynaklar (3 Kasım 2026):
- [Sahibinden API kullanımı ile veri transferi](https://yardim.sahibinden.com/hc/tr/articles/19780244786460-API-Kullan%C4%B1m%C4%B1-ile-Veri-Transferi)
- [Sahibinden kurumsal veri transferi yöntemleri](https://yardim.sahibinden.com/hc/tr/articles/19749005158172-Kurumsal-Emlak-ve-Vas%C4%B1ta-Ma%C4%9Fazalar%C4%B1na-Sunulan-Veri-Transferi-Y%C3%B6ntemleri)
- [Arabam resmî yardım](https://www.arabam.com/yardim/ilan-ver)

## Kontroller

`npm test`, `LOCAL_CHROMIUM=1 npm run test:safari -- --project=chromium` (sistemde
Chromium varsa), `npm run test:safari -- --project=iphone-webkit`. GitHub Actions
her iki tarayıcıyı kurup çalıştırır. Testler gerçek OCR, fotoğraf canvas/IndexedDB,
tekli/toplu arşiv, kota hatası, eski yedek, 320/375/390 px, Drive/Gmail regresyonları
ve çevrimdışı PWA'yı kapsar. WebKit profili gerçek iPhone donanım ve Fotoğraflar
seçicisinin yerini tam tutmaz; yayından önce gerçek iPhone Safari ve ana ekrana
eklenen PWA'da resim seçme, kırpma ve indirme denenmelidir.
