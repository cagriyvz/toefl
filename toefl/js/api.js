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
  async function register(firstName,lastName,email,password){ const r=await call("/api/register",{method:"POST",body:JSON.stringify({firstName,lastName,email,password})}); _store(r); return r; }
  async function login(email,password){ const r=await call("/api/login",{method:"POST",body:JSON.stringify({email,password})}); _store(r); return r; }
  async function logout(){ try{ await call("/api/logout",{method:"POST"}); }catch(_){} _clear(); }
  async function me(){ return call("/api/me"); }
  async function saveAttempt(a){ return call("/api/attempt",{method:"POST",body:JSON.stringify(a)}); }
  async function logEvent(type,data){ try{ return await call("/api/event",{method:"POST",body:JSON.stringify({type,data})}); }catch(_){ } }
  async function leaderboard(){ return call("/api/leaderboard"); }
  async function explain(prompt){ return call("/api/explain",{method:"POST",body:JSON.stringify({prompt})}); }
  async function adminUsers(){ return call("/api/admin/users"); }
  async function adminUserDetail(id){ return call("/api/admin/user/"+id); }
  async function adminStats(){ return call("/api/admin/stats"); }
  async function adminDeleteUser(id){ return call("/api/admin/user/"+id,{method:"DELETE"}); }
  async function adminGetSettings(){ return call("/api/admin/settings"); }
  async function adminSaveSettings(aiKey,aiModel){ return call("/api/admin/settings",{method:"POST",body:JSON.stringify({aiKey,aiModel})}); }
  async function adminEditUser(id,firstName,lastName){ return call("/api/admin/user/"+id+"/edit",{method:"POST",body:JSON.stringify({firstName,lastName})}); }
  async function adminResetPassword(id,password){ return call("/api/admin/user/"+id+"/password",{method:"POST",body:JSON.stringify({password})}); }
  async function announcements(){ return call("/api/announcements"); }
  async function adminCreateAnnouncement(title,body){ return call("/api/admin/announcement",{method:"POST",body:JSON.stringify({title,body})}); }
  async function adminDeleteAnnouncement(id){ return call("/api/admin/announcement/"+id,{method:"DELETE"}); }
  async function createTicket(category,message){ return call("/api/ticket",{method:"POST",body:JSON.stringify({category,message})}); }
  async function adminTickets(){ return call("/api/admin/tickets"); }
  async function adminUpdateTicket(id,status){ return call("/api/admin/ticket/"+id,{method:"POST",body:JSON.stringify({status})}); }
  async function adminDeleteTicket(id){ return call("/api/admin/ticket/"+id,{method:"DELETE"}); }

  return { setBase, clearBase, base:()=>base, enabled, isOnline, authed, user:()=>user,
           health, register, login, logout, me, saveAttempt, logEvent, leaderboard,
           explain, adminUsers, adminUserDetail, adminStats, adminDeleteUser,
           adminGetSettings, adminSaveSettings, adminEditUser, adminResetPassword,
           createTicket, adminTickets, adminUpdateTicket, adminDeleteTicket,
           announcements, adminCreateAnnouncement, adminDeleteAnnouncement };
})();

if (typeof module!=="undefined") module.exports = { API };
