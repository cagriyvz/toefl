import { useState } from "react";

const API = "http://localhost:8000/api";

async function apiPost(url, body) {
  const res = await fetch(`${API}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Bir hata oluştu");
  return data;
}

async function apiLogin(email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Giriş başarısız");
  return data;
}

// ── Input bileşeni ────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1,
        textTransform: "uppercase", color: "#94a3b8", marginBottom: 7,
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "12px 16px",
            paddingRight: isPassword ? 44 : 16,
            border: `1.5px solid ${error ? "#f87171" : "#1e293b"}`,
            borderRadius: 10, background: "#0f172a",
            color: "#f1f5f9", fontSize: 14, fontFamily: "inherit",
            outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = "#38bdf8"; }}
          onBlur={e => { if (!error) e.target.style.borderColor = "#1e293b"; }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "#475569", fontSize: 16, padding: 0, lineHeight: 1,
          }}>
            {show ? "○" : "●"}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

// ── Role seçici ───────────────────────────────────────────────────────
function RoleSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1,
        textTransform: "uppercase", color: "#94a3b8", marginBottom: 7,
      }}>Hesap Türü</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { val: "teacher", icon: "◈", label: "Öğretmen", sub: "Sınıf yönet, ödev oluştur" },
          { val: "student", icon: "◉", label: "Öğrenci", sub: "Ödevleri çöz, gelişimini takip et" },
        ].map(r => (
          <div key={r.val} onClick={() => onChange(r.val)} style={{
            padding: "14px 16px", borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${value === r.val ? "#38bdf8" : "#1e293b"}`,
            background: value === r.val ? "rgba(56,189,248,0.08)" : "#0f172a",
            transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: value === r.val ? "#38bdf8" : "#f1f5f9", marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>{r.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Login formu ───────────────────────────────────────────────────────
function LoginForm({ onSuccess, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Tüm alanları doldurun"); return; }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem("lexi_token", data.access_token);
      localStorage.setItem("lexi_role", data.role);
      localStorage.setItem("lexi_name", data.full_name);
      localStorage.setItem("lexi_uid", data.user_id);
      onSuccess(data.role, data.full_name);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Field label="E-posta" type="email" value={email} onChange={setEmail} placeholder="ornek@mail.com" />
      <Field label="Şifre" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      {error && (
        <div style={{
          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 18,
        }}>{error}</div>
      )}
      <button
        onClick={handleSubmit}
        disabled={loading}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        style={{
          width: "100%", padding: "13px", background: loading ? "#0c4a6e" : "#38bdf8",
          color: loading ? "#7dd3fc" : "#0f172a", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s", marginBottom: 20,
        }}
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap →"}
      </button>
      <p style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
        Hesabın yok mu?{" "}
        <button onClick={onSwitch} style={{
          background: "none", border: "none", color: "#38bdf8",
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: 0,
        }}>Kayıt Ol</button>
      </p>
    </div>
  );
}

// ── Register formu ────────────────────────────────────────────────────
function RegisterForm({ onSuccess, onSwitch }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [role, setRole] = useState("student");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = "Ad soyad gerekli";
    if (!email.includes("@")) e.email = "Geçerli bir e-posta girin";
    if (password.length < 6) e.password = "En az 6 karakter olmalı";
    if (password !== password2) e.password2 = "Şifreler eşleşmiyor";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      const data = await apiPost("/auth/register", {
        full_name: fullName,
        email,
        password,
        role,
      });
      localStorage.setItem("lexi_token", data.access_token);
      localStorage.setItem("lexi_role", data.role);
      localStorage.setItem("lexi_name", data.full_name);
      localStorage.setItem("lexi_uid", data.user_id);
      onSuccess(data.role, data.full_name);
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <RoleSelector value={role} onChange={setRole} />
      <Field label="Ad Soyad" value={fullName} onChange={setFullName} placeholder="Adınız Soyadınız" error={errors.fullName} />
      <Field label="E-posta" type="email" value={email} onChange={setEmail} placeholder="ornek@mail.com" error={errors.email} />
      <Field label="Şifre" type="password" value={password} onChange={setPassword} placeholder="En az 6 karakter" error={errors.password} />
      <Field label="Şifre Tekrar" type="password" value={password2} onChange={setPassword2} placeholder="Şifreyi tekrar girin" error={errors.password2} />
      {errors.api && (
        <div style={{
          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 18,
        }}>{errors.api}</div>
      )}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%", padding: "13px", background: loading ? "#0c4a6e" : "#38bdf8",
          color: loading ? "#7dd3fc" : "#0f172a", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s", marginBottom: 20,
        }}
      >
        {loading ? "Hesap oluşturuluyor..." : `${role === "teacher" ? "Öğretmen" : "Öğrenci"} Hesabı Oluştur →`}
      </button>
      <p style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
        Zaten hesabın var mı?{" "}
        <button onClick={onSwitch} style={{
          background: "none", border: "none", color: "#38bdf8",
          cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: 0,
        }}>Giriş Yap</button>
      </p>
    </div>
  );
}

// ── Başarı sonrası yönlendirme ekranı ─────────────────────────────────
function WelcomeScreen({ role, name }) {
  const isTeacher = role === "teacher";
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(56,189,248,0.15)", border: "2px solid #38bdf8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, margin: "0 auto 20px",
      }}>
        {isTeacher ? "◈" : "◉"}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
        Hoş geldin, {name.split(" ")[0]}!
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 32, lineHeight: 1.6 }}>
        {isTeacher
          ? "Öğretmen panelinize yönlendiriliyorsunuz..."
          : "Öğrenci panelinize yönlendiriliyorsunuz..."}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)",
        borderRadius: 20, padding: "8px 18px", fontSize: 12, color: "#38bdf8",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: "#38bdf8",
          animation: "pulse 1s infinite",
        }} />
        {isTeacher ? "Öğretmen Paneli" : "Öğrenci Paneli"}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// ── Dekoratif sol panel ───────────────────────────────────────────────
function LeftPanel() {
  const features = [
    { icon: "✦", text: "AI destekli soru üretimi" },
    { icon: "◈", text: "Sınıf bazlı ödev takibi" },
    { icon: "◉", text: "Anlık geri bildirim ve notlama" },
    { icon: "▸", text: "Öğretmen panelinde tüm sınıf görünümü" },
  ];
  return (
    <div style={{
      flex: 1, background: "linear-gradient(160deg, #0c1a2e 0%, #0f172a 100%)",
      padding: "60px 52px", display: "flex", flexDirection: "column", justifyContent: "center",
      borderRight: "1px solid #1e293b",
    }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#38bdf8", letterSpacing: -1, marginBottom: 4 }}>lexi</div>
        <div style={{ fontSize: 14, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>İngilizce Öğrenim Platformu</div>
      </div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.35, marginBottom: 16 }}>
          AI ile desteklenen<br />sınıf deneyimi
        </div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
          Öğretmenler saniyeler içinde kişiselleştirilmiş ödevler oluşturur. Öğrenciler anında geri bildirim alır.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, background: "rgba(56,189,248,0.1)",
              border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, color: "#38bdf8", flexShrink: 0,
            }}>{f.icon}</span>
            <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, paddingTop: 6 }}>{f.text}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", paddingTop: 48 }}>
        <div style={{ display: "flex", gap: 20 }}>
          {[["2.400+", "Öğrenci"], ["180+", "Öğretmen"], ["%91", "Memnuniyet"]].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ana uygulama ──────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("login"); // login | register | welcome
  const [welcomeData, setWelcomeData] = useState(null);

  const handleSuccess = (role, name) => {
    setWelcomeData({ role, name });
    setMode("welcome");
    // Gerçek uygulamada: setTimeout(() => router.push(role === "teacher" ? "/teacher" : "/student"), 1800)
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #020817; }
    input::placeholder { color: #334155; }
    input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px #0f172a inset; -webkit-text-fill-color: #f1f5f9; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sol panel — sadece desktop'ta görünür */}
        <div style={{ display: "flex", flex: 1 }}>
          <LeftPanel />
        </div>

        {/* Sağ panel — form */}
        <div style={{
          width: 480, minHeight: "100vh", background: "#020817",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "48px 52px",
        }}>
          <div style={{ width: "100%" }}>

            {mode !== "welcome" && (
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
                  {mode === "login" ? "Tekrar hoş geldin" : "Hesap oluştur"}
                </div>
                <div style={{ fontSize: 14, color: "#475569" }}>
                  {mode === "login"
                    ? "Lexi hesabınla devam et"
                    : "Birkaç saniyede başla"}
                </div>
              </div>
            )}

            {mode === "login" && (
              <LoginForm onSuccess={handleSuccess} onSwitch={() => setMode("register")} />
            )}
            {mode === "register" && (
              <RegisterForm onSuccess={handleSuccess} onSwitch={() => setMode("login")} />
            )}
            {mode === "welcome" && welcomeData && (
              <WelcomeScreen {...welcomeData} />
            )}

            {mode !== "welcome" && (
              <p style={{ fontSize: 11, color: "#334155", textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
                Devam ederek{" "}
                <span style={{ color: "#475569", textDecoration: "underline", cursor: "pointer" }}>Kullanım Şartları</span>
                {" "}ve{" "}
                <span style={{ color: "#475569", textDecoration: "underline", cursor: "pointer" }}>Gizlilik Politikası</span>
                {" "}kabul etmiş sayılırsın.
              </p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
