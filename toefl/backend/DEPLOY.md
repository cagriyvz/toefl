# 🚀 Backend'i yayına alma (diğer öğrenciler için)

Backend yayına alınınca herkes kayıt olur, ilerlemesi kaydedilir ve lider tablosunda
yarışır. Backend hem API'yi hem de uygulamanın kendisini servis eder — yani tek bir
URL yeterli. Aşağıda 3 yol var; en kolayı **Railway**.

---

## Seçenek 1 — Railway (en kolay, ~2 dk)
1. https://railway.app → GitHub ile giriş yap.
2. **New Project → Deploy from GitHub repo** → `cagriyvz/lexi-full` seç.
3. Servis ayarlarında **Root Directory** = `toefl/backend` yap.
4. Railway `railway.json`'ı okur ve otomatik başlatır. **Generate Domain** ile bir URL al
   (ör. `https://toefl-production.up.railway.app`).
5. O URL'yi aç → uygulama gelir. Kayıt ol, çalış. Arkadaşlarına da bu URL'yi ver.

> 💾 Kalıcı veri için: Railway'de servise bir **Volume** ekle (mount path `/var/data`) ve
> değişken olarak `TOEFL_DB_DIR=/var/data` tanımla. Aksi halde her deploy'da veriler sıfırlanır.

---

## Seçenek 2 — Render (ücretsiz, kalıcı diskli)
1. https://render.com → GitHub ile giriş.
2. **New → Blueprint** → repoyu seç. Render `toefl/backend/render.yaml`'ı kullanır
   (kalıcı 1GB disk + `TOEFL_DB_DIR` dahil).
3. Deploy bitince verilen URL'yi aç.

> Not: Render ücretsiz katmanda servis bir süre trafik almazsa uykuya geçer; ilk istek yavaş açılır.

---

## Seçenek 3 — Docker (herhangi bir sunucu / Fly.io)
`toefl/` klasöründen (build context = toefl):
```bash
docker build -f backend/Dockerfile -t toefl .
docker run -p 8000:8000 -v $(pwd)/data:/var/data -e TOEFL_DB_DIR=/var/data toefl
# → http://localhost:8000
```

---

## Frontend'i ayrı yayınlamak istersen (GitHub Pages)
Uygulama Pages'te **misafir modda** çalışır. Giriş + lider tablosu için, açılan giriş
ekranında **"Sunucu adresi (gelişmiş)"** alanına yukarıda aldığın backend URL'sini gir.
Bu adres tarayıcında saklanır; tüm öğrenciler aynı backend'e bağlanır.

> CORS zaten tüm kökenlere açık (`allow_origins=["*"]`), Pages'ten backend'e istek atılabilir.
