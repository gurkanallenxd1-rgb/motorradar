# MotorRadar 3.6.2 Beta — Yan yana motor karşılaştırması

Akıllı Karar Sistemi ve Karşılaştır penceresi ortak kart görünümünü kullanır. İki aday iki kompakt sütunda kalır. Üç ve üzeri aday kendi yatay kaydırma alanında gösterilir; alan klavyeyle de kaydırılabilir. Çok sayıda aday için mevcut beşli sayfalama korunur.

Model, yıl, kilometre, doğrulanmış fiyat, puan, toplam alım maliyeti ve bütçe farkı kart üzerinde bulunur. Puan katkıları, maliyet kalemleri ve kullanıcı ekspertiz beyanları her kartın “Detayları göster” menüsündedir. Fark etiketleri tüm puanlı adaylara göre hesaplanır ve en yakın rakibe göre avantaj miktarını gösterir. Eşit puan tek kazanan anlamına gelmez.

Puanlama, fiyat doğrulama ve bütçe hesaplama fonksiyonları değiştirilmez. Doğrulanmamış fiyat kartta “Doğrulanmadı” olarak gösterilir. Girilmemiş giderler “Girilmedi” olarak ayrılır; mevcut hesaplamadaki sıfır kabulü sürer. Tarife veya ekspertiz tahmini yapılmaz. Kayıtlar, fotoğraflar, notlar, Gmail/Drive ayarları ve JSON yedek formatı değiştirilmez; migration yoktur. Sabit Karşılaştır çubuğunun gerçek yüksekliği güvenli alt boşluk olarak ayrılır.

Tarayıcı regresyonları iki ve üç kartı 320, 375 ve 390 px genişliklerde kontrol eder: sütun geometrisi, metin taşması, ayrıntı menüleri, kaydırma ve son ilanın sabit çubuk altında kalmaması. İlan JSON'u, ayarlar ve IndexedDB fotoğraf içerikleri okuma işlemlerinden sonra aynı kalmalıdır. Aynı testler Chromium ve iPhone WebKit projelerinde çalışır.
