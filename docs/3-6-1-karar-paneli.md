# MotorRadar 3.6.1 Beta — karar paneli

Başlangıç: güncel main `27f2d270a6846b5480e3f396a13ce880e5dba6d0` (3.6 Beta).

Koyu site içinde `#F1F4F8` karar paneli. Özet ve Adaylar açık; Puan detayları, aday detayları, puanlanamayan adaylar ve Gmail düşüşleri başlangıçta kapalıdır. Native `details/summary` klavye ve Safari etkileşimini sağlar. Bölümlerin açık/kapalı durumu panel yeniden çizilirken korunur.

Özet, puanlanabilen aday sayısını, en yüksek puanı/eşitliği ve doğrulanmış **satış fiyatına** göre bütçe sayılarını gösterir. Eşitlikte tek kazanan seçilmez. Aday kartlarında **toplam alım maliyetine** göre bütçe durumu, kalan/aşan tutar gösterilir; satış fiyatı bütçeye uysa bile giderlerle aşım varsa kırmızı bütçe uyarısı çıkar. Geçersiz giderde uygunluk ilan edilmez.

İlk beş puanlı aday gösterilir; devam düğmesi beşer aday ekler, sonrasında ilk beşe döner. Puanlanamayanlar kapalı bölümde eksik bilgileriyle bulunur. Kart detayında mevcut puan katkıları, altı gider kalemi, kullanıcı beyanı ekspertiz özeti ve düzenleme düğmesi vardır. Girilmemiş giderlerin 0 sayıldığı açıkça belirtilir. Hiçbir mekanik sonuç veya fiyat tahmin edilmez.

`selector.js` puanlama, maliyet, ağırlık ve eşitlik fonksiyonları değiştirilmedi. `motorradar-v1` yükleme/yazma, ilan JSON yedekleme/içe aktarma, IndexedDB fotoğrafları, Gmail, Drive, OCR, arşiv ve favori kodları değiştirilmedi. Otomatik migration/silme ve yeni bağımlılık yok. JSON yedek biçimi korunur. Sürüm 3.6.1 Beta, PWA cache `motorradar-static-v3.6.1-beta`.

Kontroller: `npm test`; `LOCAL_CHROMIUM=1 npx playwright test --project=chromium --workers=2 --timeout=90000`; `npx playwright test --project=iphone-webkit`. Yeni tarayıcı testleri 320/375/390px, uzun başlıklar, native klavye aç/kapat, 40 aday, 50/100 eşitliği, gider kaynaklı bütçe aşımı, katkılar, kullanıcı ekspertizi, kapalı eksikler ve kayıtların değişmemesini kapsar. Gerçek cihaz VoiceOver/donanım testi yapılmadı.

Yerel ortamda WebKit ikilisi yoktu; kurulum `cdn.playwright.dev` ve `playwright.download.prss.microsoft.com` için ağ politikası 403 yanıtı verdi. PR'ın mevcut GitHub Actions akışı Chromium ve iPhone WebKit kurup tüm testleri ayrıca çalıştırır. Chromium tam paketi gerçek OCR için 90 saniyelik test sınırıyla çalıştırılır; varsayılan 30 saniye OCR senaryosu için yetersiz kalabilir.
