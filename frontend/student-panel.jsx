import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000/api";
const getToken = () => localStorage.getItem("lexi_token");
const getName  = () => localStorage.getItem("lexi_name") || "Öğrenci";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}`, ...(opts.headers||{}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Sunucu hatası");
  return data;
}

const api = {
  getMyAssignments: ()        => apiFetch("/assignments/my"),
  getAssignment:    (id)      => apiFetch(`/assignments/${id}`),
  submitAssignment: (id, b)   => apiFetch(`/assignments/${id}/submit`, { method:"POST", body:b }),
  getEnrolled:      ()        => apiFetch("/classrooms/enrolled"),
  joinClass:        (code)    => apiFetch("/classrooms/join", { method:"POST", body:{ join_code:code } }),
  getNotes:         ()        => apiFetch("/notes/my"),
  addNote:          (b)       => apiFetch("/notes", { method:"POST", body:b }),
  deleteNote:       (id)      => apiFetch(`/notes/${id}`, { method:"DELETE" }),
  submitTicket:     (b)       => apiFetch("/support", { method:"POST", body:b }),
  getTickets:       ()        => apiFetch("/support/my"),
};

// ── Yardımcılar ───────────────────────────────────────────────────────
function Spinner() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0"}}>
    <div style={{width:30,height:30,border:"3px solid #1e293b",borderTop:"3px solid #38bdf8",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

function Toast({ msg, type="error", onClose }) {
  if (!msg) return null;
  const [bg,color] = type==="success"?["rgba(134,239,172,.1)","#86efac"]:["rgba(248,113,113,.1)","#f87171"];
  return <div style={{background:bg,border:`1px solid ${color}40`,borderRadius:10,padding:"11px 16px",marginBottom:18,fontSize:13,color,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    {msg}<button onClick={onClose} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:16}}>✕</button>
  </div>;
}

function LevelBadge({ level }) {
  const c={A1:["#14532d","#86efac"],A2:["#14532d","#86efac"],B1:["#1e3a5f","#7dd3fc"],B2:["#1e3a5f","#7dd3fc"],C1:["#3b0764","#d8b4fe"]};
  const [bg,color]=c[level]||["#1e293b","#94a3b8"];
  return <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:bg,color,letterSpacing:.5}}>{level}</span>;
}

function TypeBadge({ type }) {
  const m={fill_blank:["#14532d","#86efac","Boşluk Doldurma"],multiple_choice:["#1e3a5f","#7dd3fc","Çoktan Seçmeli"],rewrite:["#3b0764","#d8b4fe","Cümle Yeniden Yazma"]};
  const [bg,color,label]=m[type]||["#1e293b","#94a3b8",type];
  return <span style={{fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:6,background:bg,color,letterSpacing:.5}}>{label}</span>;
}

// ── Sidebar ───────────────────────────────────────────────────────────
function Sidebar({ page, setPage, onLogout }) {
  const items=[
    {id:"home",    icon:"◈",label:"Ödevlerim"},
    {id:"classes", icon:"◉",label:"Sınıflarım"},
    {id:"progress",icon:"▸",label:"İlerleme"},
    {id:"notes",   icon:"✎",label:"Notlarım"},
    {id:"support", icon:"◎",label:"Destek"},
  ];
  return <aside style={{width:210,minHeight:"100vh",background:"#0a0f1e",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",padding:"28px 0"}}>
    <div style={{padding:"0 20px 22px",borderBottom:"1px solid #1e293b",marginBottom:14}}>
      <div style={{fontSize:20,fontWeight:900,color:"#38bdf8",letterSpacing:-.5}}>lexi</div>
      <div style={{fontSize:10,color:"#334155",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Öğrenci Paneli</div>
    </div>
    <div style={{flex:1,padding:"0 10px"}}>
      {items.map(i=>(
        <button key={i.id} onClick={()=>setPage(i.id)} style={{
          width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
          background:page===i.id?"rgba(56,189,248,.1)":"transparent",
          border:"none",borderLeft:page===i.id?"2px solid #38bdf8":"2px solid transparent",
          borderRadius:"0 8px 8px 0",color:page===i.id?"#38bdf8":"#475569",
          fontSize:13,fontWeight:page===i.id?700:400,cursor:"pointer",fontFamily:"inherit",
          marginBottom:2,transition:"all .15s",textAlign:"left",
        }}><span>{i.icon}</span>{i.label}</button>
      ))}
    </div>
    <div style={{padding:"16px 20px",borderTop:"1px solid #1e293b"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(56,189,248,.15)",border:"1px solid rgba(56,189,248,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#38bdf8",flexShrink:0}}>
          {getName().split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>{getName()}</div>
          <div style={{fontSize:11,color:"#334155"}}>Öğrenci</div>
        </div>
      </div>
      <button onClick={onLogout} style={{background:"none",border:"none",color:"#334155",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}}>Çıkış Yap</button>
    </div>
  </aside>;
}

// ── Ödev Kartı ────────────────────────────────────────────────────────
function AssignmentCard({ a, onStart }) {
  const overdue = a.due_date && new Date(a.due_date)<new Date() && a.status==="pending";
  return <div style={{background:"#0f172a",border:`1px solid ${overdue?"rgba(248,113,113,.3)":"#1e293b"}`,borderRadius:14,padding:"20px 24px",display:"flex",alignItems:"center",gap:20,transition:"border-color .15s"}}
    onMouseEnter={e=>!overdue&&(e.currentTarget.style.borderColor="#38bdf8")}
    onMouseLeave={e=>!overdue&&(e.currentTarget.style.borderColor="#1e293b")}
  >
    <div style={{flex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        <LevelBadge level={a.level}/>
        <span style={{fontSize:11,color:"#334155"}}>{a.classroom_name}</span>
        {overdue&&<span style={{fontSize:11,color:"#f87171",fontWeight:700}}>● Süresi doldu</span>}
      </div>
      <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:4}}>{a.title}</div>
      <div style={{fontSize:12,color:"#475569"}}>
        {a.topic} · {a.question_count} soru
        {a.due_date&&<> · Son teslim: <span style={{color:overdue?"#f87171":"#64748b",fontWeight:600}}>{new Date(a.due_date).toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</span></>}
      </div>
    </div>
    {a.status==="completed" ? (
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:22,fontWeight:900,color:a.score>=80?"#86efac":a.score>=60?"#fde047":"#fca5a5"}}>%{Math.round(a.score)}</div>
        <div style={{fontSize:11,color:"#334155",marginTop:2}}>Tamamlandı</div>
      </div>
    ) : (
      <button onClick={()=>onStart(a.id)} style={{padding:"10px 22px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"background .15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="#0ea5e9"}
        onMouseLeave={e=>e.currentTarget.style.background="#38bdf8"}
      >Başla →</button>
    )}
  </div>;
}

// ── Quiz ──────────────────────────────────────────────────────────────
function QuizScreen({ assignmentId, onFinish, onBack }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]               = useState("");
  const [idx, setIdx]               = useState(0);
  const [answers, setAnswers]       = useState({});
  const [checked, setChecked]       = useState({});
  const [input, setInput]           = useState("");
  const [selected, setSelected]     = useState(null);

  useEffect(()=>{
    api.getAssignment(assignmentId).then(data=>{
      if (data.already_submitted) onFinish({ score:data.score, feedback:data.feedback, fromCache:true });
      else setAssignment(data);
    }).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[assignmentId]);

  if (loading) return <Spinner/>;
  if (err) return <Toast msg={err} onClose={onBack}/>;
  if (!assignment) return null;

  const qs=assignment.questions||[], total=qs.length, q=qs[idx];
  if (!q) return null;

  const isChecked=!!checked[q.id];

  const handleCheck=()=>{
    const val=q.type==="multiple_choice"?selected:input.trim();
    if (!val) return;
    setAnswers(prev=>({...prev,[String(q.id)]:val}));
    setChecked(prev=>({...prev,[q.id]:true}));
  };

  const handleNext=async()=>{
    if (idx+1<total){setIdx(idx+1);setInput("");setSelected(null);return;}
    setSubmitting(true);
    try { const r=await api.submitAssignment(assignmentId,{answers}); onFinish({score:r.score,feedback:r.feedback}); }
    catch(e){setErr(e.message);}
    finally{setSubmitting(false);}
  };

  return <div style={{maxWidth:620,margin:"0 auto"}}>
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0}}>← Geri</button>
        <span style={{fontSize:13,fontWeight:600,color:"#475569"}}>{idx+1} / {total}</span>
      </div>
      <div style={{height:5,background:"#1e293b",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(idx/total)*100}%`,background:"#38bdf8",borderRadius:3,transition:"width .4s ease"}}/>
      </div>
      <div style={{fontSize:12,color:"#334155",marginTop:6}}>{assignment.title}</div>
    </div>

    <Toast msg={err} onClose={()=>setErr("")}/>

    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"26px 30px",marginBottom:14}}>
      <div style={{marginBottom:14}}><TypeBadge type={q.type}/></div>
      <div style={{fontSize:13,color:"#475569",marginBottom:10}}>{q.instruction}</div>
      <div style={{fontSize:17,fontWeight:600,color:"#f1f5f9",lineHeight:1.7,background:"#0a0f1e",borderRadius:10,padding:"13px 17px",marginBottom:22,fontFamily:"'DM Mono',monospace"}}>
        {q.type==="rewrite"?(<>{q.sentence}{q.prompt&&<div style={{fontSize:13,color:"#475569",marginTop:5,fontFamily:"inherit"}}>{q.prompt}</div>}</>):(q.sentence||"").replace(/___+/g,"______")}
      </div>

      {q.type==="multiple_choice"?(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {(q.options||[]).map(opt=>{
            const isSel=selected===opt;
            let border="#1e293b",bg="#0a0f1e",color="#94a3b8";
            if (isChecked&&isSel){border="#38bdf8";bg="rgba(56,189,248,.08)";color="#38bdf8";}
            else if (!isChecked&&isSel){border="#38bdf8";bg="rgba(56,189,248,.08)";color="#7dd3fc";}
            return <div key={opt} onClick={()=>!isChecked&&setSelected(opt)} style={{padding:"12px 17px",borderRadius:10,border:`1.5px solid ${border}`,background:bg,color,fontSize:14,fontWeight:500,cursor:isChecked?"default":"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${isSel?"#38bdf8":"#1e293b"}`,background:isSel?"#38bdf8":"transparent",flexShrink:0,transition:"all .15s"}}/>
              {opt}
            </div>;
          })}
        </div>
      ):(
        <input type="text" placeholder={q.type==="fill_blank"?"Cevabınızı yazın...":"Cümleyi yeniden yazın..."} value={input}
          onChange={e=>!isChecked&&setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!isChecked&&handleCheck()} disabled={isChecked}
          style={{width:"100%",padding:"12px 16px",fontSize:15,fontFamily:"'DM Mono',monospace",border:`1.5px solid ${isChecked?"#38bdf8":"#1e293b"}`,borderRadius:10,background:isChecked?"rgba(56,189,248,.05)":"#0a0f1e",color:isChecked?"#7dd3fc":"#f1f5f9",outline:"none",boxSizing:"border-box",transition:"all .2s"}}
        />
      )}
      {isChecked&&<div style={{marginTop:12,fontSize:13,color:"#38bdf8",display:"flex",alignItems:"center",gap:6}}>✓ Cevap kaydedildi</div>}
    </div>

    <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
      {!isChecked?(
        <button onClick={handleCheck} disabled={q.type==="multiple_choice"?!selected:!input.trim()} style={{padding:"11px 28px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:(q.type==="multiple_choice"?!selected:!input.trim())?0.4:1,transition:"opacity .15s"}}>
          Cevabı Kaydet
        </button>
      ):(
        <button onClick={handleNext} disabled={submitting} style={{padding:"11px 28px",background:submitting?"#0c4a6e":"#38bdf8",color:submitting?"#7dd3fc":"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit"}}>
          {submitting?"Gönderiliyor...":idx+1>=total?"Sonuçları Gör →":"Sonraki →"}
        </button>
      )}
    </div>
  </div>;
}

// ── Sonuç Ekranı ──────────────────────────────────────────────────────
function ResultScreen({ score, feedback, fromCache, onBack }) {
  const pct=Math.round(score);
  const [ringColor,emoji,msg]=pct>=80?["#86efac","🎉","Harika iş!"]:pct>=60?["#fde047","💪","İyi gidiyorsun!"]:["#fca5a5","📚","Biraz daha pratik yapalım"];
  return <div style={{maxWidth:580,margin:"0 auto"}}>
    <div style={{textAlign:"center",paddingTop:20,marginBottom:32}}>
      <div style={{width:110,height:110,borderRadius:"50%",margin:"0 auto 18px",background:"rgba(56,189,248,.08)",border:`3px solid ${ringColor}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:ringColor}}>{pct}%</div>
      </div>
      <div style={{fontSize:22,fontWeight:800,color:"#f1f5f9",marginBottom:6}}>{emoji} {msg}</div>
      {fromCache&&<div style={{fontSize:12,color:"#334155"}}>Bu ödevi daha önce teslim etmiştin.</div>}
    </div>

    {feedback&&<div style={{marginBottom:28}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:12}}>Soru Bazlı Değerlendirme</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {feedback.map((f,i)=>(
          <div key={i} style={{background:"#0f172a",border:`1px solid ${f.is_correct?"rgba(134,239,172,.2)":"rgba(248,113,113,.2)"}`,borderRadius:12,padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:f.is_correct?0:10}}>
              <span style={{width:26,height:26,borderRadius:"50%",background:f.is_correct?"rgba(134,239,172,.15)":"rgba(248,113,113,.15)",color:f.is_correct?"#86efac":"#f87171",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{f.is_correct?"✓":"✗"}</span>
              <span style={{fontSize:14,fontWeight:600,color:f.is_correct?"#86efac":"#f87171"}}>Soru {f.id} — {f.is_correct?"Doğru":"Yanlış"}</span>
            </div>
            {!f.is_correct&&<div style={{paddingLeft:36}}>
              <div style={{fontSize:13,color:"#475569",marginBottom:4}}>Cevabın: <span style={{color:"#f87171",fontFamily:"monospace"}}>"{f.user_answer||"—"}"</span></div>
              <div style={{fontSize:13,color:"#475569",marginBottom:8}}>Doğru: <span style={{color:"#86efac",fontFamily:"monospace"}}>"{f.correct_answer}"</span></div>
              {f.hint&&<div style={{background:"rgba(56,189,248,.05)",border:"1px solid rgba(56,189,248,.1)",borderRadius:8,padding:"9px 13px",fontSize:13,color:"#64748b",lineHeight:1.6}}>💡 {f.hint}</div>}
            </div>}
          </div>
        ))}
      </div>
    </div>}

    <button onClick={onBack} style={{width:"100%",padding:"13px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Ödevlere Dön</button>
  </div>;
}

// ── Sınıflarım ────────────────────────────────────────────────────────
function MyClasses() {
  const [classes,setClasses]=useState([]);
  const [loading,setLoading]=useState(true);
  const [joinCode,setJoinCode]=useState("");
  const [joining,setJoining]=useState(false);
  const [err,setErr]=useState("");
  const [success,setSuccess]=useState("");

  const load=useCallback(()=>{api.getEnrolled().then(setClasses).finally(()=>setLoading(false));},[]);
  useEffect(()=>{load();},[load]);

  const handleJoin=async()=>{
    if (joinCode.trim().length<4){setErr("Geçersiz kod");return;}
    setJoining(true);setErr("");setSuccess("");
    try{const r=await api.joinClass(joinCode.trim());setSuccess(r.message);setJoinCode("");load();}
    catch(e){setErr(e.message);}
    finally{setJoining(false);}
  };

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Sınıflarım</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Kayıtlı sınıfların ve katılım kodu ile yeni sınıfa eklenebilirsin.</div>
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"18px 22px",marginBottom:24}}>
      <div style={{fontSize:12,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Sınıfa Katıl</div>
      <div style={{display:"flex",gap:10}}>
        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&handleJoin()} placeholder="Katılım kodunu gir..." maxLength={6}
          style={{flex:1,padding:"10px 16px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"monospace",letterSpacing:3,outline:"none"}}
          onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
        />
        <button onClick={handleJoin} disabled={joining} style={{padding:"10px 20px",background:joining?"#0c4a6e":"#38bdf8",color:joining?"#7dd3fc":"#0f172a",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:joining?"not-allowed":"pointer",fontFamily:"inherit"}}>
          {joining?"...":"Katıl →"}
        </button>
      </div>
      {err&&<div style={{fontSize:12,color:"#f87171",marginTop:6}}>{err}</div>}
      {success&&<div style={{fontSize:12,color:"#86efac",marginTop:6}}>✓ {success}</div>}
    </div>
    {loading?<Spinner/>:classes.length===0?(
      <div style={{background:"#0f172a",border:"1px dashed #1e293b",borderRadius:12,padding:32,textAlign:"center",color:"#334155",fontSize:13}}>Henüz sınıfa kayıtlı değilsin.</div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {classes.map(c=>(
          <div key={c.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"16px 22px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:42,height:42,borderRadius:9,background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#38bdf8",flexShrink:0}}>◈</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:12,color:"#475569"}}>Öğretmen: {c.teacher_name} · {c.level}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>;
}

// ── İlerleme ──────────────────────────────────────────────────────────
function ProgressPage() {
  const [assignments,setAssignments]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{api.getMyAssignments().then(setAssignments).finally(()=>setLoading(false));},[]);
  const completed=assignments.filter(a=>a.status==="completed");
  const scores=completed.map(a=>a.score).filter(Boolean);
  const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>İlerleme</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Tamamladığın ödevlerin özeti.</div>
    {loading?<Spinner/>:<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        {[{label:"Tamamlanan",value:completed.length},{label:"Bekleyen",value:assignments.length-completed.length},{label:"Genel Ort.",value:avg!=null?`%${avg}`:"—"}].map(s=>(
          <div key={s.label} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"16px 20px"}}>
            <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:24,fontWeight:800,color:"#38bdf8"}}>{s.value}</div>
          </div>
        ))}
      </div>
      {completed.length===0?<div style={{fontSize:13,color:"#334155",textAlign:"center",padding:24}}>Henüz tamamlanan ödev yok.</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {completed.map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#0f172a",border:"1px solid #1e293b",borderRadius:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#f1f5f9",marginBottom:2}}>{a.title}</div>
                <div style={{fontSize:12,color:"#475569"}}>{a.classroom_name} · {a.topic}</div>
              </div>
              <div style={{fontSize:20,fontWeight:800,color:a.score>=80?"#86efac":a.score>=60?"#fde047":"#fca5a5"}}>%{Math.round(a.score)}</div>
            </div>
          ))}
        </div>
      )}
    </>}
  </div>;
}

// ── Notlarım ─────────────────────────────────────────────────────────
function NotesPage() {
  const [notes,setNotes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [text,setText]=useState("");
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");

  const load=()=>api.getNotes().then(setNotes).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const handleAdd=async()=>{
    if (!text.trim()) return;
    setSaving(true);
    try{await api.addNote({content:text});setText("");load();}
    catch(e){setErr(e.message);}
    finally{setSaving(false);}
  };

  const handleDelete=async(id)=>{
    try{await api.deleteNote(id);load();}
    catch(e){setErr(e.message);}
  };

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Notlarım</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:22}}>Kendine not ekleyebilirsin. Öğretmenin yazdığı notlar da burada görünür.</div>
    <Toast msg={err} onClose={()=>setErr("")}/>
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"18px 22px",marginBottom:22}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Yeni not ekle..."
        style={{width:"100%",padding:"10px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}
        onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
      />
      <button onClick={handleAdd} disabled={saving||!text.trim()} style={{padding:"9px 22px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {saving?"...":"Kaydet"}
      </button>
    </div>
    {loading?<Spinner/>:notes.length===0?<div style={{fontSize:13,color:"#334155",textAlign:"center",padding:24}}>Henüz not yok.</div>:(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {notes.map(n=>{
          const isOwn=n.author===getName();
          return <div key={n.id} style={{background:"#0f172a",border:`1px solid ${isOwn?"#1e293b":"rgba(56,189,248,.2)"}`,borderRadius:10,padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:700,color:isOwn?"#475569":"#38bdf8"}}>{isOwn?"Kendin":"Öğretmen · "+n.author}</span>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:11,color:"#334155"}}>{new Date(n.created_at).toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</span>
                {isOwn&&<button onClick={()=>handleDelete(n.id)} style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:14,padding:0}}>✕</button>}
              </div>
            </div>
            <div style={{fontSize:14,color:"#94a3b8",lineHeight:1.6}}>{n.content}</div>
          </div>;
        })}
      </div>
    )}
  </div>;
}

// ── Destek ───────────────────────────────────────────────────────────
function SupportPage() {
  const [subject,setSubject]=useState("");
  const [message,setMessage]=useState("");
  const [sending,setSending]=useState(false);
  const [tickets,setTickets]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [success,setSuccess]=useState("");

  useEffect(()=>{api.getTickets().then(setTickets).finally(()=>setLoading(false));},[]);

  const handleSend=async()=>{
    if (!subject.trim()||!message.trim()){setErr("Tüm alanları doldurun");return;}
    setSending(true);setErr("");setSuccess("");
    try{
      await api.submitTicket({subject,message});
      setSuccess("Talebiniz alındı! En kısa sürede yanıt vereceğiz.");
      setSubject("");setMessage("");
      api.getTickets().then(setTickets);
    }catch(e){setErr(e.message);}
    finally{setSending(false);}
  };

  const statusColor={open:"#fde047",answered:"#86efac",closed:"#475569"};
  const statusLabel={open:"Bekliyor",answered:"Yanıtlandı",closed:"Kapandı"};

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Destek</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:22}}>Sorun mu yaşıyorsun? Bize yaz, en kısa sürede dönelim.</div>
    <Toast msg={err} onClose={()=>setErr("")}/>
    {success&&<div style={{background:"rgba(134,239,172,.1)",border:"1px solid rgba(134,239,172,.3)",borderRadius:10,padding:"11px 16px",marginBottom:16,fontSize:13,color:"#86efac"}}>{success}</div>}
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"20px 24px",marginBottom:24}}>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Konu</label>
        <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Kısaca konuyu belirtin..."
          style={{width:"100%",padding:"11px 16px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
        />
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Mesaj</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Detaylı açıklayın..."
          style={{width:"100%",padding:"10px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
        />
      </div>
      <button onClick={handleSend} disabled={sending} style={{padding:"11px 28px",background:sending?"#0c4a6e":"#38bdf8",color:sending?"#7dd3fc":"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {sending?"Gönderiliyor...":"Gönder →"}
      </button>
    </div>
    {!loading&&tickets.length>0&&<>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:10}}>Önceki Talepler</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tickets.map(t=>(
          <div key={t.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"13px 18px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"#f1f5f9",marginBottom:2}}>{t.subject}</div>
              <div style={{fontSize:12,color:"#475569"}}>{new Date(t.created_at).toLocaleDateString("tr-TR")}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:statusColor[t.status],background:`${statusColor[t.status]}20`,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{statusLabel[t.status]}</span>
          </div>
        ))}
      </div>
    </>}
  </div>;
}

// ── Ana ───────────────────────────────────────────────────────────────
function HomeTab({ onStartQuiz }) {
  const [assignments,setAssignments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");

  useEffect(()=>{api.getMyAssignments().then(setAssignments).catch(e=>setErr(e.message)).finally(()=>setLoading(false));},[]);
  const pending=assignments.filter(a=>a.status==="pending");
  const completed=assignments.filter(a=>a.status==="completed");

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Merhaba, {getName().split(" ")[0]} 👋</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Bekleyen ödevlerin aşağıda.</div>
    <Toast msg={err} onClose={()=>setErr("")}/>
    {loading?<Spinner/>:<>
      {pending.length===0&&completed.length===0&&<div style={{background:"#0f172a",border:"1px dashed #1e293b",borderRadius:12,padding:40,textAlign:"center",color:"#334155",fontSize:13}}>Henüz ödevin yok. Öğretmeninden sınıf katılım kodunu iste.</div>}
      {pending.length>0&&<>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:10}}>Bekleyen — {pending.length}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>{pending.map(a=><AssignmentCard key={a.id} a={a} onStart={onStartQuiz}/>)}</div>
      </>}
      {completed.length>0&&<>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:10}}>Tamamlanan — {completed.length}</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{completed.map(a=><AssignmentCard key={a.id} a={a} onStart={()=>{}}/>)}</div>
      </>}
    </>}
  </div>;
}

export default function App() {
  const [page,setPage]=useState("home");
  const [activeId,setActiveId]=useState(null);
  const [result,setResult]=useState(null);

  const handleLogout=()=>{
    ["lexi_token","lexi_role","lexi_name","lexi_uid"].forEach(k=>localStorage.removeItem(k));
    window.location.href="/";
  };

  const startQuiz=(id)=>{setActiveId(id);setResult(null);setPage("quiz");};
  const handleFinish=(data)=>{setResult(data);setPage("result");};
  const goHome=()=>{setActiveId(null);setResult(null);setPage("home");};

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#020817;color:#f1f5f9}
    input::placeholder,textarea::placeholder{color:#334155}
    select option{background:#0f172a}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
  `;

  return <>
    <style>{css}</style>
    <div style={{display:"flex",minHeight:"100vh"}}>
      <Sidebar page={page} setPage={p=>{setPage(p);setActiveId(null);setResult(null);}} onLogout={handleLogout}/>
      <main style={{flex:1,padding:"40px 48px",overflowY:"auto",background:"#020817"}}>
        {page==="home"     && <HomeTab onStartQuiz={startQuiz}/>}
        {page==="classes"  && <MyClasses/>}
        {page==="progress" && <ProgressPage/>}
        {page==="notes"    && <NotesPage/>}
        {page==="support"  && <SupportPage/>}
        {page==="quiz"&&activeId && <QuizScreen assignmentId={activeId} onFinish={handleFinish} onBack={goHome}/>}
        {page==="result"&&result && <ResultScreen {...result} onBack={goHome}/>}
      </main>
    </div>
  </>;
}
