"""
TOEFL Structure — Backend (FastAPI + SQLite)
- Kayıt / giriş (token tabanlı)
- Tüm deneme ve olay loglarını kaydeder (çok kullanıcı)
- İlerleme ve tamamlanan testler
- Lider tablosu (diğer öğrenciler de görür)
- Aynı sunucu statik frontend'i de servis eder (tek komutla çalışır)

Sadece stdlib + fastapi + uvicorn. Harici veritabanı yok (SQLite dosyası).
Çalıştır:  uvicorn server:app --reload  (toefl/backend içinde)
Sonra:     http://localhost:8000  → uygulama,  /api/...  → API
"""
import os, sqlite3, hashlib, secrets, json, time
from contextlib import closing
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
# Kalıcı disk varsa (ör. Render volume) TOEFL_DB_DIR ile yönlendir; yoksa yerel.
DB_DIR = os.environ.get("TOEFL_DB_DIR", HERE)
os.makedirs(DB_DIR, exist_ok=True)
DB   = os.path.join(DB_DIR, "toefl.db")
FRONTEND = os.path.abspath(os.path.join(HERE, ".."))   # toefl/ klasörü

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
          pwhash TEXT NOT NULL,
          salt  TEXT NOT NULL,
          created REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions(
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          created REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS attempts(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          mode TEXT NOT NULL,           -- practice | exam | diagnostic | review
          skill INTEGER,                -- practice için skill no, diğerleri NULL
          correct INTEGER NOT NULL,
          total INTEGER NOT NULL,
          score INTEGER NOT NULL,       -- yüzde
          duration INTEGER DEFAULT 0,   -- saniye
          created REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS events(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          type TEXT NOT NULL,
          data TEXT,
          created REAL NOT NULL
        );
        """)

init_db()

# ---------------------------------------------------------------- auth helpers
def hash_pw(pw: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120_000).hex()

def make_token() -> str:
    return secrets.token_urlsafe(32)

def current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Giriş gerekli")
    token = authorization.split(" ", 1)[1]
    with closing(db()) as con:
        row = con.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?",
            (token,)).fetchone()
    if not row:
        raise HTTPException(401, "Oturum geçersiz")
    return dict(row)

def log_event(user_id, type_, data=None):
    with closing(db()) as con, con:
        con.execute("INSERT INTO events(user_id,type,data,created) VALUES(?,?,?,?)",
                    (user_id, type_, json.dumps(data) if data is not None else None, time.time()))

# ---------------------------------------------------------------- models
class RegisterIn(BaseModel):
    email: str
    password: str
    name: str

class LoginIn(BaseModel):
    email: str
    password: str

class AttemptIn(BaseModel):
    mode: str
    skill: Optional[int] = None
    correct: int
    total: int
    duration: int = 0

class EventIn(BaseModel):
    type: str
    data: Optional[dict] = None

# ---------------------------------------------------------------- progress
def build_progress(user_id: int) -> dict:
    with closing(db()) as con:
        rows = con.execute("SELECT * FROM attempts WHERE user_id=? ORDER BY created", (user_id,)).fetchall()
    skills, exams, completed = {}, [], 0
    exam_best = None
    for r in rows:
        if r["mode"] == "practice" and r["skill"] is not None:
            s = skills.setdefault(str(r["skill"]), {"best": 0, "attempts": 0, "done": False})
            s["best"] = max(s["best"], r["score"])
            s["attempts"] += 1
            if r["score"] >= 70:
                s["done"] = True
        if r["mode"] == "exam":
            exams.append({"score": r["score"], "correct": r["correct"], "total": r["total"], "date": r["created"]})
            exam_best = r["score"] if exam_best is None else max(exam_best, r["score"])
            completed += 1
    return {
        "skills": skills,
        "examBest": exam_best,
        "examHistory": exams[-20:],
        "completedExams": completed,
        "totalAttempts": len(rows),
    }

# ---------------------------------------------------------------- app
app = FastAPI(title="TOEFL Structure API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"], allow_credentials=False)

@app.get("/api/health")
def health():
    return {"ok": True, "service": "toefl-structure", "time": time.time()}

@app.post("/api/register")
def register(body: RegisterIn):
    email = body.email.strip().lower()
    if "@" not in email or len(body.password) < 4:
        raise HTTPException(400, "Geçerli e-posta ve en az 4 karakter şifre gerekli")
    salt = secrets.token_hex(8)
    pwh = hash_pw(body.password, salt)
    with closing(db()) as con, con:
        try:
            cur = con.execute("INSERT INTO users(email,name,pwhash,salt,created) VALUES(?,?,?,?,?)",
                              (email, body.name.strip() or email.split("@")[0], pwh, salt, time.time()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Bu e-posta zaten kayıtlı")
        uid = cur.lastrowid
        token = make_token()
        con.execute("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)", (token, uid, time.time()))
    log_event(uid, "register")
    return {"token": token, "user": {"id": uid, "email": email, "name": body.name}}

@app.post("/api/login")
def login(body: LoginIn):
    email = body.email.strip().lower()
    with closing(db()) as con, con:
        row = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not row or hash_pw(body.password, row["salt"]) != row["pwhash"]:
            raise HTTPException(401, "E-posta veya şifre hatalı")
        token = make_token()
        con.execute("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)", (token, row["id"], time.time()))
    log_event(row["id"], "login")
    return {"token": token, "user": {"id": row["id"], "email": email, "name": row["name"]}}

@app.post("/api/logout")
def logout(user=Depends(current_user), authorization: str = Header(None)):
    token = authorization.split(" ", 1)[1]
    with closing(db()) as con, con:
        con.execute("DELETE FROM sessions WHERE token=?", (token,))
    return {"ok": True}

@app.get("/api/me")
def me(user=Depends(current_user)):
    return {"user": {"id": user["id"], "email": user["email"], "name": user["name"]},
            "progress": build_progress(user["id"])}

@app.post("/api/attempt")
def attempt(body: AttemptIn, user=Depends(current_user)):
    score = round(body.correct / body.total * 100) if body.total else 0
    with closing(db()) as con, con:
        con.execute("""INSERT INTO attempts(user_id,mode,skill,correct,total,score,duration,created)
                       VALUES(?,?,?,?,?,?,?,?)""",
                    (user["id"], body.mode, body.skill, body.correct, body.total, score, body.duration, time.time()))
    log_event(user["id"], "attempt", {"mode": body.mode, "skill": body.skill, "score": score})
    return {"ok": True, "score": score, "progress": build_progress(user["id"])}

@app.post("/api/event")
def event(body: EventIn, user=Depends(current_user)):
    log_event(user["id"], body.type, body.data)
    return {"ok": True}

@app.get("/api/progress")
def progress(user=Depends(current_user)):
    return build_progress(user["id"])

@app.get("/api/leaderboard")
def leaderboard():
    with closing(db()) as con:
        rows = con.execute("""
          SELECT u.name,
                 MAX(CASE WHEN a.mode='exam' THEN a.score END)            AS exam_best,
                 SUM(CASE WHEN a.mode='exam' THEN 1 ELSE 0 END)           AS exams,
                 SUM(CASE WHEN a.mode='practice' AND a.score>=70 THEN 1 ELSE 0 END) AS skills_done,
                 COUNT(a.id) AS attempts
          FROM users u LEFT JOIN attempts a ON a.user_id=u.id
          GROUP BY u.id
          ORDER BY exam_best DESC, skills_done DESC, attempts DESC
          LIMIT 20""").fetchall()
    out = []
    for r in rows:
        out.append({"name": r["name"], "examBest": r["exam_best"],
                    "exams": r["exams"] or 0, "skillsDone": r["skills_done"] or 0,
                    "attempts": r["attempts"] or 0})
    return {"leaderboard": out}

# ---- statik frontend (API yollarından SONRA mount edilmeli) ----------------
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")

# ---- doğrudan çalıştırma: python server.py  (PORT env'i kullanılır) --------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
