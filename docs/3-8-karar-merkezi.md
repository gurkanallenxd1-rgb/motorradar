# MotorRadar 3.8 Beta — Satın Alma Karar Merkezi

3.7.4 tek satın alma sistemi üzerine kurulur. Aktif R25, MT-25 ve Duke 250 kayıtları mevcut puan sistemi ve yan yana kaydırılan kartlarla karşılaştırılır. Fiyat / kilometre / yıl avantajları tüm puanlı adaylara göredir; seçili karşılaştırmanın farkları ayrıca ilk ilana göre gösterilir.

Kartlarda kullanıcı beyanına dayalı tamamlanan, bekleyen ve sorunlu kontrol sayıları ile şase, motor, kaza, ruhsat ve bakım durumları görünür. Tam kontrol listesi ve not düzenleme mevcut Satın Alma ve Ekspertiz penceresindedir. Kontroller mekanik sağlık veya satış garantisi oluşturmaz.

Bütçe yalnız `MotorPurchaseCosts.calculate` çıktısından gelir. Eski `decision.costs` tutarları salt okunur kalır ve toplama eklenmez. Eksik giderler açılır listede adlarıyla gösterilir. Bilinen ara toplam bütçeyi aşarsa tam toplam bilinmese de en az aşım tutarı gösterilir. Kaynak türleri ve tarihler mevcut detaylarda korunur.

Onaylı ama boş / null / girilmemiş bakım, parça, diğer gider ve gerçek teklif tutarları “Tutar eksik” görünür. Açıkça girilmiş sayısal 0 geçerlidir. Onaylı boş ekspertiz teklifi yayımlanmış paket fiyatına geri düşmez.

Depolama anahtarları ve IndexedDB şeması değiştirilmez. Otomatik aktarım, migration, silme veya varsayılan onay yoktur. Yalnız statik PWA cache sürümü yenilenir; önceki statik cache temizleme davranışı korunur. Kaynak yenileme ve eski tutarı açık onayla aktarma davranışı 3.7.4 ile aynıdır.

Doğrulama: Node testleri; Chromium ve iPhone WebKit projeleri. Yeni karar merkezi testi 81 kaydı, fiyat geçmişini, Gmail/OCR alanlarını, Drive/JSON sentinel verilerini, ekspertiz notlarını ve IndexedDB fotoğraf byte'larını salt okunur gezinme / yeniden yükleme boyunca karşılaştırır. 320 / 375 / 390 px taşma, eksik gider, onay ve bütçe aşımı kontrol edilir. Bunlar sentetik test kayıtlarıdır; kullanıcının cihazındaki canlı verilere erişilmez.
