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

## Seçenek 4 — VPS (Hostinger/DigitalOcean) + kendi domain'in  ⭐ kalıcı, profesyonel
Tek komutla: kalıcı Postgres + uygulama + **otomatik HTTPS** (Caddy). `docker-compose.yml`
ve `Caddyfile` repoda hazır (`toefl/` klasöründe).

**1) Domain'in DNS'ini VPS'e yönlendir**
Domain panelinde (Hostinger/Cloudflare vb.) bir **A kaydı** ekle:
```
Tip: A    İsim: @     Değer: <VPS_IP_ADRESİN>
(www için de:  A   www   <VPS_IP>)
```

**2) VPS'e bağlan, Docker kur** (Ubuntu):
```bash
ssh root@<VPS_IP>
curl -fsSL https://get.docker.com | sh
```

**3) Projeyi çek ve başlat:**
```bash
git clone https://github.com/cagriyvz/lexi-full.git
cd lexi-full
git checkout claude/toefl-study-app-Nh7L1   # uygulamanın olduğu dal
cd toefl
cp .env.example .env
nano .env        # DOMAIN, ADMIN_PASSWORD, DB_PASSWORD, (AI_API_KEY) doldur
docker compose up -d --build
```

**4) Bitti** → `https://alanadin.com` açılır (Caddy ücretsiz SSL'i otomatik alır, ~1 dk).
- Veriler `dbdata` volume'unda **kalıcı** (yeniden başlatma/deploy silmez).
- Güncelleme: `git pull && docker compose up -d --build`

> Domain yoksa: VPS IP'siyle `http://<VPS_IP>` de çalışır ama HTTPS için domain şart.

---

## Frontend'i ayrı yayınlamak istersen (GitHub Pages)
Uygulama Pages'te **misafir modda** çalışır. Giriş + lider tablosu için, açılan giriş
ekranında **"Sunucu adresi (gelişmiş)"** alanına yukarıda aldığın backend URL'sini gir.
Bu adres tarayıcında saklanır; tüm öğrenciler aynı backend'e bağlanır.

> CORS zaten tüm kökenlere açık (`allow_origins=["*"]`), Pages'ten backend'e istek atılabilir.
