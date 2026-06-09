"""
TOEFL Structure — Backend (FastAPI + SQLite)
- Kayıt: ad, soyad, e-posta (gmail), şifre  ·  Giriş: e-posta + şifre
- Tüm deneme ve olay loglarını kaydeder (çok kullanıcı)
- İlerleme, başarılar, eksikler (profil)
- ADMIN PANELİ: tüm üyeler, bilgileri, gelişimleri
- AI açıklama: ücretsiz, OpenAI-uyumlu sağlayıcı (varsayılan Groq/Llama) — env ile
- Lider tablosu
- Aynı sunucu statik frontend'i de servis eder

Sadece stdlib + fastapi + uvicorn + httpx.
Çalıştır:  uvicorn server:app --reload   (toefl/backend içinde)

Ortam değişkenleri (opsiyonel):
  TOEFL_ADMIN_EMAILS = "admin@x.com,hoca@y.com"   # admin yetkili e-postalar
  TOEFL_DB_DIR       = kalıcı disk dizini
  AI_API_KEY         = ücretsiz Groq anahtarı (console.groq.com)
  AI_BASE_URL        = varsayılan https://api.groq.com/openai/v1
  AI_MODEL           = varsayılan llama-3.3-70b-versatile
"""
import os, sqlite3, hashlib, secrets, json, time
from contextlib import closing
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

# Veritabanı seçimi: DATABASE_URL (Postgres) verilmişse KALICI Postgres kullanılır,
# yoksa yerel SQLite. Postgres → veriler deploy/restart'ta SİLİNMEZ.
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
IS_PG = DATABASE_URL.startswith("postgres")
if IS_PG:
    import psycopg2, psycopg2.extras
    PG_DSN = DATABASE_URL.replace("postgres://", "postgresql://", 1)

HERE = os.path.dirname(os.path.abspath(__file__))

# .env desteği (bağımlılıksız): backend/.env varsa oradan değişkenleri yükle.
# .env GİT'E GİRMEZ (gitignore) — anahtarlar repoya sızmaz.
def _load_dotenv():
    p = os.path.join(HERE, ".env")
    if not os.path.exists(p): return
    for line in open(p, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
_load_dotenv()

DB_DIR = os.environ.get("TOEFL_DB_DIR", HERE)
os.makedirs(DB_DIR, exist_ok=True)
DB   = os.path.join(DB_DIR, "toefl.db")
FRONTEND = os.path.abspath(os.path.join(HERE, ".."))

# TEK ADMIN: cagri@gmail.com. Başka kimse admin olamaz.
# (İstenirse TOEFL_ADMIN_EMAILS / ADMIN_EMAIL env ile ek admin eklenebilir.)
DEFAULT_ADMIN_EMAIL = "cagri@gmail.com"
ADMIN_EMAILS = {DEFAULT_ADMIN_EMAIL}
ADMIN_EMAILS |= {e.strip().lower() for e in os.environ.get("TOEFL_ADMIN_EMAILS", "").split(",") if e.strip()}
_env_admin = os.environ.get("ADMIN_EMAIL", "").strip().lower()
if _env_admin:
    ADMIN_EMAILS.add(_env_admin)

# ---------------------------------------------------------------- DB (SQLite + Postgres)
class Conn:
    """Tek arayüz: con.execute('... ? ...', params).fetchone()/fetchall(); 'with ... , con:' ile commit."""
    def __init__(self):
        if IS_PG:
            self.con = psycopg2.connect(PG_DSN)
        else:
            self.con = sqlite3.connect(DB)
            self.con.row_factory = sqlite3.Row
            self.con.execute("PRAGMA journal_mode=WAL")
    def execute(self, sql, params=()):
        if IS_PG:
            cur = self.con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(sql.replace("?", "%s"), params)
            return cur
        return self.con.execute(sql, params)
    def insert_id(self, sql, params=()):
        if IS_PG:
            cur = self.con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(sql.replace("?", "%s") + " RETURNING id", params)
            return cur.fetchone()["id"]
        return self.con.execute(sql, params).lastrowid
    def commit(self): self.con.commit()
    def close(self): self.con.close()
    def __enter__(self): return self
    def __exit__(self, et, ev, tb):
        if et is None: self.con.commit()
        else: self.con.rollback()
        return False

def db(): return Conn()

PK = "SERIAL PRIMARY KEY" if IS_PG else "INTEGER PRIMARY KEY AUTOINCREMENT"
SCHEMA = [
  f"""CREATE TABLE IF NOT EXISTS users(
      id {PK}, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      first_name TEXT DEFAULT '', last_name TEXT DEFAULT '',
      pwhash TEXT NOT NULL, salt TEXT NOT NULL, is_admin INTEGER DEFAULT 0,
      created REAL NOT NULL, last_seen REAL)""",
  """CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created REAL NOT NULL)""",
  f"""CREATE TABLE IF NOT EXISTS attempts(
      id {PK}, user_id INTEGER NOT NULL, mode TEXT NOT NULL, skill INTEGER,
      correct INTEGER NOT NULL, total INTEGER NOT NULL, score INTEGER NOT NULL,
      duration INTEGER DEFAULT 0, created REAL NOT NULL)""",
  f"""CREATE TABLE IF NOT EXISTS events(
      id {PK}, user_id INTEGER, type TEXT NOT NULL, data TEXT, created REAL NOT NULL)""",
  """CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT)""",
  f"""CREATE TABLE IF NOT EXISTS tickets(
      id {PK}, user_id INTEGER, name TEXT, email TEXT, category TEXT,
      message TEXT NOT NULL, status TEXT DEFAULT 'open', created REAL NOT NULL)""",
]

def init_db():
    with closing(db()) as con, con:
        for stmt in SCHEMA:
            con.execute(stmt)
        if not IS_PG:  # eski SQLite DB'leri için güvenli kolon ekleme
            cols = {r["name"] for r in con.execute("PRAGMA table_info(users)")}
            for c, d in [("first_name","TEXT DEFAULT ''"),("last_name","TEXT DEFAULT ''"),
                         ("is_admin","INTEGER DEFAULT 0"),("last_seen","REAL")]:
                if c not in cols:
                    con.execute(f"ALTER TABLE users ADD COLUMN {c} {d}")

init_db()

# ---------------------------------------------------------------- helpers
def hash_pw(pw, salt): return hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120_000).hex()

def get_setting(k, default=None):
    with closing(db()) as con:
        r = con.execute("SELECT value FROM settings WHERE key=?", (k,)).fetchone()
    return r["value"] if r else default

def set_setting(k, v):
    with closing(db()) as con, con:
        con.execute("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (k, v))

def seed_admin():
    """ADMIN_PASSWORD env'i verilmişse admin hesabını otomatik oluşturur (opsiyonel).
    Şifre koda yazılmaz; verilmezse admin, siteye normal kayıt olarak hesabını açar."""
    em = (os.environ.get("ADMIN_EMAIL", "").strip().lower() or DEFAULT_ADMIN_EMAIL)
    pw = os.environ.get("ADMIN_PASSWORD", "")
    if pw:
        with closing(db()) as con, con:
            row = con.execute("SELECT * FROM users WHERE email=?", (em,)).fetchone()
            if not row:
                salt = secrets.token_hex(8)
                con.execute("""INSERT INTO users(email,name,first_name,last_name,pwhash,salt,is_admin,created,last_seen)
                               VALUES(?,?,?,?,?,?,1,?,?)""",
                            (em, "Admin", "Admin", "", hash_pw(pw, salt), salt, time.time(), time.time()))
    enforce_admins()

def enforce_admins():
    """SADECE ADMIN_EMAILS'teki hesaplar admin; diğer herkesin yöneticiliği kaldırılır."""
    if not ADMIN_EMAILS:
        return
    qs = ",".join("?" * len(ADMIN_EMAILS))
    emails = tuple(ADMIN_EMAILS)
    with closing(db()) as con, con:
        con.execute(f"UPDATE users SET is_admin=0 WHERE lower(email) NOT IN ({qs})", emails)
        con.execute(f"UPDATE users SET is_admin=1 WHERE lower(email) IN ({qs})", emails)
seed_admin()
def make_token(): return secrets.token_urlsafe(32)

def current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Giriş gerekli")
    token = authorization.split(" ", 1)[1]
    with closing(db()) as con, con:
        row = con.execute("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?",
                          (token,)).fetchone()
        if not row: raise HTTPException(401, "Oturum geçersiz")
        con.execute("UPDATE users SET last_seen=? WHERE id=?", (time.time(), row["id"]))
    return dict(row)

def require_admin(user=Depends(current_user)):
    if not user.get("is_admin"): raise HTTPException(403, "Yönetici yetkisi gerekli")
    return user

def log_event(uid, type_, data=None):
    with closing(db()) as con, con:
        con.execute("INSERT INTO events(user_id,type,data,created) VALUES(?,?,?,?)",
                    (uid, type_, json.dumps(data) if data is not None else None, time.time()))

def public_user(row):
    return {"id":row["id"],"email":row["email"],"name":row["name"],
            "firstName":row["first_name"] or "","lastName":row["last_name"] or "",
            "isAdmin":bool(row["is_admin"])}

# ---------------------------------------------------------------- models
class RegisterIn(BaseModel):
    firstName: str; lastName: str; email: str; password: str
class LoginIn(BaseModel):
    email: str; password: str
class AttemptIn(BaseModel):
    mode: str; skill: Optional[int]=None; correct: int; total: int; duration: int=0
class EventIn(BaseModel):
    type: str; data: Optional[dict]=None
class ExplainIn(BaseModel):
    prompt: str
class SettingsIn(BaseModel):
    aiKey: Optional[str] = None
    aiModel: Optional[str] = None
class UserEditIn(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
class TicketIn(BaseModel):
    category: str = "Genel"
    message: str
class TicketUpdateIn(BaseModel):
    status: str

# ---------------------------------------------------------------- progress
def build_progress(uid):
    with closing(db()) as con:
        rows = con.execute("SELECT * FROM attempts WHERE user_id=? ORDER BY created", (uid,)).fetchall()
    skills, exams, completed, exam_best = {}, [], 0, None
    by_mode = {}
    tot_correct = tot_q = 0
    history = []
    for r in rows:
        by_mode[r["mode"]] = by_mode.get(r["mode"],0)+1
        tot_correct += r["correct"]; tot_q += r["total"]
        history.append({"mode":r["mode"],"skill":r["skill"],"correct":r["correct"],
                        "total":r["total"],"score":r["score"],"date":r["created"]})
        if r["mode"]=="practice" and r["skill"] is not None:
            s = skills.setdefault(str(r["skill"]), {"best":0,"attempts":0,"done":False})
            s["best"]=max(s["best"],r["score"]); s["attempts"]+=1
            if r["score"]>=70: s["done"]=True
        if r["mode"]=="exam":
            exams.append({"score":r["score"],"correct":r["correct"],"total":r["total"],"date":r["created"]})
            exam_best = r["score"] if exam_best is None else max(exam_best,r["score"])
            completed += 1
    weak = sorted(int(k) for k,v in skills.items() if v["best"]<70)
    strong = sorted(int(k) for k,v in skills.items() if v["done"])
    accuracy = round(tot_correct/tot_q*100) if tot_q else None
    return {"skills":skills,"examBest":exam_best,"examHistory":exams[-20:],
            "completedExams":completed,"totalAttempts":len(rows),
            "byMode":by_mode,"weakSkills":weak,"strongSkills":strong,
            "accuracy":accuracy,"totalCorrect":tot_correct,"totalQuestions":tot_q,
            "history":list(reversed(history))[:60]}

# ---------------------------------------------------------------- app
app = FastAPI(title="TOEFL Structure API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"], allow_credentials=False)

@app.get("/api/health")
def health():
    ai = bool(get_setting("ai_key") or os.environ.get("AI_API_KEY"))
    return {"ok":True,"service":"toefl-structure","ai": ai,"time":time.time()}

@app.post("/api/register")
def register(b: RegisterIn):
    email=b.email.strip().lower()
    if "@" not in email or len(b.password)<4:
        raise HTTPException(400,"Geçerli e-posta ve en az 4 karakter şifre gerekli")
    fn, ln = b.firstName.strip(), b.lastName.strip()
    if not fn: raise HTTPException(400,"Ad gerekli")
    name=(fn+" "+ln).strip()
    salt=secrets.token_hex(8); pwh=hash_pw(b.password,salt)
    with closing(db()) as con, con:
        is_admin = 1 if email in ADMIN_EMAILS else 0   # SADECE admin e-postası admin olur
        if con.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
            raise HTTPException(409,"Bu e-posta zaten kayıtlı")
        uid=con.insert_id("""INSERT INTO users(email,name,first_name,last_name,pwhash,salt,is_admin,created,last_seen)
                             VALUES(?,?,?,?,?,?,?,?,?)""",
                          (email,name,fn,ln,pwh,salt,is_admin,time.time(),time.time()))
        token=make_token()
        con.execute("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)",(token,uid,time.time()))
        row=con.execute("SELECT * FROM users WHERE id=?",(uid,)).fetchone()
    log_event(uid,"register")
    return {"token":token,"user":public_user(row)}

@app.post("/api/login")
def login(b: LoginIn):
    email=b.email.strip().lower()
    with closing(db()) as con, con:
        row=con.execute("SELECT * FROM users WHERE email=?",(email,)).fetchone()
        if not row or hash_pw(b.password,row["salt"])!=row["pwhash"]:
            raise HTTPException(401,"E-posta veya şifre hatalı")
        # admin listesi sonradan değiştiyse güncelle
        if email in ADMIN_EMAILS and not row["is_admin"]:
            con.execute("UPDATE users SET is_admin=1 WHERE id=?",(row["id"],)); row=con.execute("SELECT * FROM users WHERE id=?",(row["id"],)).fetchone()
        token=make_token()
        con.execute("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)",(token,row["id"],time.time()))
    log_event(row["id"],"login")
    return {"token":token,"user":public_user(row)}

@app.post("/api/logout")
def logout(user=Depends(current_user), authorization: str = Header(None)):
    token=authorization.split(" ",1)[1]
    with closing(db()) as con, con:
        con.execute("DELETE FROM sessions WHERE token=?",(token,))
    return {"ok":True}

@app.get("/api/me")
def me(user=Depends(current_user)):
    with closing(db()) as con:
        row=con.execute("SELECT * FROM users WHERE id=?",(user["id"],)).fetchone()
    return {"user":public_user(row),"progress":build_progress(user["id"])}

@app.post("/api/attempt")
def attempt(b: AttemptIn, user=Depends(current_user)):
    score=round(b.correct/b.total*100) if b.total else 0
    with closing(db()) as con, con:
        con.execute("""INSERT INTO attempts(user_id,mode,skill,correct,total,score,duration,created)
                       VALUES(?,?,?,?,?,?,?,?)""",
                    (user["id"],b.mode,b.skill,b.correct,b.total,score,b.duration,time.time()))
    log_event(user["id"],"attempt",{"mode":b.mode,"skill":b.skill,"score":score})
    return {"ok":True,"score":score,"progress":build_progress(user["id"])}

@app.post("/api/event")
def event(b: EventIn, user=Depends(current_user)):
    log_event(user["id"],b.type,b.data); return {"ok":True}

@app.get("/api/progress")
def progress(user=Depends(current_user)):
    return build_progress(user["id"])

# ---------------------------------------------------------------- DESTEK / TALEP
@app.post("/api/ticket")
def create_ticket(b: TicketIn, user=Depends(current_user)):
    msg=(b.message or "").strip()
    if len(msg)<3: raise HTTPException(400,"Mesaj çok kısa")
    with closing(db()) as con, con:
        con.execute("""INSERT INTO tickets(user_id,name,email,category,message,status,created)
                       VALUES(?,?,?,?,?,'open',?)""",
                    (user["id"],user["name"],user["email"],(b.category or "Genel").strip(),msg[:2000],time.time()))
    log_event(user["id"],"ticket",{"category":b.category})
    return {"ok":True}

@app.get("/api/admin/tickets")
def admin_tickets(admin=Depends(require_admin)):
    with closing(db()) as con:
        rows=con.execute("SELECT * FROM tickets ORDER BY (status='open') DESC, created DESC LIMIT 300").fetchall()
    return {"tickets":[dict(r) for r in rows]}

@app.post("/api/admin/ticket/{tid}")
def admin_update_ticket(tid: int, b: TicketUpdateIn, admin=Depends(require_admin)):
    with closing(db()) as con, con:
        con.execute("UPDATE tickets SET status=? WHERE id=?",(b.status,tid))
    return {"ok":True}

@app.delete("/api/admin/ticket/{tid}")
def admin_delete_ticket(tid: int, admin=Depends(require_admin)):
    with closing(db()) as con, con:
        con.execute("DELETE FROM tickets WHERE id=?",(tid,))
    return {"ok":True}

@app.get("/api/leaderboard")
def leaderboard():
    with closing(db()) as con:
        rows=con.execute("""
          SELECT u.name,
                 MAX(CASE WHEN a.mode='exam' THEN a.score END) AS exam_best,
                 SUM(CASE WHEN a.mode='exam' THEN 1 ELSE 0 END) AS exams,
                 SUM(CASE WHEN a.mode='practice' AND a.score>=70 THEN 1 ELSE 0 END) AS skills_done,
                 COUNT(a.id) AS attempts
          FROM users u LEFT JOIN attempts a ON a.user_id=u.id
          GROUP BY u.id ORDER BY exam_best DESC, skills_done DESC, attempts DESC LIMIT 20""").fetchall()
    return {"leaderboard":[{"name":r["name"],"examBest":r["exam_best"],"exams":r["exams"] or 0,
                            "skillsDone":r["skills_done"] or 0,"attempts":r["attempts"] or 0} for r in rows]}

# ---------------------------------------------------------------- ADMIN
@app.get("/api/admin/users")
def admin_users(admin=Depends(require_admin)):
    with closing(db()) as con:
        rows=con.execute("""
          SELECT u.id,u.name,u.first_name,u.last_name,u.email,u.is_admin,u.created,u.last_seen,
                 COUNT(a.id) AS attempts,
                 MAX(CASE WHEN a.mode='exam' THEN a.score END) AS exam_best,
                 SUM(CASE WHEN a.mode='practice' AND a.score>=70 THEN 1 ELSE 0 END) AS skills_done,
                 SUM(CASE WHEN a.mode='vocab' THEN 1 ELSE 0 END) AS vocab_rounds
          FROM users u LEFT JOIN attempts a ON a.user_id=u.id
          GROUP BY u.id ORDER BY u.created DESC""").fetchall()
    return {"users":[{"id":r["id"],"name":r["name"],"firstName":r["first_name"] or "","lastName":r["last_name"] or "",
                      "email":r["email"],"isAdmin":bool(r["is_admin"]),"created":r["created"],"lastSeen":r["last_seen"],
                      "attempts":r["attempts"] or 0,"examBest":r["exam_best"],
                      "skillsDone":r["skills_done"] or 0,"vocabRounds":r["vocab_rounds"] or 0} for r in rows]}

@app.get("/api/admin/user/{uid}")
def admin_user_detail(uid: int, admin=Depends(require_admin)):
    with closing(db()) as con:
        u=con.execute("SELECT * FROM users WHERE id=?",(uid,)).fetchone()
        if not u: raise HTTPException(404,"Kullanıcı yok")
        attempts=con.execute("SELECT * FROM attempts WHERE user_id=? ORDER BY created DESC LIMIT 200",(uid,)).fetchall()
        events=con.execute("SELECT * FROM events WHERE user_id=? ORDER BY created DESC LIMIT 200",(uid,)).fetchall()
        tot=con.execute("SELECT COALESCE(SUM(duration),0) s, COUNT(*) n FROM attempts WHERE user_id=?",(uid,)).fetchone()
        # moda göre süre/sayı
        permode=con.execute("""SELECT mode, COUNT(*) n, COALESCE(SUM(duration),0) secs, COALESCE(AVG(score),0) avg
                               FROM attempts WHERE user_id=? GROUP BY mode""",(uid,)).fetchall()
    return {"user":public_user(u),"created":u["created"],"lastSeen":u["last_seen"],
            "progress":build_progress(uid),
            "totalSeconds":tot["s"],"totalAttempts":tot["n"],
            "byMode":[{"mode":r["mode"],"count":r["n"],"seconds":r["secs"],"avgScore":round(r["avg"])} for r in permode],
            "attempts":[dict(a) for a in attempts],
            "events":[{"type":e["type"],"data":e["data"],"created":e["created"]} for e in events]}

@app.post("/api/admin/user/{uid}/edit")
def admin_edit_user(uid: int, b: UserEditIn, admin=Depends(require_admin)):
    with closing(db()) as con, con:
        u=con.execute("SELECT * FROM users WHERE id=?",(uid,)).fetchone()
        if not u: raise HTTPException(404,"Kullanıcı yok")
        fn = b.firstName.strip() if b.firstName is not None else (u["first_name"] or "")
        ln = b.lastName.strip()  if b.lastName  is not None else (u["last_name"] or "")
        name=(fn+" "+ln).strip() or u["email"].split("@")[0]
        con.execute("UPDATE users SET first_name=?, last_name=?, name=? WHERE id=?",(fn,ln,name,uid))
    log_event(admin["id"],"admin_edit_user",{"uid":uid})
    return {"ok":True,"name":name}

@app.delete("/api/admin/user/{uid}")
def admin_delete_user(uid: int, admin=Depends(require_admin)):
    if uid == admin["id"]:
        raise HTTPException(400, "Kendi hesabını silemezsin")
    with closing(db()) as con, con:
        con.execute("DELETE FROM attempts WHERE user_id=?", (uid,))
        con.execute("DELETE FROM events WHERE user_id=?", (uid,))
        con.execute("DELETE FROM sessions WHERE user_id=?", (uid,))
        con.execute("DELETE FROM users WHERE id=?", (uid,))
    return {"ok": True}

@app.get("/api/admin/settings")
def admin_get_settings(admin=Depends(require_admin)):
    key = get_setting("ai_key") or os.environ.get("AI_API_KEY", "")
    model = get_setting("ai_model") or os.environ.get("AI_MODEL", "llama-3.3-70b-versatile")
    return {"aiKeySet": bool(key), "aiModel": model}

@app.post("/api/admin/settings")
def admin_set_settings(b: SettingsIn, admin=Depends(require_admin)):
    if b.aiKey is not None and b.aiKey.strip():
        set_setting("ai_key", b.aiKey.strip())
    if b.aiModel is not None and b.aiModel.strip():
        set_setting("ai_model", b.aiModel.strip())
    log_event(admin["id"], "admin_settings")
    return {"ok": True}

@app.get("/api/admin/stats")
def admin_stats(admin=Depends(require_admin)):
    with closing(db()) as con:
        users=con.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
        attempts=con.execute("SELECT COUNT(*) c FROM attempts").fetchone()["c"]
        exams=con.execute("SELECT COUNT(*) c FROM attempts WHERE mode='exam'").fetchone()["c"]
        active=con.execute("SELECT COUNT(*) c FROM users WHERE last_seen>?",(time.time()-7*86400,)).fetchone()["c"]
        open_tickets=con.execute("SELECT COUNT(*) c FROM tickets WHERE status='open'").fetchone()["c"]
    return {"users":users,"attempts":attempts,"exams":exams,"activeWeek":active,"openTickets":open_tickets}

# ---------------------------------------------------------------- AI (ücretsiz, OpenAI-uyumlu)
@app.post("/api/explain")
def explain(b: ExplainIn, user=Depends(current_user)):
    key = get_setting("ai_key") or os.environ.get("AI_API_KEY")
    if not key:
        return {"ok":False,"text":None,"reason":"AI yapılandırılmamış (admin panelinden API anahtarı girilmeli)."}
    base=os.environ.get("AI_BASE_URL","https://api.groq.com/openai/v1").rstrip("/")
    model=get_setting("ai_model") or os.environ.get("AI_MODEL","llama-3.3-70b-versatile")
    sys=("Sen bir TOEFL Structure & Written Expression öğretmenisin. Türkçe, kısa ve net açıkla. "
         "Doğru cevabın neden doğru, diğer şıkların neden yanlış olduğunu maddeler hâlinde söyle. "
         "Gramer kuralını basitçe hatırlat.")
    try:
        import httpx
        r=httpx.post(base+"/chat/completions",
            headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"},
            json={"model":model,"temperature":0.3,"max_tokens":500,
                  "messages":[{"role":"system","content":sys},{"role":"user","content":b.prompt}]},
            timeout=30)
        r.raise_for_status()
        text=r.json()["choices"][0]["message"]["content"].strip()
        log_event(user["id"],"ai_explain",{"len":len(b.prompt)})
        return {"ok":True,"text":text}
    except Exception as e:
        return {"ok":False,"text":None,"reason":f"AI hatası: {e}"}

# ---- statik frontend (API yollarından SONRA mount edilmeli) ----------------
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT","8000")))
