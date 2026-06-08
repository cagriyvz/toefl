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

## 📝 Modlar
- **Skill quiz** — derste öğrendiğini anında geri bildirimle pekiştir
- **🩺 Tanı testi** — zayıf konuları bul
- **⏱️ Tam Deneme** — 25 dk / 40 soru (15 Structure + 25 Written), gerçek sınav gibi; süre dolunca otomatik biter, sonunda çözümlü değerlendirme
- **🔁 Tekrar Havuzu** — yanlış yaptığın tüm sorular otomatik birikir; doğru cevaplayınca havuzdan düşer

## 🌐 GitHub Pages'e yayınlama (telefondan çalışmak için)
Repoda hazır bir GitHub Actions workflow'u var (`.github/workflows/deploy-pages.yml`).
Tek seferlik kurulum:

1. Bu dal **main**'e merge edilir (PR'ı birleştir).
2. GitHub'da: **Settings → Pages → Source = "GitHub Actions"** seç.
3. Workflow otomatik çalışır; siten şu adreste yayınlanır:
   `https://<kullanıcı-adın>.github.io/<repo-adı>/`
   (örn. `https://cagriyvz.github.io/lexi-full/`)

Telefonda o adresi aç — anasayfaya kısayol ekleyerek uygulama gibi kullanabilirsin.
İlerleme telefonun tarayıcısında (`localStorage`) saklanır.

> Alternatif: statik olduğu için Netlify veya Vercel'e de sürükle-bırak yüklenebilir.
