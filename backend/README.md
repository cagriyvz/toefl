# Lexi Backend — Kurulum Kılavuzu

## Gereksinimler
- Python 3.11+
- PostgreSQL 14+
- Anthropic API anahtarı

---

## 1. Kurulum

```bash
cd lexi-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Veritabanı

```bash
# PostgreSQL'de veritabanı oluştur
createdb lexi_db

# .env dosyasını oluştur
cp .env.example .env
# .env içindeki DATABASE_URL ve ANTHROPIC_API_KEY'i düzenle
```

## 3. Çalıştırma

```bash
uvicorn app.main:app --reload --port 8000
```

API çalışıyor: http://localhost:8000
Swagger docs: http://localhost:8000/docs

---

## API Endpoints Özeti

### Auth
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | /api/auth/register | Kayıt ol (teacher/student) |
| POST | /api/auth/login | Giriş yap → JWT token |
| GET  | /api/auth/me | Mevcut kullanıcı |

### Sınıflar
| Method | URL | Kimin için |
|--------|-----|-----------|
| POST | /api/classrooms | Öğretmen: sınıf oluştur |
| GET  | /api/classrooms/my | Öğretmen: sınıflarım |
| GET  | /api/classrooms/{id}/detail | Öğretmen: sınıf detayı + notlar |
| POST | /api/classrooms/join | Öğrenci: join code ile katıl |
| GET  | /api/classrooms/enrolled | Öğrenci: kayıtlı sınıflarım |

### Ödevler
| Method | URL | Kimin için |
|--------|-----|-----------|
| POST | /api/assignments | Öğretmen: ödev oluştur (AI üretir) |
| GET  | /api/assignments/my | Öğrenci: ödevlerim |
| GET  | /api/assignments/{id} | Öğrenci: ödev soruları (cevaplar gizli) |
| POST | /api/assignments/{id}/submit | Öğrenci: cevapları gönder |
| GET  | /api/assignments/{id}/results | Öğretmen: tüm sınıf notları |

---

## Güvenlik Notları
- Öğrenci başka öğrencinin notunu göremez (JWT + query filter)
- Öğrenci ödev cevaplarını göremez (safe_questions filtresi)
- Öğretmen yalnızca kendi sınıflarını yönetebilir
- Şifreler bcrypt ile hashlenir
- Token süresi 7 gün (production'da kısalt)
