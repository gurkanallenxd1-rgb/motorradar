# MotorRadar 3.5 Beta

Başlangıç: main `386975c90c1a3db26150959faef96ba0e3f33d58` (3.4 fotoğraf düzeltmeleri dahil).

Akıllı Motor Seçici yalnız kayıtlı Yamaha MT-25, Yamaha R25 ve KTM Duke 250 adaylarını kullanır. Satıldı, Kaldırıldı ve Vazgeçtim adaylardan çıkarılır. Fiyat, yıl veya km eksik/geçersizse puan üretilmez; en az iki tam aday gerekir. Model yılı gelecek yıl olamaz, kilometre sıfır olabilir.

Tam adaylar arasında fiyat ve km azaldıkça, yıl arttıkça doğrusal puan yükselir. Fiyat katkısı 0–50, km 0–30, yıl 0–20; aynı değere sahip kriter ağırlığının yarısını alır. Katkılar toplanır ve ekranda ayrı gösterilir. En yüksek beş aday öne çıkarılır. Bu, mevcut örneklere göre bir tercih sıralamasıdır; piyasa değeri veya mekanik kalite iddiası değildir. Donanım, kazasızlık, şase veya bakım beyanları puanı değiştirmez.

## Fiyat doğrulama

Düzenle ve hızlı fiyat formlarında kullanıcı ayrıca “fiyatı ilanda şimdi kontrol ettim” kutusunu işaretler. `verifiedPrice` ve `priceVerifiedAt` ayrı alanlardır. Fiyat değişirse eski doğrulama kullanılamaz. Aynı fiyat yeniden doğrulanabilir; fiyat geçmişine yinelenen nokta eklenmez. Son durum kontrolü `lastCheckedAt` fiyat doğrulaması sayılmaz. OCR uygulamak kutuyu sıfırlar; Gmail aktarımı doğrulanmış fiyatı değiştirmez. Eski kayıtlar korunur ve doğrulanmamış görünür.

Bütçe varsayılan 250000 TL'dir; ayrı `motorradar-budget` tercihiyle değiştirilebilir. Yeni panel doğrulanmış fiyata göre uygun/aşan/bilinmeyen gruplarını gösterir. Eski Gmail istatistikleri açıkça tarihsel bildirim fiyatı olarak kalır.

Gmail v2 düşüşleri tarih sırasıyla gösterilir, eş ilan/tarih/eski-yeni fiyat tekrarları panelde tek gösterilir. Aktarımda mevcut bildirimleri 100'e kırpan sınır kaldırıldı; eski kayıtlar silinmez. Uygulama canlı site izlemez veya kapalı iPhone'a bildirim göndermez.

Karşılaştırmada ilk seçilen ilana göre fiyat, yıl ve km farkı gösterilir. Fiyat farkı için iki fiyatın da onaylı olması gerekir. Eksikler ve bağımsız mekanik/şase/kaza ekspertizi gereksinimi belirtilir.

## Veri ve PWA

`motorradar-v1`, IndexedDB şeması, fotoğraf kodu, OAuth/Drive yapılandırması değişmedi. Migration ve otomatik ilan silme yoktur. Ek doğrulama alanları JSON yedeklerinde korunur. Fotoğraflar mevcut ayrı IndexedDB alanında kalır. Statik cache `motorradar-static-v3.5-beta`; selector.js önbelleğe dahildir. Bağımlılık eklenmedi.

## Testler

`npm test` ve `npm run test:safari` (Chromium + iPhone 13 WebKit). Yeni testler doğrulama, tarih, aynı fiyat geçmişi, fiyat değişimi, eski kayıtlar, bütçe sınırı/tercihi, eksik bilgi, kapalı ilanlar, katkılar, olay tekrarları, farklar ve 320/375/390px genişlikleri kapsar. Gerçek iPhone donanım testi yerine Playwright iPhone 13 WebKit profili kullanılır.
