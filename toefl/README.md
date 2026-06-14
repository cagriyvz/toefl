# 📘 TOEFL Structure — Çok Kullanıcılı Çalışma Platformu

"Green TOEFL Structure" (Longman/Phillips) kitabının **Structure & Written Expression**
bölümünü bir haftada bitirmek için interaktif platform. Giriş/kayıt, backend, sınırsız
soru üreteci, detaylı açıklamalar, ilerleme senkronu ve lider tablosu içerir.

## ✨ Özellikler
- **📅 7 günlük plan** — 25 dilbilgisi becerisi (Skill) mantıklı günlere bölünmüş
- **📖 Dersler** — her Skill'in gramer kuralı + örnekler + kilit kural kutusu
- **♾️ Sınırsız soru üreteci** — her konuda **100+** taze soru; **her denemede sorular yenilenir** (prosedürel üretim, `js/generators.js`)
- **🔍 Şık şık detaylı açıklama** — sadece doğru cevap değil, **her yanlış şıkkın neden yanlış olduğu** tek tek anlatılır
- **🩺 Tanı testi** — zayıf konuları bulup öncelik listesi çıkarır
- **⏱️ Tam Deneme** — 25 dk / 40 soru (15 Structure + 25 Written), gerçek sınav gibi; sonunda çözümlü değerlendirme
- **🔁 Tekrar Havuzu** — yanlış yapılan her soru birikir; doğru cevaplanınca düşer
- **👤 Giriş / Kayıt + Backend** — ilerleme ve tüm loglar sunucuda; **her cihazdan erişim**
- **🏆 Lider Tablosu** — diğer öğrencilerle kıyas (çok kullanıcılı)
- **📱 Mobil uyumlu** — telefon/tablet için duyarlı arayüz, menü
- **🌐 Offline (misafir) mod** — backend yoksa her şey `localStorage` ile çalışır

## 🗂️ Yapı
```
toefl/
├── index.html            uygulama kabuğu
├── css/style.css         arayüz + mobil uyum
├── js/
│   ├── curriculum.js     25 skill: dersler + yedek soru bankası
│   ├── generators.js     PROSEDÜREL soru üreteci (100+/konu, sonsuz tazelik)
│   ├── api.js            backend istemcisi (+ offline fallback)
│   └── app.js            router + quiz motoru + auth + ilerleme
└── backend/
    ├── server.py         FastAPI + SQLite (auth, log, ilerleme, lider tablosu)
    ├── requirements.txt
    └── (toefl.db otomatik oluşur — git'e girmez)
```

## 🚀 Çalıştırma

### A) Tek komutla (backend + uygulama birlikte) — önerilen
```bash
cd toefl/backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
# Tarayıcıda:  http://localhost:8000
```
Backend hem API'yi (`/api/...`) hem de uygulamayı (`/`) servis eder. Giriş/kayıt, ilerleme
senkronu ve lider tablosu burada aktiftir.

### B) Sadece frontend (misafir mod)
`toefl/index.html`'i doğrudan tarayıcıda aç — backend olmadan da çalışır,
ilerlemen tarayıcında saklanır (giriş/lider tablosu olmaz).

## 🔌 API Uçları
| Uç | Açıklama |
|----|----------|
| `POST /api/register` · `POST /api/login` | kayıt / giriş (token) |
| `GET /api/me` | kullanıcı + ilerleme |
| `POST /api/attempt` | bir testi (practice/exam/diagnostic/review) kaydet |
| `POST /api/event` | öğrenme logu |
| `GET /api/progress` | beceri/sınav özetleri |
| `GET /api/leaderboard` | ilk 20 öğrenci |

## 🌐 Yayınlama
- **Frontend (statik):** GitHub Pages workflow'u hazır (`.github/workflows/deploy-pages.yml`).
  Misafir modda yayında çalışır. Pages'i açmak için: PR'ı **main**'e merge → **Settings → Pages → Source: GitHub Actions**.
  Adres: `https://<kullanıcı>.github.io/<repo>/`
- **Tam özellik (giriş + lider tablosu):** backend'i bir sunucuda çalıştır (ör. Railway/Render),
  sonra uygulamada **Giriş ekranı → "Sunucu adresi (gelişmiş)"** alanına backend URL'sini gir.
  Tüm öğrenciler aynı sunucuya bağlanıp lider tablosunda yarışır.

## 🧠 Soru üreteci nasıl çalışır?
Her skill için kelime havuzlu şablonlar var. Üreteç, gramer açısından **garanti doğru** bir
cümle kurar; çeldiricileri o skill'in tam hata tipine göre üretir ve her şık için Türkçe
açıklama yazar. Kombinasyon sayısı her konuda 100'ün çok üstünde olduğundan her oturumda
farklı sorular gelir.
