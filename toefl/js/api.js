/* ==========================================================================
   TOEFL Structure — Frontend API istemcisi
   Backend varsa: kayıt/giriş + ilerleme/log senkronu.
   Backend yoksa (GitHub Pages vb.): offline (misafir) mod — her şey localStorage.
   ========================================================================== */

const API = (() => {
  // Backend adresi: kullanıcı ayarladıysa onu kullan; yoksa otomatik tahmin.
  let base = localStorage.getItem("toefl_api_base");
  if (base === null) {
    // Aynı sunucudan servis ediliyorsa (uvicorn app+api), same-origin kullan.
    if (location.protocol.startsWith("http") && !/github\.io$/i.test(location.hostname)) {
      base = location.origin;
    } else {
      base = ""; // bilinmiyor → offline (kullanıcı ayarlardan girebilir)
    }
  }
  let token = localStorage.getItem("toefl_token") || "";
  let user  = JSON.parse(localStorage.getItem("toefl_user") || "null");
  let online = false; // health başarılıysa true

  function setBase(b){ base=(b||"").replace(/\/+$/,""); localStorage.setItem("toefl_api_base", base); }
  function clearBase(){ base=""; localStorage.setItem("toefl_api_base",""); }
  function enabled(){ return !!base; }
  function isOnline(){ return online; }
  function authed(){ return !!token; }

  function _store(r){
    token=r.token; user=r.user;
    localStorage.setItem("toefl_token", token);
    localStorage.setItem("toefl_user", JSON.stringify(user));
  }
  function _clear(){
    token=""; user=null;
    localStorage.removeItem("toefl_token");
    localStorage.removeItem("toefl_user");
  }

  async function call(path, opts={}){
    if (!base) throw new Error("offline");
    const h = Object.assign({"Content-Type":"application/json"}, opts.headers||{});
    if (token) h["Authorization"]="Bearer "+token;
    const res = await fetch(base+path, Object.assign({}, opts, {headers:h}));
    if (!res.ok){
      let msg="Sunucu hatası";
      try{ const e=await res.json(); msg=e.detail||msg; }catch(_){}
      if (res.status===401){ _clear(); }
      throw new Error(msg);
    }
    return res.json();
  }

  async function health(){
    if (!base) { online=false; return false; }
    try { await call("/api/health"); online=true; }
    catch(_) { online=false; }
    return online;
  }
  async function register(email,password,name){ const r=await call("/api/register",{method:"POST",body:JSON.stringify({email,password,name})}); _store(r); return r; }
  async function login(email,password){ const r=await call("/api/login",{method:"POST",body:JSON.stringify({email,password})}); _store(r); return r; }
  async function logout(){ try{ await call("/api/logout",{method:"POST"}); }catch(_){} _clear(); }
  async function me(){ return call("/api/me"); }
  async function saveAttempt(a){ return call("/api/attempt",{method:"POST",body:JSON.stringify(a)}); }
  async function logEvent(type,data){ try{ return await call("/api/event",{method:"POST",body:JSON.stringify({type,data})}); }catch(_){ } }
  async function leaderboard(){ return call("/api/leaderboard"); }

  return { setBase, clearBase, base:()=>base, enabled, isOnline, authed, user:()=>user,
           health, register, login, logout, me, saveAttempt, logEvent, leaderboard };
})();

if (typeof module!=="undefined") module.exports = { API };
