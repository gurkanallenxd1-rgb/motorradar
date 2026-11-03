# MotorRadar 4.0 Beta

İlan kartları fotoğraf, model, fiyat, yıl, kilometre ve kısa durum etiketlerini öne çıkarır. Masraflar, Ekspertiz ve Notlar karttan açılır; kayıt tarihleri, manuel kontrol, fotoğraf yönetimi ve diğer işlemler açılır bölümlerde tutulur.

İlan çalışma ekranında Özet, Masraflar, Ekspertiz, Teklifler, Notlar ve Durum sekmeleri bulunur. Sekmeler ok tuşları, Home ve End ile kullanılabilir. Karşılaştırma kartları yan yana kalır; hesap ayrıntıları ve ekspertiz kontrolleri açılır bölümlerdedir.

Durum satırları mevcut yedi görevi, durum rozetini, kayıtlı bilgiyi ve Düzenle kontrolünü gösterir. Yüzde, kullanıcı tarafından tamamlandı işaretlenen görevlerin oranıdır. Eksik kaynak veya ekspertiz uyarıları tamamlanma yüzdesinden bağımsızdır.

## Veri sınırı

- `motorradar-v1`, `motorradar-costs-v37` ve `motorradar-preparation-v39` anahtarları değişmedi. Yeni veri sistemi veya başlangıç migrasyonu yok.
- Hesaplama, ekspertiz kaydı ve görev kayıt algoritmaları korunur. JSON biçiminde yalnız uygulama sürümü 4.0.0-beta oldu.
- Fotoğraflar IndexedDB içinde kalır; JSON yedeğine dahil değildir. Eski yedeklerin birleştirilmesi ve aktarım öncesi ayrı yedek/onay akışı korunur.
- Gmail, Drive, OCR, fiyat geçmişi ve kaynak veri dosyaları değiştirilmedi.
- PWA kabuk önbelleği `motorradar-static-v4.0-beta`. Eski kabuk önbellekleri mevcut aktivasyon davranışıyla temizlenir; kullanıcı verileri silinmez.

## Kontrol kapsamı

Yeni ürün testleri 81 ilanla 320/375/390 px genişlikleri, altı sekmeyi, yatay taşmayı, üçlü karşılaştırmayı, görev kalıcılığını ve salt okunur gezintinin localStorage değerlerini değiştirmemesini denetler. Mevcut testler JSON, fotoğraf baytları, eski senaryolar, kota hataları ve sekme çakışmalarını kapsar.

Playwright iPhone profili emülasyondur. Fiziksel iPhone Safari ve ana ekrana eklenmiş PWA ayrıca cihaz üzerinde kontrol edilmelidir.
