# MotorRadar 3.7.4 Beta — Satın Alma ve Ekspertiz

İlan kartında tek giriş vardır: **Satın Alma ve Ekspertiz**. Aynı penceredeki üç sekme masraf/bütçe, kaynak/teklif ve ekspertiz kontrollerini açar. Bütçe, karşılaştırma ve aday kartları yalnız `MotorPurchaseCosts.calculate` sonucunu kullanır. `MotorSelector.costs` eski yedek uyumluluğu için tutulur; ürün ekranında hesap otoritesi değildir.

## Saklama ve onay

- `motorradar-v1` ve `motorradar-costs-v37` anahtarları ve veri biçimleri korunur. Açılışta migration veya yazma yoktur. IndexedDB ve fotoğraf kodu değiştirilmez.
- Onaylı yeni tutar önceliklidir. 500 TL onaylı bakım, eski kayıttaki 0 TL ile ezilmez. Kayıtlı tutar, onay ve sonuç bakım/parça/diğer alanlarının yanında görünür. Mevcut onay ekran açılışında sıfırlanmaz; kullanıcı tutarı değiştirdiğinde yeni onay gerekir.
- Eski kalemler salt okunurdur. Karşılaştırma eski tutarı, yeni bütçe tutarını, iki depolama kaynağını, fiyatın kaynak türünü ve yeni−eski farkını gösterir. Bütçeye girmeyen onaysız tutar bilinmiyor olarak kalır.
- **Eski kayıttan aktar** yalnız seçilen ilanın seçilen kalemini, açık onay penceresinden sonra aktarır. Yeni kalemin üzerine yazılacağı açıklanır. İptal hiçbir veri yazmaz. Eski kayıt korunur. Aktarım gider/teklif onayını kaldırır; eski 0 TL hiçbir zaman kendiliğinden onay sayılmaz.
- Eski sigorta tutarı tarih ve onay gerektiren taslaktır. Eski ekspertiz tutarı farklı firmanın manuel senaryosudur; adlandırılmış sağlayıcının doğrulanmış teklifi haline gelmez.
- Eski `transfer` noter/devir toplamı, harç ve işlem bedelini ayırmaz. Çift harç saymamak için otomatik eşlenmez. Arayüz, kaynak/teklif sekmesinde işlem bedelinin harçtan ayrı girilmesini açıklar.
- Başka sekmedeki senaryo/ilan değişiklikleri üzerine yazılmaz; yeniden açma istenir. Başarısız depolamada önceki hesap ve kayıt korunur.
- Ekspertiz, önceki kontrol seçimlerini ve notları gösterir. Kullanıcı düzenlerse yalnız ilgili kaydın ekspertiz bölümü güncellenir; eski maliyetler, ek alanlar ve diğer ham ilan kayıtları korunur.

## Fiyat ve bütçe kuralları

Resmî hesap, manuel senaryo, kullanıcı onaylı gerçek teklif, yayımlanmış sağlayıcı fiyatı ve bilinmeyen gider türleri ayrı etiketlenir. Kaynak ve tarih ayrıntıları korunur. SBM tavan primi yalnız referanstır ve bütçeye girmez. Eksik kalem veya doğrulanmış motor fiyatı yoksa tam bütçe/kalan bütçe üretilmez.

220.000 TL R25, 2.000 TL manuel noter işlem bedeli, 1.000 TL kaynaklı devir harcı, 1.511 TL kaynaklı ruhsat, 4.500 TL yayımlanmış ekspertiz ve 500 TL onaylı bakım için bilinen ara toplam **229.511 TL** olur. Sigorta/parça/diğer onayları eksikken 290.000 TL bütçe için kesin toplam gösterilmez.

## Doğrulama

`tests/unified-purchase.test.cjs` hesap, onay, tek kalem aktarımı, ilan ID ayrımı ve 81 kayıtlı yedek turunu doğrular. `tests/browser/unified-purchase.spec.cjs` üç sekmeyi, iptal/onay, depolama hatası, sekmeler arası çakışma, önceki ekspertiz, 81 ilan ve fotoğraf baytlarını, 320/375/390px taşmayı doğrular. Mevcut yedekleme, entegrasyon ve diğer regresyon testleri korunur; eski ekran testleri birleşik sekmelere yönlendirilmiştir.

PWA yalnız statik cache sürümünü `motorradar-static-v3.7.4-beta` olarak yeniler; kullanıcı verisi veya IndexedDB silinmez. JSON yedekleri fotoğraf içermediği bilgisini korur.
