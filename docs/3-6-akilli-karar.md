# MotorRadar 3.6 Beta — Akıllı Karar Sistemi

Başlangıç: güncel main `8b4d4f77d6cded25af54b61409499c2166b5b98c` (3.5).

Akıllı Karar Sistemi paneli üstteki özet satırıyla açılıp kapanır. Fiyat, kilometre ve yıl ağırlıkları varsayılan %50/%30/%20'dir; 3.5'in doğrusal normalizasyonu ve eksik veri kuralları korunur. Her kriter eşitse ağırlığının yarısı verilir. Toplam %100 değilse açık uyarı gösterilir ve puan üretilmez. Geçerli tercihler `motorradar-weights` anahtarında cihazda saklanır; yeniden açılışta son geçerli tercih kullanılır. Toplamı otomatik değiştirmez. Sıfır ağırlık, eksik kriteri gizlemez.

Karşılaştırma tablosu aynı ağırlıkları kullanır, katkıları ayrı gösterir. Eşit puanlar açıkça belirtilir; kayıt kimliğine göre gösterim sırası bir üstünlük anlamına gelmez. Bütçe aşımı puandan çıkarmaz. Satıldı / Kaldırıldı / Vazgeçtim kayıtlarının 3.5'teki aday dışı davranışı korunur. Eski ilan analizi (2.3) kendi medyan ve yıllık kilometre yöntemiyle ayrı çalışmaya devam eder.

Her ilanın **Maliyet / Ekspertiz** düğmesi altı gider alanını açar: trafik sigortası, noter/devir, ekspertiz, ilk bakım, öngörülen parça giderleri ve diğer. Alanlar 0 başlar; boş alan 0 kabul edilir. Güncel tarife tahmini yoktur. Toplam yalnız eşleşen `verifiedPrice` / `priceVerifiedAt` doğrulaması olan satış fiyatına giderleri ekler. Geçersiz veya negatif gider kaydedilmez. Bütçe varsayılan 250.000 TL; mevcut `motorradar-budget` tercihi korunur. Toplam, kalan tutar ve aşım anında hesaplanır; toplam maliyet sıralamayı değiştirmez. Bütçe panelinin mevcut grupları doğrulanmış satış fiyatına göredir; toplam alım maliyeti ayrıca gösterilir.

On ekspertiz maddesinin her biri başlangıçta **Kontrol edilmedi**; kullanıcı **Sorunsuz** veya **Sorun var** seçebilir ve ek not yazabilir. Sonuçlar kullanıcı beyanıdır. Sistem mekanik, hasar veya şase durumunu tahmin etmez; ekspertiz beyanları puanı etkilemez.

Giderler `listing.decision.costs`, ekspertiz `listing.decision.inspection` altında aynı ilanda saklanır. Eski `motorradar-v1` kayıtları okunurken migration veya otomatik yazma/silme yapılmaz. Yeni alanlar mevcut JSON dışa/içe aktarmasıyla taşınır. IndexedDB fotoğraf şeması ve kodu, Gmail v2, Drive/OAuth yapılandırması, doğrulama fiyatı/tarihi ve geçmiş değiştirilmez. Tercihler mevcut davranış gibi cihazda kalır; ilan JSON yedeği fotoğrafları veya cihaz tercihlerini içermez.

Statik PWA cache `motorradar-static-v3.6-beta`. Yeni bağımlılık yoktur.

Doğrulama: `npm test`; `LOCAL_CHROMIUM=1 npx playwright test --project=chromium`; `npx playwright test --project=iphone-webkit`. Mevcut GitHub Actions her iki tarayıcıyı da kurup tüm testleri çalıştırır. Yeni testler varsayılan/custom ağırlıklar, geçersiz toplam, eşitlik, eksik veri, maliyet ve bütçe aşımı, bağımsız ilan giderleri, ekspertiz/not kalıcılığı, eski alanların korunması ve 320/375/390px genişliklerini kapsar. WebKit profili gerçek iPhone donanım testinin yerini tutmaz.
