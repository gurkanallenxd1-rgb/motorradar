# MotorRadar 3.7 Beta — kaynaklı satın alma bütçesi

3 Kasım 2026 kontrolü. Başlangıç: main `d4551590f9233e93198ad4f2d7a9bb7f71302a92` (3.6.2). Bu sürüm yayımlanmış ücret ile gerçek teklifi ayırır. Fiyatı kullanıcı tarafından doğrulanmış satış bedeli kullanılır; ilanlar taranmaz.

## Kaynak araştırmasının sonucu

- [GİB 7566 sayılı Kanun](https://www.gib.gov.tr/mevzuat/kanun/651), [Resmî Gazete, 7566 md.7](https://www.resmigazete.gov.tr/eskiler/2025/12/20251219-1.htm): 2026 ilk tescil ve tescilli araç satış/devir harcı binde 2, asgari 1.000 TL. Yetki belgeli ikinci el taşıt taciri **alıcıya tescilli araç devri** istisnadır; ilk tescile uygulanmaz. Diğer işlem/istisnalar otomatik hesaplanmaz. 2027 için 2026 tarifesi devralınmaz.
- Noter işlem bedeli ve ruhsat ayrı kalemdir. [2026 değerli kâğıt tebliği](https://www.resmigazete.gov.tr/eskiler/2025/12/20251224-6.htm) doğrudan okunamadı; ikincil sitelerin rakamları resmî doğrulanmış ücret diye eklenmedi. Kullanıcı tutar girebilir, tahmini senaryo olarak işaretlenir.
- [SBM](https://sbm.org.tr/tr/trafik-sigortasi-azami-brut-prim-tablosu), Kasım 2026 duyurusu görüldü. Bağladığı PDF indirilemedi/ayrıştırılamadı. **Üretim verisinde prim rakamı yoktur.** İl (81 plaka kodu) ve 0–8 basamak seçimi hazırdır; doğrulanmış satır eklenene kadar bilinmiyor gösterir. Başka il/basamaktan türetme yapılmaz. Kapsam: gerçek kişi, özel kullanım, elektrikli olmayan motosiklet, engelli indirimi yok. Farklı profiller için yetkili sigortacıya başvurulur. Gerçek teklif yalnız kullanıcının girdiği tutar/tarihtir; tavan yerine geçmez.
- [Yamanlar Alibeyköy motosiklet paketi](https://yamanlarotoekspertizalibeykoy.com/motosiklet-ekspertiz-paketi) ve [Çekmeköy](https://www.yamanlarotoekspertizcekmekoy.com/motosiklet-ekspertiz-paketi) sağlayıcı yayınlarının arama dizininde 4.500 TL görülüyor. Doğrudan erişim 502 olduğundan güncel teyit sayılmaz. Konum, motosiklet kapsamı, kontrol tarihi ve erişim hatası gösterilir. Geçerlilik dönemi yayımlanmamış; kesin ücret/teklif değildir. [Sağlayıcı merkez paket sayfası](https://yamanlarotoekspertiz.com/paketler) motosiklet hizmetini ve yayımlanmış 4.500 TL bedeli ayrıca doğruluyor; bu, şubedeki güncel fiyat garantisi değildir.
- İlk bakım ihtiyacı ve parça değişimi ilan verisinden uydurulmaz. Kullanıcı tutarı girip onaylar; gerekmeyen gideri açıkça 0 girerek onaylayabilir.

## Statik site ve güncelleme

`data/cost-sources.json` tarihli kaynak anlık görüntüsüdür. Güncel tarife kapsamı ve erişim durumu çalışma anında değerlendirilir. Ağdan gelen kaynak dosyası hatasında service worker son önbelleğe alınan sürümü döndürür; kayıt içindeki doğrulama tarihleri korunur. Hiç doğrulanmış veri yoksa tutar bilinmiyor olur. Veri dosyası network-first, diğer varlıklar mevcut statik cache yaklaşımındadır.

Otomatik toplama/yayımlama hakkı doğrulanmadığı için üretimde dış sitelere periyodik scraping açılmadı. `cost-access-policy.json` bu kararı kaynak bazında kaydeder. Pazartesi 09:20 İstanbul saatinde GitHub Actions doğrulama/güncellik kuyruğunu artifact olarak üretir; fiyatı veya doğrulama tarihini yenilemez. PR workflow'u da aynı denetimi çalıştırır. Bu, **otomatik fiyat güncellemesi değildir**; otomatik erişim koşulları doğrulanana kadar güvenli alternatiftir. Schedule workflow main'e merge edilmeden çalışmaz.

Manuel doğrulama alternatifi:

1. Kaynak belgeyi resmî/sağlayıcı URL'sinden alıp `work/` altında tut. SBM PDF satırlarını il, basamak ve yukarıdaki profil ile birebir eşleştir; oran çarpanlarıyla prim üretme. Kaynak dönemi ve indirim profilini ikinci kez kontrol et.
2. `work/candidate.json` dosyasında `{ "data": <tam kaynak JSON'u>, "audit": { "reviewedAt": "YYYY-MM-DD", "evidence": [{"sourceUrl":"https://...", "sha256":"<belge SHA-256>"}] } }` hazırla. Geçerlilik başlangıç/bitişi, checkedAt, verifiedAt ve access değerlerini sadece gerçek inceleme ile değiştir. Paket dönem belirtilmiyorsa null kalmalı.
3. `node scripts/import-costs.cjs work/candidate.json work/evidence.pdf` çalıştır. Alan adı/şema, tekrarlı SBM satırı, tutarlar ve kanıt hash'leri kontrol edilir. Değişen her kaynağın belgesi gerekir. Başarısız import mevcut dosyayı değiştirmez. Tam belge repoya aktarılmaz; kaynak URL/hash inceleme kaydı tutulur.
4. Diff, Node ve iki tarayıcı testini incele; veri güncellemesi için ayrı PR aç. Otomatik merge yoktur. Yeni kaynak/kanun veya otomatik erişim adaptörü ayrı kod incelemesi gerektirir; politika bayrağını değiştirmek tek başına veri indirmez.

## Cihaz verisi ve eski özellikler

Araştırma yalnız `motorradar-costs-v37` tercihini kullanıcı değişiklik yaptığında yazar. Açma/okuma/araştırma otomatik olarak `motorradar-v1`, `motorradar-budget`, Drive, IndexedDB fotoğrafları veya mevcut JSON yedeklerini değiştirmez. Migration yok. Yeni senaryolar eski JSON yedeğine eklenmez; cihaz tarayıcı depolaması temizlenirse kaybolur. Eski Maliyet/Ekspertiz ekranı, kontrol listesi ve kullanıcı girişleri korunur; kart bütçesi yeni kaynaklı senaryoyu kullanır. Eski manuel kalemler otomatik onaylanmaz.

Kartlarda kesinleşen, tahmini ve bilinmeyen kalemler ayrılır. Eksik tutar sıfır değildir: yalnız eksik kalemli ara toplam gösterilir. Paket/tavan/kullanıcı bakım gideri olan tam hesap bile tahmini senaryo toplamıdır. Yan yana farklarda tam toplam bilinmiyorsa yalnız bilinen ek gider farkı açık etiketle verilir.

T.C. kimliği, telefon, poliçe veya erişim tokenı alanı yoktur. Dış teklif bağlantısı kullanıcıyı yetkili sigortacı sitesine götürür; kişisel bilgi MotorRadar üzerinden aktarılmaz. Kullanıcı senaryoları GitHub'a gönderilmez.
