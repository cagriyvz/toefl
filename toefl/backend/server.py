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

ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get("TOEFL_ADMIN_EMAILS", "").split(",") if e.strip()}

# ---------------------------------------------------------------- DB
def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con

def init_db():
    with closing(db()) as con, con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS users(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name  TEXT NOT NULL,
          first_name TEXT DEFAULT '',
          last_name  TEXT DEFAULT '',
          pwhash TEXT NOT NULL,
          salt  TEXT NOT NULL,
          is_admin INTEGER DEFAULT 0,
          created REAL NOT NULL,
          last_seen REAL
        );
        CREATE TABLE IF NOT EXISTS sessions(
          token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS attempts(
          id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
          mode TEXT NOT NULL, skill INTEGER, correct INTEGER NOT NULL, total INTEGER NOT NULL,
          score INTEGER NOT NULL, duration INTEGER DEFAULT 0, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS events(
          id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
          type TEXT NOT NULL, data TEXT, created REAL NOT NULL);
        """)
        # eski DB'ler için güvenli kolon ekleme
        cols = {r["name"] for r in con.execute("PRAGMA table_info(users)")}
        for c, d in [("first_name","TEXT DEFAULT ''"),("last_name","TEXT DEFAULT ''"),
                     ("is_admin","INTEGER DEFAULT 0"),("last_seen","REAL")]:
            if c not in cols:
                con.execute(f"ALTER TABLE users ADD COLUMN {c} {d}")

init_db()

# ---------------------------------------------------------------- helpers
def hash_pw(pw, salt): return hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120_000).hex()
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

# ---------------------------------------------------------------- progress
def build_progress(uid):
    with closing(db()) as con:
        rows = con.execute("SELECT * FROM attempts WHERE user_id=? ORDER BY created", (uid,)).fetchall()
    skills, exams, completed, exam_best = {}, [], 0, None
    by_mode = {}
    for r in rows:
        by_mode[r["mode"]] = by_mode.get(r["mode"],0)+1
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
    return {"skills":skills,"examBest":exam_best,"examHistory":exams[-20:],
            "completedExams":completed,"totalAttempts":len(rows),
            "byMode":by_mode,"weakSkills":weak,"strongSkills":strong}

# ---------------------------------------------------------------- app
app = FastAPI(title="TOEFL Structure API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"], allow_credentials=False)

@app.get("/api/health")
def health():
    return {"ok":True,"service":"toefl-structure","ai": bool(os.environ.get("AI_API_KEY")),"time":time.time()}

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
        n_users = con.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
        is_admin = 1 if (email in ADMIN_EMAILS or n_users==0) else 0   # ilk üye = admin
        try:
            cur=con.execute("""INSERT INTO users(email,name,first_name,last_name,pwhash,salt,is_admin,created,last_seen)
                               VALUES(?,?,?,?,?,?,?,?,?)""",
                            (email,name,fn,ln,pwh,salt,is_admin,time.time(),time.time()))
        except sqlite3.IntegrityError:
            raise HTTPException(409,"Bu e-posta zaten kayıtlı")
        uid=cur.lastrowid; token=make_token()
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
        attempts=con.execute("SELECT * FROM attempts WHERE user_id=? ORDER BY created DESC LIMIT 100",(uid,)).fetchall()
        events=con.execute("SELECT * FROM events WHERE user_id=? ORDER BY created DESC LIMIT 100",(uid,)).fetchall()
    return {"user":public_user(u),"created":u["created"],"lastSeen":u["last_seen"],
            "progress":build_progress(uid),
            "attempts":[dict(a) for a in attempts],
            "events":[{"type":e["type"],"data":e["data"],"created":e["created"]} for e in events]}

@app.get("/api/admin/stats")
def admin_stats(admin=Depends(require_admin)):
    with closing(db()) as con:
        users=con.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
        attempts=con.execute("SELECT COUNT(*) c FROM attempts").fetchone()["c"]
        exams=con.execute("SELECT COUNT(*) c FROM attempts WHERE mode='exam'").fetchone()["c"]
        active=con.execute("SELECT COUNT(*) c FROM users WHERE last_seen>?",(time.time()-7*86400,)).fetchone()["c"]
    return {"users":users,"attempts":attempts,"exams":exams,"activeWeek":active}

# ---------------------------------------------------------------- AI (ücretsiz, OpenAI-uyumlu)
@app.post("/api/explain")
def explain(b: ExplainIn, user=Depends(current_user)):
    key=os.environ.get("AI_API_KEY")
    if not key:
        return {"ok":False,"text":None,"reason":"AI yapılandırılmamış (sunucuda AI_API_KEY tanımlı değil)."}
    base=os.environ.get("AI_BASE_URL","https://api.groq.com/openai/v1").rstrip("/")
    model=os.environ.get("AI_MODEL","llama-3.3-70b-versatile")
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
