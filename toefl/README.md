# 📘 TOEFL Structure — 7 Günlük Çalışma Uygulaması

"Green TOEFL Structure" (Longman/Phillips) kitabının **Structure & Written Expression**
bölümünü bir haftada bitirmek için hazırlanmış, kurulum gerektirmeyen interaktif çalışma uygulaması.

## ✨ Özellikler
- **7 günlük plan** — 25 dilbilgisi becerisi (Skill) mantıklı günlere bölünmüş
- **Dersler** — her Skill'in gramer kuralı + örnekler + kilit kural kutusu
- **Quizler** — iki soru tipi: *Structure* (boşluk doldurma) ve *Written Expression* (hata bulma)
- **Anında geri bildirim** — her sorudan sonra doğru cevap + Türkçe açıklama
- **🩺 Tanı testi** — 20 soruluk karışım, zayıf konularını bulup öncelik listesi çıkarır
- **📊 İlerleme takibi** — gün gün ve skill skorları, tarayıcında (`localStorage`) saklanır
- Tamamı **statik** — backend, build, internet (font hariç) gerektirmez

## 🚀 Çalıştırma

En basit yol — dosyayı doğrudan aç:
```bash
# toefl/index.html dosyasını tarayıcıda aç
```

Ya da küçük bir yerel sunucu ile (önerilir):
```bash
cd toefl
python3 -m http.server 5500
# tarayıcıda: http://localhost:5500
```

## 📂 Yapı
```
toefl/
├── index.html          uygulama kabuğu
├── css/style.css       arayüz
└── js/
    ├── curriculum.js   müfredat: 25 skill + dersler + soru bankası
    └── app.js          router + quiz motoru + ilerleme takibi
```

## 📅 Plan Özeti
| Gün | Konu | Skiller |
|-----|------|---------|
| 1 | Cümlenin temeli: Özne & Fiil | 1–4 |
| 2 | İki cümleyi birleştirmek: Bağlaçlar | 5–8 |
| 3 | Adjective clause'lar | 9–10 |
| 4 | Özne–fiil uyumu | 11–13 |
| 5 | Paralel yapı & Fiil formları | 14–18 |
| 6 | İsimler & Zamirler | 19–23 |
| 7 | Sıfat & Zarf + Genel tekrar | 24–25 |

## 🌐 Yayınlama (opsiyonel)
Statik olduğu için herhangi bir yere konabilir: GitHub Pages, Netlify, Vercel.
GitHub Pages için: repo ayarları → Pages → kaynağı bu klasör olarak seç.
