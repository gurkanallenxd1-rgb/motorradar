# MotorRadar 3.1 ve güvenli otomatik eşitleme planı

## Şu anda çalışan akış

1. Kendi hesabındaki özel Google Apps Script, Sahibinden/Arabam e-posta bildirimlerini okur.
2. Tarihsel fiyat değişimlerini ve desteklenen ilan bağlantılarını özel Google Drive içindeki MotorRadar-Gmail-Guvenli-v2.json dosyasına yazar.
3. Kullanıcı iPhone'da JSON'u indirir ve MotorRadar'da Gmail ilanlarını aktar butonuyla önizleyerek aktarır.
4. 3.1 arayüzünde Gmail ve manuel kayıtları, ilan durumlarını filtreleyebilir; tarihsel Gmail fiyatlarını ve tarihlerini görebilir. Eski fiyat güncel fiyat değildir.

## 3.1 veri düzeltme

- Gmail'den gelen bağlantı biçimindeki bozuk başlıklar gösterimde düzeltilir.
- Yamaha Yamaha MT-25 gibi marka/model tekrarı gösterimde kaldırılır.
- Gmail kayıtlarını düzelt butonu sadece Gmail kayıtlarındaki açık URL model isimlerini ve bozuk otomatik başlıkları değiştirir; önce JSON yedeği indirir.
- Manuel kayıtlar, notlar, fiyat, kilometre, yıl, favoriler, durumlar ve fiyat geçmişi korunur.
- Gmail bildirim fiyatı 250.000 TL altı filtresi geçmiş bildirime göre çalışır; canlı piyasa fiyatı veya satılık ilan doğrulaması değildir.
- Eksik kilometre, yıl ve aktiflik durumu doldurulmaz.

## Tam otomatik senkronizasyon için gerekenler

GitHub Pages üzerindeki herkese açık statik uygulamaya Gmail parolası, Drive erişim anahtarı veya OAuth yenileme tokenı konulmamalıdır. Apps Script'i herkese açık, geliştirici hesabı olarak çalışan veri servisi halinde dağıtmak özel bildirimleri sızdırabilir.

Önerilen sonraki adım: Kullanıcının Google Identity Services üzerinden OAuth yetkilendirmesi yapması ve Google Drive Picker ile yalnızca MotorRadar JSON dosyasını seçmesi. Bunun için kullanıcının Google Cloud projesinde OAuth istemcisi, geçerli JavaScript origin ve ilgili API izinleri gerekir. Uygulama Drive dosyasını HTTPS ile okur, erişim tokenını yalnızca tarayıcı belleğinde tutar.

Site açıkken izin ve oturum süresince belirli aralıklarla eşitleme yapılabilir. Safari kapalıyken, iPhone kilitliyken veya OAuth erişimi sona erdiğinde GitHub Pages'in arka planda güvenilir zamanlanmış iş çalıştıracağı varsayılamaz. Tam arka plan eşitleme için ayrıca güvenli sunucu / uygun yetkilendirme altyapısı gerekir.

## Kaynaklar

- Google Drive JavaScript quickstart: https://developers.google.com/workspace/drive/api/quickstart/js
- Google Apps Script web app izinleri: https://developers.google.com/apps-script/guides/web
