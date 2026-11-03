# MotorRadar 3.9 Beta — Satın Alma Asistanı

Her ilanın **Satın Alma Hazırlığı** bölümünde yedi görev bulunur: güncel fiyat, trafik sigortası teklifi, noter/ruhsat giderleri, bağımsız ekspertiz, şase/motor/kaza geçmişi, bakım geçmişi ve lastik/zincir/fren giderleri. Her görev kullanıcı tarafından Yapılmadı, Devam ediyor, Tamamlandı veya Sorun var olarak değiştirilebilir.

Yüzde yalnızca kullanıcı tarafından Tamamlandı işaretlenen görevleri sayar (tamamlanan / 7, yuvarlanmış). Mekanik güvenilirlik puanı değildir. Kayıtlı fiyat doğrulama tarihi, MotorPurchaseCosts.calculate çıktısı ve mevcut ekspertiz beyanları okunur; hiçbir görev otomatik tamamlanmaz. Teklif veya rapor ücreti, ekspertizin yapıldığını kanıtlamaz. Eksik sigorta teklifi, doğrulanmamış fiyat ve sorunlu şase gibi uyarılar kullanıcı görevi tamamladı dese de görünür kalır. Bağımsız ekspertizin tamamlanması kullanıcı beyanıdır; uygulama raporu doğrulamaz.

R25, MT-25 ve Duke 250 ilanlarını Karşılaştır kutularıyla seçip karşılaştırma ekranında hazırlığı, bütçeyi ve kritik eksikleri yan yana inceleyebilirsiniz. Fiyatı henüz doğrulanmamış ilanlar da seçilerek karşılaştırılabilir. 3.8 karar puanları ve birleşik maliyet hesabı değiştirilmedi.

## Veri koruma

- Görevler ayrı `motorradar-preparation-v39` localStorage anahtarında, ilan kimliği ve görev bazında durum / son değişiklik tarihiyle saklanır. Görev değiştirmek `motorradar-v1`, `motorradar-costs-v37`, Gmail, Drive veya IndexedDB fotoğraflarına yazmaz.
- Başlangıçta veri migrasyonu, silme veya varsayılan görev yazımı yoktur. Bozuk görev kaydı otomatik sıfırlanmaz; hata gösterilir ve düzenleme engellenir.
- JSON yedeği `purchasePreparation` alanını içerir. Eski yedekler görevleri korur. Yeni yedekler yalnız gelen görevleri birleştirir; diğer ilanlar ve görevler silinmez.
- İçe aktarma önizlemesi görev sayısını gösterir; mevcut zorunlu önceki yedeği indirme ve kullanıcı onayı korunur. Kurtarma kopyası, yarım kalan aktarımı geri alma ve başka sekme denetimi görev kayıtlarını da kapsar.
- Fotoğraflar eskisi gibi JSON dışında tutulur. Görevler için sunucu veya yeni izin gerekmez. PWA kabuk önbelleği `motorradar-static-v3.9-beta` oldu.

## Doğrulama

- Güncel main 3.8 Beta (`78d9b9f`) temel alındı; önce Node testleri çalıştırıldı.
- Node: 24 test dosyası geçti; görev ilerlemesi, eksik veri, dört durum, teklif/ekspertiz ayrımı, XSS, 81 ilan, eski yedek uyumluluğu, kota hataları, işlem geri alma ve sekme çakışması dahil.
- Yerel sistem Chromium: mevcut 59 tarayıcı testi ve yeni satın alma asistanı testleri çalıştırıldı. Yeni akış 320/375/390px ekranlarda karşılaştırma, kalıcılık, JSON ve IndexedDB fotoğraf korumasını denetler.
- İlk sandbox `npm ci` denemesi proxy bağlantısında `EPERM` aldı. İzinli ortam erişimiyle `npm ci` başarılı oldu.
- Playwright tarayıcı indirmeleri `cdn.playwright.dev` ve `playwright.download.prss.microsoft.com` üzerinde ağ politikası nedeniyle `403 Domain forbidden` aldı. `--with-deps` sistem kurulumu ayrıca root parolası nedeniyle başarısız oldu. Sistem Chromium'u kullanılabildi; yerel iPhone WebKit tarayıcısı indirilemedi ve testler başlatılamadı. Bu testler geçmiş sayılmaz.
- GitHub Actions mevcut workflow ile Node, Chromium ve iPhone WebKit projelerini çalıştırır. PR üzerindeki nihai CI sonucu ayrıca raporlanır. Emülasyon fiziksel iPhone Safari/PWA testi yerine geçmez.
