# MotorRadar 3.7.3 Beta — Akıllı Masraf Yönetimi

Başlangıç: güncel main `65ec89770e7e987f9cc02a528edeb15650ae2182`. Feature branch ve PR ile teslim edilir; otomatik merge yoktur.

Masraf kartları resmî hesap, kullanıcı girişi, kullanıcı onaylı gerçek teklif, sağlayıcı yayını ve bilinmeyen/eski tutarı ikon, metin ve renkle ayırır. Kaynaklar, tarihler ve uzun açıklamalar varsayılan kapalıdır. Manuel/kaynaklı karşılaştırma ayrı Düzenle düğmesiyle açılır. 1.000 TL manuel ruhsat ile uygulanabilir 1.511 TL kaynak tutarı arasındaki fark +511 TL gösterilir. Kaynaklı tutarı kullanmak manuel değeri silmez; tekrar manuel tutara dönülebilir. Kaynakta tutar değişirse kabul edilmiş yeni seçim için yeniden onay gerekir.

Ruhsat için belge düzenleme ihtiyacı ve tarife geçerliliği kontrol edilir. Kapsam bilinmiyorsa kaynak tutarı ve kullanım düğmesi gösterilmez. Noter tarifesinin alt kalemleri işlem toplamına çevrilmez; tam tutarın uygulanabilir işlem türlerini içeren kaynak kaydı olmadıkça otomatik toplam üretilmez. Mevcut binde iki/asgari harç kuralları değiştirilmedi. Kaynak dosyasındaki ücretler ve doğrulama tarihleri değiştirilmedi.

SBM tavanı yalnız referanstır; poliçe giderine veya toplam bütçeye eklenmez. Sigorta için kullanıcının aldığı tutar, tarih ve onay gerekir. Kimlik/poliçe alanı eklenmedi. Ekspertiz yayını tahmini pakettir, randevu öncesi fiyat ve kapsam teyidi gerekir. Eski Farklı firma tutarı yalnız custom seçiliyken manuel giderdir. Yeni gerçek teklif alanı firma kimliği, tarih ve açık onayla ilişkilidir; firma değişince onay kaldırılır. Paket ve teklif karşılaştırılır, bütçede yalnız seçili gider bir kez toplanır.

Doğrulanmış motor fiyatı eksikse “Motor fiyatı eksik, tam bütçe hesaplanamaz” gösterilir; kalan bütçe gösterilmez. Bilinen kalemlerin ara toplamı ve eksik kalem sayısı ayrı sunulur. Tamamlanmamış giderlerle kesin toplam üretilmez. Mevcut bütçe tercihi (290.000 TL dahil) okunur, değiştirilmez.

`motorradar-v1`, `motorradar-costs-v37`, fotoğraf IndexedDB ve kurtarma anahtarları korunur. Migration, otomatik silme yoktur. Yeni onay/tarih/tutar/firma alanları güvenli JSON doğrulamasına eklendi. Eski senaryolar geçerlidir. 81 ilan testi sentetik kayıtlarla yapılır; gerçek cihazdaki ilanlara erişilmedi. Fotoğraf byte kontrolü, JSON/Drive/Gmail/OCR/favori/geçmiş regresyonları mevcut testlerde korunur. PWA statik cache anahtarı 3.7.3 Beta olarak yenilendi.

Gerçek iPhone üzerinde henüz test edilmedi. Yerel WebKit kurulumu indirme alan adlarının ağ politikasınca 403 ile engellenmesi nedeniyle başarısız; iPhone WebKit testi motor bulunamadığından başlatılamadı. GitHub Actions Node, Chromium ve iPhone WebKit çalıştırır; güncel sonuç PR üzerinde izlenir.

Yerel doğrulama: Node 102/102; Chromium tüm regresyon paketi 54/54 geçti. 320, 375 ve 390 piksel testlerinde masraf kartları, açık karşılaştırma ve düzenleme alanlarında yatay taşma görülmedi. WebKit CI sonucu PR açıklamasında ayrıca bildirilir.
