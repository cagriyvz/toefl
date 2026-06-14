# 🚀 Ayrı repoda canlıya çekme — `toefl-hazirlik`

Bu uygulama tamamen **kendi içinde bağımsızdır** (`toefl/` klasörü = tam proje:
frontend + backend + deploy dosyaları). Ayrı bir repoya taşımak çok kolay.

> Not: Otomatik açamadım çünkü bu ortamdaki GitHub entegrasyonunun **repo oluşturma
> yetkisi yok**. Aşağıdaki adımlarla 2 dakikada sen yayınlarsın.

## Yöntem 1 — Hazırlama scriptiyle (önerilen)
Bilgisayarında repoyu klonladıktan sonra:
```bash
cd lexi-full/toefl
bash publish.sh toefl-hazirlik
```
Script üst klasörde `toefl-hazirlik/` adında standalone, git'i hazır bir kopya oluşturur.
Sonra:
1. https://github.com/new → ad: **toefl-hazirlik**, boş bırak (README ekleme).
2. ```bash
   cd ../toefl-hazirlik
   git remote add origin https://github.com/<KULLANICI>/toefl-hazirlik.git
   git push -u origin main
   ```

## Yöntem 2 — Elle (script olmadan)
```bash
# yeni boş bir klasöre toefl içeriğini kopyala
cp -r lexi-full/toefl toefl-hazirlik
cd toefl-hazirlik
rm -rf backend/__pycache__ backend/toefl.db*
# Render kullanacaksan: backend/render.yaml içinde 'rootDir: toefl/backend' -> 'rootDir: backend'
git init && git add . && git commit -m "TOEFL Structure platformu"
git branch -M main
git remote add origin https://github.com/<KULLANICI>/toefl-hazirlik.git
git push -u origin main
```

## Canlıya alma (yeni repo için)
`backend/DEPLOY.md` rehberini izle. Standalone repoda **Root Directory = `backend`**
(monorepo'daki `toefl/backend` değil). Railway/Render/Docker üçü de hazır.

Yayına alınınca backend hem API'yi hem uygulamayı tek URL'den sunar; arkadaşlarına
o URL'yi ver, herkes kayıt olup lider tablosunda yarışsın.

## AI açıklamayı açmak (ücretsiz)
1. https://console.groq.com → ücretsiz API key al.
2. Sunucu ortam değişkeni: `AI_API_KEY=<key>` (isteğe bağlı `AI_MODEL=llama-3.3-70b-versatile`).
3. Uygulamada quiz çözerken **"🤖 AI ile daha detaylı açıkla"** butonu aktifleşir.
