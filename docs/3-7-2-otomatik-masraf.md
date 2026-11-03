# MotorRadar 3.7.2 Beta

Başlangıç: 3 Kasım 2026 tarihinde GitHub API ile doğrulanan main `9668ac33dd66f42db1f13cd5c06610ba30a2bd4a`. Kaynak fiyatları veya doğrulama tarihleri bu sürüm için değiştirilmedi.

Her ilanın Masraf Araştırması ekranındaki **Kaynak dosyasını yenile** düğmesi yalnız sitenin yayımlanmış kaynak dosyasını yeniden indirir, şemayı ve geçerlilik tarihlerini değerlendirir. Mevcut dosya kullanıldığında “Daha önce kaydedilmiş fiyat kullanıldı” der. Yeni dosya, canlı sağlayıcı araştırması veya yeni kişisel teklif olarak adlandırılmaz. Ağ veya PWA yedek cache hatası açıkça belirtilir. Manuel senaryolar araştırma sırasında yazılmaz.

## Kaynaklar ve erişim sınırları

[3.7.1 kaynak dosyası](../data/cost-sources.json) resmî mevzuat, 2026 tescil belgesi ve İstanbul paketleri için korunur. 2026 binde 2 / en az 1.000 TL harç hesabı ve yetki belgeli alıcı istisnası korunur. Matrahın kasko değerinden düşük olamayacağı ekranda belirtilir; matrah ve diğer istisnalar noterle teyit edilmelidir. Ruhsat 1.511 TL yalnız belge gereken işlem için önerilir. “Hayır” seçiminde sıfır, “Bilinmiyor” seçiminde bilinmeyen kalır. Mevcut manuel tutar varsayılan olarak korunur; kaynak tutarı seçilse de eski rakam senaryoda saklanır. Tutarı elle yeniden düzenlemek manuel seçimi geri getirir. Noter işlem toplamı doğrulanmış kapsam bulunmadığından bilinmiyor kalır; tarife alt kalemleri toplanarak sahte toplam üretilmez.

SBM Kasım 2026 PDF'inin üretim satırları hâlâ boş. Doğrulanmış PDF satırı olmadığında sigorta fiyatı bilinmiyor kalır. İl, sınıf, kullanım, basamak ve kaynak dönemi birebir eşleşmelidir. Tavan prim kişisel teklif değildir. Gerçek teklif tutarı ve tarihi yalnız yetkili sağlayıcıdan alındığına dair kullanıcı onayı sonrasında saklanır. Önceki tutarlar silinmez. Kimlik veya poliçe alanı yoktur.

Ekspertiz listesi Alibeyköy, Çekmeköy, Ataşehir ve Avcılar paketlerini ilçe filtresi ve artan fiyat sıralamasıyla gösterir. Konum izni veya mesafe uydurulmaz; kullanıcı yakın ilçeyi seçebilir. Paketler “Yayımlanmış fiyat, teyit gerekli” etiketi taşır. Erişim hatası olan yayınlar önceki kayıt olarak açıklanır. Süresi geçmiş paket hesapta bilinmiyor olur; tarihsiz yayın yalnız tahmini senaryodur.

## Güvenli Actions araştırması

`cost-audit.yml`, `scripts/research-costs.cjs` aracılığıyla araştırma raporunu artifact olarak üretir. İçerik yazma yetkisi yoktur, main veya kaynak dosyası otomatik değiştirilmez. Dış erişim ancak gözden geçirilmiş tam HTTPS kaynak adresi, izin belgesi adresi, izin inceleme tarihi ve `automatedAccess: true` birlikte varsa yapılır. Yönlendirmeler kapalı, istek zaman aşımı 15 saniye, belge sınırı 20 MB'dır. SBM belge incelemesi hash, PDF metni ve hata raporu üretir; tanınmayan tabloda satır üretmez. Mevcut izin dosyasında hiçbir kaynak için otomatik yeniden kullanım izni doğrulanmadığından tüm dış kaynaklar **atlandı** olarak raporlanır. Bu çalışma ortamında dış sağlayıcı ağ erişimi de izinli değildir; canlı PDF veya fiyat kontrolü yapıldığı iddia edilmez.

Yeni fiyat ancak mevcut `import-costs.cjs` kanıt incelemesi ve kod incelemeli PR ile yayımlanır. Tarayıcıdan Actions tetiklemek için token istenmez; GitHub Pages CORS kısıtı aşılmaya çalışılmaz. İzin veya doğrulanabilir tablo olmadan otomatik canlı fiyat güncellemesi bu sürümde sağlanamaz.

## Örnekler (290.000 TL bütçe)

| İlan | Satış | Harç | Ruhsat (belge gerekiyorsa) | Bilinen ara toplam | Bilinenlerden sonra kalan |
|---|---:|---:|---:|---:|---:|
| R25 · 2022 · 33.000 km | 220.000 | 1.000 | 1.511 | 222.511 | 67.489 |
| MT-25 · 2024 · 19.000 km | 285.500 | 1.000 | 1.511 | 288.011 | 1.989 |

Bunlar kesin toplam değildir. Sigorta, noter işlem toplamı, seçilmemiş ekspertiz, onaysız bakım/parça/diğer giderler eksiktir. Seçilen ekspertiz yayını ayrıca tahmini kalem olarak eklenir. Yan yana karşılaştırma korunur.

`motorradar-v1`, `motorradar-costs-v37`, fotoğraf IndexedDB ve önceki içe aktarma kurtarma anahtarları korunur. Migration veya otomatik silme yoktur. Yeni senaryo alanları güvenli JSON yedeklemesine dahildir. Başka sekmede senaryo değişirse yazma reddedilir. Güncelleme hatasında kaynak ve manuel kayıtlar korunur.

## 3 Kasım 2026 — dürüst yenileme açıklaması ve entegrasyon değerlendirmesi

Buton adı ve tıklama öncesi açıklama artık gerçek işlemi belirtir. Değişmiş JSON dosyası alındığında da dış sağlayıcılardan canlı fiyat alınmadığı açıkça yazılır. Actions çıktısı atlanan kaynak sayısını bildirir; atlama başarılı araştırma diye sunulmaz. PWA statik cache anahtarı yeni açıklamanın çevrimdışı sürüme de geçmesi için yenilendi.

| Aday | Entegrasyon için gereken | Bu oturumdaki sonuç |
|---|---|---|
| SBM resmî azami prim tablosu ve PDF | Otomatik erişim/yeniden kullanım izni, erişilebilir dönem PDF'i, doğrulanmış il/sınıf/profil/basamak satırları | İzin kaydı yok; mevcut PDF satırları boş. Prim üretilmez. Tavan kişisel teklif yerine kullanılmaz. |
| Resmî Gazete / GİB harç mevzuatı | Erişim izni ve işlem kapsamına göre insan incelemesi | Mevcut politika izin vermiyor; yeni doğrulama tarihi yazılmaz. |
| Adalet Bakanlığı noter tarifesi | İzin, yürürlük/değişiklik takibi, araç işlem kapsamı | Alt kalemlerden toplam ücret çıkarılmaz; manuel tutar korunur. |
| HMB tescil belgesi tarifesi | İzinli erişilebilir belge, doğru tablo satırı ve geçerlilik | Önceki yayımlanmış kayıt korunur; bu oturumda yeniden doğrulanmadı. |
| Ekspertiz sağlayıcılarının kendi yayınları | Her sağlayıcıdan otomatik erişim ve yeniden kullanım izni, kapsam ve tarih doğrulaması | Hiçbir izin kaydı doğrulanmış değil; paket fiyatlarına dokunulmaz. |

Bu değerlendirme mevcut kaynak URL'leri, erişim politikası ve entegrasyon kodunun incelenmesine dayanır. Bu oturumda Resmî Gazete, Adalet Bakanlığı, HMB ve SBM belge adreslerine yapılan HEAD istekleri ortamın proxy ağ politikası tarafından 403 Forbidden ile engellendi; resmî siteler, robots ve kullanım koşulları yeniden okunamadı. Bu, kaynakların dünyada erişilemez veya kesinlikle izinsiz olduğunu kanıtlamaz. Doğrulanmış uygun kaynak bulunamadığından canlı güncelleme eklenmedi, izinler genişletilmedi ve fiyatlar/doğrulama tarihleri değiştirilmedi.

Doğrulama: kilitli bağımlılıklarla Node 98/98 ve Chromium masraf testleri 5/5 geçti. Yeni tarayıcı testi değişmiş kaynak dosyası, eski cache ve bozuk JSON yanıtlarında 81 ilanı ve manuel noter/ruhsat/sigorta tutarlarını karşılaştırır; yalnız aynı origin kaynak JSON isteğini doğrular. iPhone WebKit çalıştırması tekrar denendi; motor kurulu değil ve indirme alan adları ağ politikasıyla engelli olduğundan testler doğrulanamadı. Önceki CI sonuçları bu değişikliğin sonucu olarak sunulmaz.

PR #21 birleştirildikten sonra bu düzeltmeler güncel main `1df123c` üzerinden oluşturulan `fix/3-7-2-source-refresh-label` dalına taşındı. PWA cache anahtarı yenilendi; ilan, fotoğraf, manuel senaryo ve yedek depolarına migration veya silme eklenmedi. Güncel CI sonuçları yeni PR açıklamasında izlenir.
