# MotorRadar 3.7.1 Beta

Başlangıç: güncel main `df42d4381e275da839b6190052dbc0e44ba16d96`. Kaynak kontrolü: 3 Kasım 2026 (İstanbul). Yeni bağımlılık eklenmedi.

## Resmî kaynaklar ve sınırlar

- [SBM Kasım duyurusu](https://sbm.org.tr/tr/trafik-sigortasi-azami-brut-prim-tablosu) ve duyurunun bağladığı [Kasım PDF'i](https://sbm.org.tr/UploadContent/Documents/Trafik_Azami_Prim_2026_Kas%C4%B1m.pdf) yeniden incelendi. PDF erişimi/ayrıştırması başarısız. Üretim prim satırları boş; başka basamak veya ay üzerinden hesaplama yok. İl, motosiklet/yük motosikleti sınıfı, kullanım profili ve basamak birebir eşleşir. Desteklenmeyen profil bilinmiyor kalır. Eski tarife tarihli olarak gösterilir fakat satın alma bütçesini tamamlamaz. Kullanıcının gerçek sigorta teklifi, tarih ve tutarıyla ayrı gösterilir; resmî tavan teklif değildir.
- [7566 sayılı Kanun, madde 7](https://www.resmigazete.gov.tr/eskiler/2025/12/20251219-1.htm): 1 Ocak 2026 itibarıyla binde 2, asgari 1.000 TL satış/devir harcı. Yetki belgeli tacir **alıcıya tescilli araç devri** istisnası korunur; ilk tescil aynı istisnaya sokulmaz. Diğer istisnalar otomatik yorumlanmaz. [GİB açıklaması](https://gib.gov.tr/mevzuat/kanun/435/ozelge/38837) uyarınca matrah kasko değerinin altında olamaz; ekranda noterle matrah teyidi istenir. 2027'ye otomatik taşıma yok.
- [HMB resmî Değerli Kağıtlar Tebliği 97](https://ms.hmb.gov.tr/uploads/sites/3/2025/12/2026-Degerli-Kagitlar-Tebligi-a3f95f2236d8ad45.pdf), madde 3, tablo 12: **motorlu araç tescil belgesi 1.511 TL**, madde 5: yürürlük 1 Ocak 2026. PDF metni ve tablo görüntüsü kontrol edildi. Ruhsat bedeli noter ücretinden ayrı kalemdir. Belge düzenleme ihtiyacı ve istisnalar işlemde teyit edilmelidir.
- [Adalet Bakanlığı 2026 Noterlik Ücret Tarifesi](https://higm.adalet.gov.tr/Resimler/SayfaDokuman/202512301701273242026%20YILI%20NOTERL%C4%B0K%20%C3%9CCRET%20TAR%C4%B0FES%C4%B0.pdf) ve [26 Ağustos değişikliği](https://higm.adalet.gov.tr/Home/SayfaDetay/2026-yili-noterlik-ucret-tarifesinde-degisiklik-yapilmasina-dair-tarife-resm-gazete-de-yayimlandi26082026100125) bağlı PDF'i okundu. Değişiklik yalnız madde 11 yol ödeneği/masrafına ilişkin. Harç, noter ücreti, sayfa/yazı ve tescil bedelleri aynı şey değildir. İşleme özgü **toplam noter işlem bedeli bilinmiyor**; genel tarife oranlarından eksik işlem toplamı üretilmez. Kullanıcı girişi tahmini senaryodur.

## Ekspertiz yayınları

[Atölye Ataşehir](https://motoatolye.com.tr/ekspertiz) 125–499 cc paketini 6.000 TL yayımlıyor; R25, MT-25 ve Duke 250 hacim aralığına uyar. [MotoCV'nin 10 Nisan 2026 tarihli yayını](https://motocv.com/blog/motosiklet-ekspertiz-fiyatlari-2026), Avcılar için Eko 1/Eko 2 5.000 TL, Standart 7.000 TL ve Plus 9.000 TL paketlerini kapsamlarıyla listeliyor. Bunlar 3 Kasımda görülen **yayın fiyatlarıdır**; yeni kişisel teklif veya fiyat garantisi değildir. Yayın tarihi ile erişim/doğrulama tarihi ayrı tutulur. Geçerlilik dönemi ve KDV durumu teyitsizdir; randevuda teyit edilir. Önceki Yamanlar kayıtları erişim hatası ve teyitsiz fiyat uyarısıyla korunur.

Otomatik yeniden kullanım/erişim izni doğrulanmadığından periyodik scraping açılmadı. Kaynak başına gerekçe `data/cost-access-policy.json` içinde; haftalık denetim eksik/eski/erişilemeyen kayıtları gerekçeleriyle inceleme kuyruğuna koyar. Denetim fiyatı veya son doğrulama tarihini yenilemez.

## PDF ve kanıt akışı

Yerel resmî PDF için `node scripts/inspect-sbm.cjs work/sbm.pdf <resmî-belge-url>` çalıştırılır. PDF imzası, boyut, metin çıkarma süresi/boyutu kontrol edilir; `pdftotext` yoksa veya PDF taranmış/bozuk/şifreliyse hata inceleme kuyruğuna gider. Okunabilir metin bile tablo düzeni doğrulanmadan prim verisine dönüşmez. `work/sbm-extracted.txt` ve `work/sbm-inspection.json` yereldir; belge hash'i korunur. Bu sürümde doğrulanmış SBM PDF düzeni olmadığı için otomatik satır ayrıştırıcısı etkinleştirilmedi.

İnsan incelemesinden geçmiş satırlar `scripts/import-costs.cjs` kanıt akışına alınır. Her yeni SBM satırında `province`, `step`, `amount`, `vehicleClass`, `usageProfile`, `sourceUrl`, `validFrom`, `validTo`, `verifiedAt` zorunludur. Kaynak belgesi URL/hash'i audit kanıtıyla eşleşmelidir. Aynı il/basamakta farklı profiller ayrıdır; tekrarlı aynı profil reddedilir. Veri ve audit önce geçici dosyada hazırlanır, audit hazırlanamazsa kaynak verisi değiştirilmez. Değişiklikler PR incelemesiyle yayımlanır.

## Yedekleme ve veri koruma

JSON dışa aktarma artık `costScenarios` alanında `motorradar-costs-v37` senaryolarını taşır. Eski `listings` yedekleri kabul edilir; senaryo alanı yoksa mevcut senaryolar korunur. Yeni yedekler de eski uygulamanın ilan alanını taşır. Fotoğraflar **JSON'a dahil değildir**; Fotoğraflar ekranındaki İndir ile ayrıca saklanır.

İçe aktarma önizlemesi yeni, güncellenecek ve korunacak ilan/senaryo sayılarını gösterir. Önce mevcut verilerin ayrı JSON yedeği indirilir, ardından kullanıcı kutuyu işaretleyip aktarımı onaylar. Eşleşen ID'ler güncellenir; diğer ilanlar/senaryolar tutulur. Çakışan bağlantı/ID ve geçersiz senaryolar yazmadan reddedilir. İçe aktarma fotoğraf IndexedDB'sine erişmez.

Depolamada ayrı içe aktarma öncesi kopya ve işlem günlüğü tutulur. Kota hatasında iki anahtar geri alınır; sekme işlem ortasında kapanırsa sonraki açılışta eski ham veriler geri yüklenir. Önizleme sırasında başka sekme veriyi değiştirirse işlem iptal edilir. Son işlem öncesi kopya “İçe aktarma öncesi yedeği indir” düğmesiyle tekrar indirilebilir. Bu kopya yalnız son içe aktarma öncesini saklar; cihaz depolamasının temizlenmesine karşı indirilen dosya saklanmalıdır.

## Arayüz ve regresyonlar

Yan yana kartların detaylarında kaynak ve tarih gösterilir. Kesinleşen, tahmini ve bilinmeyen kalemler hem yazı hem renkli kenarla ayrılır. Eksik kalemlerde kesin toplam gösterilmez. 320/375/390 px iPhone düzeni test kapsamındadır. PWA sürümü/cache `3.7.1-beta`; hatalı kaynak payload'u son doğrulanmış cache'i değiştirmez. Gmail, Drive, OCR, fotoğraf sistemi ve karşılaştırma modülleri korunur.

81 ilan fixture'ı, fotoğraf byte'ları, eski/yeni yedek, önizleme/iptal/onay, kota hatası, kesilen işlem kurtarması, eşzamanlı değişiklik, profil eşleşmesi, eski tarife, PDF hataları, bütçe ve PWA hatalı veri senaryoları test edilir. Test sonuçları PR açıklamasındadır.
