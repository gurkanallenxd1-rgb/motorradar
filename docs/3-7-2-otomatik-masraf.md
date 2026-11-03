# MotorRadar 3.7.2 Beta

Başlangıç: 3 Kasım 2026 tarihinde GitHub API ile doğrulanan main `9668ac33dd66f42db1f13cd5c06610ba30a2bd4a`. Kaynak fiyatları veya doğrulama tarihleri bu sürüm için değiştirilmedi.

Her ilanın Masraf Araştırması ekranındaki **Masrafları otomatik araştır** düğmesi aynı origin kaynak dosyasını yeniden indirir, şemayı ve geçerlilik tarihlerini değerlendirir. Mevcut dosya kullanıldığında “Daha önce kaydedilmiş fiyat kullanıldı” der. Yeni dosya, canlı sağlayıcı araştırması veya yeni kişisel teklif olarak adlandırılmaz. Ağ veya PWA yedek cache hatası açıkça belirtilir. Manuel senaryolar araştırma sırasında yazılmaz.

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
