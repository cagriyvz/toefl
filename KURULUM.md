# 🚀 Lexi — Kurulum Rehberi

AI destekli İngilizce öğrenim platformu.

---

## 📁 Proje Yapısı

```
lexi-full/
├── backend/          ← FastAPI + PostgreSQL + Claude API
├── frontend/         ← React/Next.js bileşenleri
│   ├── auth.jsx          Login + Register ekranı
│   ├── teacher-panel.jsx Öğretmen paneli
│   ├── student-panel.jsx Öğrenci paneli
│   └── quiz-screen.jsx   Wext tarzı quiz ekranı
└── docs/
    └── mail-preview.html Haftalık rapor mail önizlemesi
```

---

## ⚡ Adım 1 — Gereksinimler

Bilgisayarında şunların kurulu olması gerekiyor:

| Araç | Versiyon | Nereden |
|------|----------|---------|
| Python | 3.11+ | python.org |
| PostgreSQL | 14+ | postgresql.org |
| Node.js | 18+ | nodejs.org |
| Git | herhangi | git-scm.com |

---

## 🗄️ Adım 2 — PostgreSQL Kurulumu

```bash
# Mac
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Veritabanı oluştur
psql -U postgres -c "CREATE DATABASE lexi_db;"
```

---

## 🔑 Adım 3 — API Anahtarları

### Anthropic (Claude AI)
1. https://console.anthropic.com adresine git
2. "API Keys" → "Create Key"
3. Kopyala → `sk-ant-...`

### Resend (Haftalık Mail)
1. https://resend.com adresine git (ücretsiz kayıt)
2. "API Keys" → "Create API Key"
3. Kopyala → `re_...`
4. "Domains" bölümünden alan adını ekle (veya test için `onboarding@resend.dev` kullan)

---

## 🐍 Adım 4 — Backend Kurulumu

```bash
cd lexi-full/backend

# Virtual environment oluştur
python -m venv venv

# Aktive et
source venv/bin/activate          # Mac/Linux
venv\Scripts\activate             # Windows

# Bağımlılıkları yükle
pip install -r requirements.txt
pip install resend schedule        # Mail servisi için ekstra

# .env dosyasını oluştur
cp .env.example .env
```

### .env Dosyasını Düzenle

```
DATABASE_URL=postgresql://postgres:ŞIFREN@localhost:5432/lexi_db
SECRET_KEY=rastgele-en-az-32-karakter-uzun-bir-şey
ANTHROPIC_API_KEY=sk-ant-xxxx
RESEND_API_KEY=re_xxxx
APP_URL=http://localhost:3000
```

> 💡 SECRET_KEY için terminalde şunu çalıştır:
> `python -c "import secrets; print(secrets.token_hex(32))"`

### Backend'i Başlat

```bash
# Tabloları otomatik oluşturur ve API'yi başlatır
uvicorn app.main:app --reload --port 8000
```

✅ `http://localhost:8000` → "Lexi API çalışıyor 🚀"
✅ `http://localhost:8000/docs` → Swagger UI (tüm endpointler)

---

## ⚛️ Adım 5 — Frontend Kurulumu (Next.js)

```bash
# Proje oluştur
npx create-next-app@latest lexi-app --typescript --tailwind --app
cd lexi-app

# Frontend dosyalarını kopyala
cp ../lexi-full/frontend/*.jsx src/app/components/
```

### Basit Sayfa Yapısı

```
src/app/
├── page.tsx              ← auth.jsx buraya
├── teacher/
│   └── page.tsx          ← teacher-panel.jsx buraya
├── student/
│   └── page.tsx          ← student-panel.jsx buraya
└── student/quiz/
    └── page.tsx          ← quiz-screen.jsx buraya
```

```bash
# Frontend'i başlat
npm run dev
```

✅ `http://localhost:3000` → Lexi arayüzü

---

## 📧 Adım 6 — Haftalık Mail Servisi

```bash
cd lexi-full/backend
source venv/bin/activate

# Mail servisini başlat (arka planda çalışır)
# Her Pazar 09:00'da otomatik gönderir
python -m app.services.mail_service
```

### Hemen Test Et (beklemeden)

`mail_service.py` dosyasının sonundaki şu satırın başındaki `#` işaretini kaldır:

```python
# run_weekly_reports()   ←  Bu satırı
run_weekly_reports()     ←  Böyle yap
```

Sonra çalıştır — tüm öğretmenlere hemen gönderir.

### Mail Önizlemesi

```bash
# Tarayıcıda aç
open lexi-full/docs/mail-preview.html
```

---

## 🏭 Production'a Alma (Railway)

En kolay yol Railway.app — ücretsiz başlar:

```bash
# Railway CLI kur
npm install -g @railway/cli
railway login

# Backend deploy
cd lexi-full/backend
railway init
railway add postgresql      # PostgreSQL otomatik ekler
railway up

# Environment variables ekle (Railway dashboard'dan)
# DATABASE_URL otomatik gelir
# ANTHROPIC_API_KEY, RESEND_API_KEY, SECRET_KEY ekle
```

---

## 🧪 İlk Test Senaryosu

1. `http://localhost:3000` → **Kayıt Ol** → Öğretmen seç
2. **Yeni Sınıf** → "10-A İngilizce" / B1
3. Join kodu not et (örn: `XK9P2M`)
4. Yeni sekme → **Kayıt Ol** → Öğrenci seç
5. **Sınıflarım** → Join kodu gir → Katıl
6. Öğretmen panelinde **Ödev Ata** → konu seç → Claude üretir
7. Öğrenci panelinde ödev görünür → çöz → not gelir

---

## 🆘 Sık Karşılaşılan Hatalar

| Hata | Çözüm |
|------|-------|
| `Connection refused 5432` | PostgreSQL servisi çalışmıyor — `brew services start postgresql` |
| `Invalid API key` | `.env` dosyasındaki `ANTHROPIC_API_KEY` yanlış |
| `CORS error` | Backend çalışıyor mu? `http://localhost:8000` aç |
| `Module not found` | `pip install -r requirements.txt` tekrar çalıştır |
| Mail gitmiyor | Resend dashboard'dan domain doğrulamasını yap |

---

## 📞 Destek

Sorun yaşarsan `http://localhost:3000` → Destek bölümünden ticket aç.
