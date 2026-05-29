import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000/api";
const getToken = () => localStorage.getItem("lexi_token");
const getName  = () => localStorage.getItem("lexi_name") || "Öğretmen";

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
  getClassrooms:        ()          => apiFetch("/classrooms/my"),
  createClassroom:      (b)         => apiFetch("/classrooms",              { method:"POST", body:b }),
  updateClassroom:      (id, b)     => apiFetch(`/classrooms/${id}`,        { method:"PATCH", body:b }),
  searchByCode:         (code)      => apiFetch(`/classrooms/search?code=${code}`),
  getClassroomDetail:   (id)        => apiFetch(`/classrooms/${id}/detail`),
  createAssignment:     (b)         => apiFetch("/assignments",             { method:"POST", body:b }),
  bulkAssign:           (b)         => apiFetch("/classrooms/bulk-assign",  { method:"POST", body:b }),
  getAssignmentResults: (id)        => apiFetch(`/assignments/${id}/results`),
  getNotes:             ()          => apiFetch("/notes/my"),
  addNote:              (b)         => apiFetch("/notes",                   { method:"POST", body:b }),
  deleteNote:           (id)        => apiFetch(`/notes/${id}`,             { method:"DELETE" }),
  getStudentNotes:      (sid)       => apiFetch(`/notes/student/${sid}`),
  submitTicket:         (b)         => apiFetch("/support",                 { method:"POST", body:b }),
  getTickets:           ()          => apiFetch("/support/my"),
};

const TOPICS = ["Present Perfect Tense","Past Simple vs Past Continuous","Conditionals (Type 1 & 2)","Passive Voice","Modal Verbs","Reported Speech","Gerunds & Infinitives","Articles (a, an, the)"];
const LEVELS = ["A1","A2","B1","B2","C1"];

// ── Küçük UI bileşenleri ──────────────────────────────────────────────
function Spinner() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0"}}>
    <div style={{width:30,height:30,border:"3px solid #1e293b",borderTop:"3px solid #38bdf8",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

function Toast({ msg, type="error", onClose }) {
  if (!msg) return null;
  const [bg,color] = type==="success" ? ["rgba(134,239,172,.1)","#86efac"] : ["rgba(248,113,113,.1)","#f87171"];
  return <div style={{background:bg,border:`1px solid ${color}40`,borderRadius:10,padding:"11px 16px",marginBottom:18,fontSize:13,color,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    {msg}<button onClick={onClose} style={{background:"none",border:"none",color,cursor:"pointer",fontSize:16}}>✕</button>
  </div>;
}

function ScorePill({ score }) {
  if (score==null) return <span style={{fontSize:12,color:"#64748b",background:"#1e293b",padding:"3px 10px",borderRadius:20}}>—</span>;
  const [bg,c]=score>=80?["#14532d","#86efac"]:score>=60?["#713f12","#fde047"]:["#7f1d1d","#fca5a5"];
  return <span style={{fontSize:12,fontWeight:700,background:bg,color:c,padding:"3px 10px",borderRadius:20}}>{Math.round(score)}%</span>;
}

function LevelBtn({ val, active, onClick }) {
  return <button onClick={onClick} style={{flex:1,padding:"9px 0",border:`1.5px solid ${active?"#38bdf8":"#1e293b"}`,borderRadius:7,background:active?"rgba(56,189,248,.1)":"#0f172a",color:active?"#38bdf8":"#475569",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{val}</button>;
}

function Field({ label, value, onChange, type="text", placeholder, style:s }) {
  const base = {width:"100%",padding:"11px 16px",background:"#0f172a",border:"1.5px solid #1e293b",borderRadius:10,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  return <div style={{marginBottom:16}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{...base,...s}}
      onFocus={e=>e.target.style.borderColor="#38bdf8"}
      onBlur={e=>e.target.style.borderColor="#1e293b"}
    />
  </div>;
}

// ── Sidebar ───────────────────────────────────────────────────────────
function Sidebar({ active, setActive, onLogout }) {
  const items = [
    { id:"dashboard",        icon:"◈", label:"Panel"          },
    { id:"create-class",     icon:"＋", label:"Yeni Sınıf"    },
    { id:"create-assignment",icon:"✦", label:"Ödev Ata"       },
    { id:"notes",            icon:"✎", label:"Notlarım"       },
    { id:"support",          icon:"◎", label:"Destek"         },
  ];
  return <aside style={{width:210,minHeight:"100vh",background:"#0a0f1e",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",padding:"28px 0"}}>
    <div style={{padding:"0 20px 22px",borderBottom:"1px solid #1e293b",marginBottom:14}}>
      <div style={{fontSize:20,fontWeight:900,color:"#38bdf8",letterSpacing:-.5}}>lexi</div>
      <div style={{fontSize:10,color:"#334155",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Öğretmen Paneli</div>
    </div>
    <div style={{flex:1,padding:"0 10px"}}>
      {items.map(i=>(
        <button key={i.id} onClick={()=>setActive(i.id)} style={{
          width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
          background:active===i.id?"rgba(56,189,248,.1)":"transparent",
          border:"none",borderLeft:active===i.id?"2px solid #38bdf8":"2px solid transparent",
          borderRadius:"0 8px 8px 0",color:active===i.id?"#38bdf8":"#475569",
          fontSize:13,fontWeight:active===i.id?700:400,cursor:"pointer",fontFamily:"inherit",
          marginBottom:2,transition:"all .15s",textAlign:"left",
        }}><span>{i.icon}</span>{i.label}</button>
      ))}
    </div>
    <div style={{padding:"16px 20px",borderTop:"1px solid #1e293b"}}>
      <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:4}}>{getName()}</div>
      <button onClick={onLogout} style={{background:"none",border:"none",color:"#334155",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}}>Çıkış Yap</button>
    </div>
  </aside>;
}

// ── Dashboard ─────────────────────────────────────────────────────────
function Dashboard({ setActive, setContext }) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [searching, setSearching]   = useState(false);
  const [searchErr, setSearchErr]   = useState("");

  useEffect(() => {
    api.getClassrooms().then(setClassrooms).finally(()=>setLoading(false));
  }, []);

  const handleCodeSearch = async () => {
    if (searchCode.trim().length < 4) return;
    setSearching(true); setSearchErr("");
    try {
      const c = await api.searchByCode(searchCode.trim());
      setContext({ classroomId: c.id });
      setActive("classroom-detail");
    } catch(e) {
      setSearchErr("Sınıf bulunamadı");
    } finally {
      setSearching(false);
    }
  };

  return <div>
    <div style={{marginBottom:28}}>
      <div style={{fontSize:22,fontWeight:800,color:"#f1f5f9"}}>Hoş geldin, {getName().split(" ")[0]} 👋</div>
      <div style={{fontSize:14,color:"#475569",marginTop:4}}>Sınıflarına hızlıca ulaş.</div>
    </div>

    {/* Hızlı kod arama */}
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"16px 20px",marginBottom:28}}>
      <div style={{fontSize:12,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Sınıf Kodu ile Git</div>
      <div style={{display:"flex",gap:10}}>
        <input value={searchCode} onChange={e=>setSearchCode(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==="Enter"&&handleCodeSearch()}
          placeholder="Kod gir... (örn: XK9P2M)" maxLength={6}
          style={{flex:1,padding:"10px 16px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"monospace",letterSpacing:3,outline:"none"}}
          onFocus={e=>e.target.style.borderColor="#38bdf8"}
          onBlur={e=>e.target.style.borderColor="#1e293b"}
        />
        <button onClick={handleCodeSearch} disabled={searching} style={{padding:"10px 20px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {searching?"...":"Git →"}
        </button>
      </div>
      {searchErr && <div style={{fontSize:12,color:"#f87171",marginTop:6}}>{searchErr}</div>}
    </div>

    {/* Stat kartlar */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
      {[
        {label:"Toplam Sınıf",   value:classrooms.length},
        {label:"Toplam Öğrenci", value:classrooms.reduce((a,c)=>a+(c.student_count||0),0)},
        {label:"Sınıflar",       value:LEVELS.filter(l=>classrooms.some(c=>c.level===l)).join(", ")||"—"},
      ].map(s=>(
        <div key={s.label} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"18px 22px"}}>
          <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{s.label}</div>
          <div style={{fontSize:22,fontWeight:800,color:"#38bdf8"}}>{s.value}</div>
        </div>
      ))}
    </div>

    <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:12}}>Sınıflarım</div>
    {loading ? <Spinner /> : classrooms.length===0 ? (
      <div style={{background:"#0f172a",border:"1px dashed #1e293b",borderRadius:12,padding:40,textAlign:"center",color:"#334155",fontSize:14}}>
        Henüz sınıfın yok.{" "}
        <button onClick={()=>setActive("create-class")} style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit"}}>İlk sınıfı oluştur →</button>
      </div>
    ) : (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {classrooms.map(c=>(
          <div key={c.id} onClick={()=>{setContext({classroomId:c.id});setActive("classroom-detail");}}
            style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"16px 22px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#38bdf8"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1e293b"}
          >
            <div style={{width:42,height:42,borderRadius:9,background:"rgba(56,189,248,.1)",border:"1px solid rgba(56,189,248,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#38bdf8",flexShrink:0}}>{c.level}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:12,color:"#475569"}}>{c.student_count} öğrenci</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.2)",borderRadius:7,padding:"5px 12px",letterSpacing:2,fontFamily:"monospace"}}>{c.join_code}</div>
            <span style={{color:"#334155",fontSize:18}}>›</span>
          </div>
        ))}
      </div>
    )}
  </div>;
}

// ── Sınıf Detayı ─────────────────────────────────────────────────────
function ClassroomDetail({ classroomId, setActive, setContext }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("students");
  const [err, setErr]           = useState("");
  // Seviye düzenleme
  const [editLevel, setEditLevel]   = useState(false);
  const [newLevel, setNewLevel]     = useState("");
  const [savingLevel, setSavingLevel] = useState(false);
  // Not ekleme
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteText, setNoteText]     = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getClassroomDetail(classroomId)
      .then(d => { setData(d); setNewLevel(d.level); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [classroomId]);

  useEffect(()=>{ load(); },[load]);

  const handleSaveLevel = async () => {
    setSavingLevel(true);
    try {
      await api.updateClassroom(classroomId, { level: newLevel });
      setEditLevel(false);
      load();
    } catch(e) { setErr(e.message); }
    finally { setSavingLevel(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !noteTarget) return;
    setAddingNote(true);
    try {
      await api.addNote({ content: noteText, target_id: noteTarget.id, classroom_id: classroomId });
      setNoteText(""); setNoteTarget(null);
    } catch(e) { setErr(e.message); }
    finally { setAddingNote(false); }
  };

  if (loading) return <Spinner />;
  if (!data)   return <Toast msg={err} onClose={()=>setErr("")} />;

  const scores  = data.students.map(s=>s.avg_score).filter(Boolean);
  const classAvg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;

  return <div>
    <button onClick={()=>setActive("dashboard")} style={{background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:22,padding:0}}>← Panele Dön</button>

    <Toast msg={err} onClose={()=>setErr("")} />

    {/* Başlık + seviye edit */}
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
      <div>
        <div style={{fontSize:22,fontWeight:800,color:"#f1f5f9",marginBottom:6}}>{data.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {editLevel ? (
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {LEVELS.map(l=>(
                <button key={l} onClick={()=>setNewLevel(l)} style={{
                  padding:"5px 12px",border:`1.5px solid ${newLevel===l?"#38bdf8":"#1e293b"}`,
                  borderRadius:7,background:newLevel===l?"rgba(56,189,248,.1)":"#0f172a",
                  color:newLevel===l?"#38bdf8":"#475569",fontSize:12,fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                }}>{l}</button>
              ))}
              <button onClick={handleSaveLevel} disabled={savingLevel} style={{padding:"5px 14px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {savingLevel?"...":"Kaydet"}
              </button>
              <button onClick={()=>setEditLevel(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>İptal</button>
            </div>
          ) : (
            <>
              <span style={{fontSize:13,color:"#64748b"}}>Seviye: <strong style={{color:"#38bdf8"}}>{data.level}</strong></span>
              <button onClick={()=>setEditLevel(true)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:12,fontFamily:"inherit",padding:0}}>✎ Değiştir</button>
              <span style={{fontSize:12,fontWeight:700,color:"#38bdf8",letterSpacing:2,fontFamily:"monospace",background:"rgba(56,189,248,.08)",padding:"3px 10px",borderRadius:6}}>KOD: {data.join_code}</span>
            </>
          )}
        </div>
      </div>
      <button onClick={()=>{setContext({classroomId,classroomName:data.name,classroomLevel:data.level});setActive("create-assignment");}}
        style={{padding:"10px 20px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        ✦ Ödev Ata
      </button>
    </div>

    {/* Stat kartlar */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
      {[
        {label:"Öğrenci",     value:data.students.length},
        {label:"Ödev",        value:data.assignments.length},
        {label:"Sınıf Ort.",  value:classAvg!=null?`%${classAvg}`:"—"},
      ].map(s=>(
        <div key={s.label} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"14px 18px"}}>
          <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{s.label}</div>
          <div style={{fontSize:22,fontWeight:800,color:"#38bdf8"}}>{s.value}</div>
        </div>
      ))}
    </div>

    {/* Tab */}
    <div style={{display:"flex",gap:4,marginBottom:18}}>
      {[["students","Öğrenciler"],["assignments","Ödevler"],["notes","Notlar"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",border:"none",borderRadius:8,fontSize:13,fontWeight:600,background:tab===id?"rgba(56,189,248,.12)":"transparent",color:tab===id?"#38bdf8":"#475569",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{lbl}</button>
      ))}
    </div>

    {/* Öğrenciler */}
    {tab==="students" && (
      data.students.length===0 ? (
        <div style={{background:"#0f172a",border:"1px dashed #1e293b",borderRadius:10,padding:32,textAlign:"center",color:"#334155",fontSize:13}}>
          Henüz öğrenci yok. Join kodu paylaş: <strong style={{color:"#38bdf8",letterSpacing:2}}>{data.join_code}</strong>
        </div>
      ) : (
        <div style={{border:"1px solid #1e293b",borderRadius:12,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 48px",padding:"10px 20px",background:"#0a0f1e",fontSize:11,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:1}}>
            <span>Öğrenci</span><span style={{textAlign:"center"}}>Ödev</span><span style={{textAlign:"center"}}>Ort.</span><span/>
          </div>
          {data.students.map((s,i)=>(
            <div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 48px",padding:"12px 20px",alignItems:"center",borderTop:"1px solid #1e293b",background:i%2===0?"#0f172a":"transparent"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(56,189,248,.1)",color:"#38bdf8",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {s.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <span style={{fontSize:14,fontWeight:600,color:"#f1f5f9"}}>{s.full_name}</span>
              </div>
              <span style={{fontSize:13,color:"#64748b",textAlign:"center"}}>{s.submission_count}</span>
              <div style={{textAlign:"center"}}><ScorePill score={s.avg_score} /></div>
              <button onClick={()=>setNoteTarget(s)} title="Not ekle" style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16,padding:"4px"}}>✎</button>
            </div>
          ))}
        </div>
      )
    )}

    {/* Ödevler */}
    {tab==="assignments" && (
      data.assignments.length===0 ? (
        <div style={{background:"#0f172a",border:"1px dashed #1e293b",borderRadius:10,padding:32,textAlign:"center",color:"#334155",fontSize:13}}>
          Henüz ödev yok.{" "}
          <button onClick={()=>{setContext({classroomId,classroomName:data.name,classroomLevel:data.level});setActive("create-assignment");}} style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>Ödev oluştur →</button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {data.assignments.map(a=>(
            <div key={a.id} onClick={()=>{setContext({assignmentId:a.id,assignmentTitle:a.title});setActive("assignment-results");}}
              style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#38bdf8"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#1e293b"}
            >
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginBottom:3}}>{a.title}</div>
                <div style={{fontSize:12,color:"#475569"}}>{a.topic} · {a.level} · {a.question_count} soru · {new Date(a.created_at).toLocaleDateString("tr-TR")}</div>
              </div>
              <div style={{textAlign:"center",minWidth:60}}>
                <div style={{fontSize:11,color:"#334155",marginBottom:2}}>Teslim</div>
                <div style={{fontSize:16,fontWeight:700,color:"#94a3b8"}}>{a.submission_count}</div>
              </div>
              <ScorePill score={a.avg_score} />
              <span style={{color:"#334155",fontSize:18}}>›</span>
            </div>
          ))}
        </div>
      )
    )}

    {/* Notlar tab */}
    {tab==="notes" && <NotesTab classroomId={classroomId} students={data.students} />}

    {/* Not ekleme modal */}
    {noteTarget && (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
        <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"28px 32px",width:440}}>
          <div style={{fontSize:16,fontWeight:700,color:"#f1f5f9",marginBottom:4}}>{noteTarget.full_name} için not</div>
          <div style={{fontSize:12,color:"#475569",marginBottom:18}}>{data.name} sınıfı</div>
          <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={4} placeholder="Notunuzu yazın..."
            style={{width:"100%",padding:"11px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:10,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
          />
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={handleAddNote} disabled={addingNote||!noteText.trim()} style={{flex:1,padding:"11px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {addingNote?"Kaydediliyor...":"Notu Kaydet"}
            </button>
            <button onClick={()=>{setNoteTarget(null);setNoteText("");}} style={{padding:"11px 20px",background:"transparent",color:"#475569",border:"1px solid #1e293b",borderRadius:10,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>İptal</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}

// ── Notlar Tab (sınıf içinde) ─────────────────────────────────────────
function NotesTab({ classroomId, students }) {
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [target, setTarget]     = useState("");
  const [text, setText]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const load = () => api.getNotes().then(n => setNotes(n.filter(x=>x.classroom===null||true))).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api.addNote({ content:text, target_id:target||undefined, classroom_id:classroomId });
      setText(""); load();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return <div>
    <Toast msg={err} onClose={()=>setErr("")} />
    {/* Not ekleme */}
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"18px 22px",marginBottom:20}}>
      <div style={{fontSize:12,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Yeni Not</div>
      <select value={target} onChange={e=>setTarget(e.target.value)}
        style={{width:"100%",padding:"10px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:target?"#f1f5f9":"#475569",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:10}}
        onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
      >
        <option value="">Öğrenci seç (opsiyonel)</option>
        {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
      </select>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Not içeriği..."
        style={{width:"100%",padding:"10px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}
        onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
      />
      <button onClick={handleAdd} disabled={saving||!text.trim()} style={{padding:"9px 22px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {saving?"...":"Kaydet"}
      </button>
    </div>
    {loading ? <Spinner /> : notes.length===0 ? (
      <div style={{fontSize:13,color:"#334155",textAlign:"center",padding:24}}>Henüz not yok.</div>
    ) : (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {notes.map(n=>(
          <div key={n.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:700,color:"#38bdf8"}}>{n.target}</span>
              <span style={{fontSize:11,color:"#334155"}}>{new Date(n.created_at).toLocaleDateString("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
            </div>
            <div style={{fontSize:14,color:"#94a3b8",lineHeight:1.6}}>{n.content}</div>
          </div>
        ))}
      </div>
    )}
  </div>;
}

// ── Ödev Oluştur (tekli + toplu) ─────────────────────────────────────
function CreateAssignment({ context, setActive }) {
  const [classrooms, setClassrooms] = useState([]);
  const [mode, setMode]     = useState("single"); // single | bulk
  const [form, setForm]     = useState({ classroom_id:context?.classroomId||"", title:"", topic:"", level:context?.classroomLevel||"B1", question_count:5 });
  const [bulkIds, setBulkIds] = useState(context?.classroomId ? [context.classroomId] : []);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [err, setErr]       = useState("");
  const [done, setDone]     = useState(null);

  useEffect(()=>{ api.getClassrooms().then(setClassrooms).finally(()=>setFetching(false)); },[]);

  const toggleBulk = (id) => setBulkIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);

  const handleSubmit = async () => {
    if (!form.title.trim()) { setErr("Başlık gerekli"); return; }
    if (!form.topic)        { setErr("Konu seç"); return; }
    if (mode==="single" && !form.classroom_id) { setErr("Sınıf seç"); return; }
    if (mode==="bulk" && bulkIds.length===0)   { setErr("En az bir sınıf seç"); return; }
    setLoading(true); setErr("");
    try {
      let result;
      if (mode==="single") {
        result = await api.createAssignment({ ...form, question_count:Number(form.question_count) });
        setDone({ type:"single", ...result });
      } else {
        result = await api.bulkAssign({ classroom_ids:bulkIds, title:form.title, topic:form.topic, level:form.level, question_count:Number(form.question_count) });
        setDone({ type:"bulk", ...result });
      }
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  if (done) return <div style={{maxWidth:500,textAlign:"center",paddingTop:40}}>
    <div style={{fontSize:40,marginBottom:16}}>✦</div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:8}}>
      {done.type==="bulk" ? `${done.classrooms?.length} Sınıfa Atandı!` : "Ödev Oluşturuldu!"}
    </div>
    <div style={{fontSize:14,color:"#64748b",marginBottom:20}}>{done.message || `Claude ${done.question_count} soru üretti.`}</div>
    {done.classrooms && <div style={{fontSize:13,color:"#38bdf8",marginBottom:20}}>{done.classrooms.join(" · ")}</div>}
    <button onClick={()=>setActive("dashboard")} style={{padding:"12px 28px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Panele Dön</button>
  </div>;

  const sel = {width:"100%",padding:"11px 16px",background:"#0f172a",border:"1.5px solid #1e293b",borderRadius:10,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

  return <div style={{maxWidth:520}}>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Ödev Ata</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Claude seçtiğin konuya uygun sorular üretecek.</div>

    {/* Mod seçimi */}
    <div style={{display:"flex",gap:8,marginBottom:22}}>
      {[["single","Tekli Sınıf"],["bulk","Toplu Atama"]].map(([m,lbl])=>(
        <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",border:`1.5px solid ${mode===m?"#38bdf8":"#1e293b"}`,borderRadius:9,background:mode===m?"rgba(56,189,248,.1)":"#0f172a",color:mode===m?"#38bdf8":"#475569",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{lbl}</button>
      ))}
    </div>

    <Toast msg={err} onClose={()=>setErr("")} />

    {/* Sınıf seçimi */}
    {mode==="single" ? (
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Sınıf</label>
        {fetching ? <div style={{fontSize:13,color:"#334155"}}>Yükleniyor...</div> : (
          <select value={form.classroom_id} onChange={e=>setForm({...form,classroom_id:e.target.value})} style={sel}
            onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}>
            <option value="">Sınıf seç...</option>
            {classrooms.map(c=><option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
          </select>
        )}
      </div>
    ) : (
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Sınıflar ({bulkIds.length} seçili)</label>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {fetching ? <div style={{fontSize:13,color:"#334155"}}>Yükleniyor...</div> : classrooms.map(c=>(
            <div key={c.id} onClick={()=>toggleBulk(c.id)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:"#0f172a",border:`1.5px solid ${bulkIds.includes(c.id)?"#38bdf8":"#1e293b"}`,borderRadius:9,cursor:"pointer",transition:"all .15s"}}
            >
              <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${bulkIds.includes(c.id)?"#38bdf8":"#334155"}`,background:bulkIds.includes(c.id)?"#38bdf8":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {bulkIds.includes(c.id)&&<span style={{color:"#0f172a",fontSize:11,fontWeight:900}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:bulkIds.includes(c.id)?"#f1f5f9":"#64748b"}}>{c.name}</div>
                <div style={{fontSize:11,color:"#334155"}}>{c.level} · {c.student_count} öğrenci</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Ortak alanlar */}
    <Field label="Ödev Başlığı" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="Örn: Haftalık Present Perfect Ödevi" />

    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Konu</label>
      <select value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} style={sel}
        onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}>
        <option value="">Konu seç...</option>
        {TOPICS.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
      <div>
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Seviye</label>
        <div style={{display:"flex",gap:5}}>
          {LEVELS.map(l=><LevelBtn key={l} val={l} active={form.level===l} onClick={()=>setForm({...form,level:l})} />)}
        </div>
      </div>
      <Field label="Soru Sayısı" type="number" value={form.question_count} onChange={v=>setForm({...form,question_count:v})} />
    </div>

    {form.topic && <div style={{background:"rgba(56,189,248,.05)",border:"1px solid rgba(56,189,248,.15)",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#64748b",lineHeight:1.6}}>
      <span style={{color:"#38bdf8",fontWeight:700}}>Claude şunları üretecek:</span>{" "}
      "{form.topic}" konusunda {form.level} seviyesinde {form.question_count} soru.
      {mode==="bulk" && bulkIds.length>0 && <span style={{color:"#38bdf8"}}> {bulkIds.length} sınıfa atanacak.</span>}
    </div>}

    <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#0c4a6e":"#38bdf8",color:loading?"#7dd3fc":"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .2s"}}>
      {loading?"⟳ Claude sorular üretiyor...":"✦ Ödevi Oluştur"}
    </button>
    {loading&&<p style={{fontSize:12,color:"#334155",textAlign:"center",marginTop:8}}>Bu işlem birkaç saniye sürebilir...</p>}
  </div>;
}

// ── Ödev Sonuçları ────────────────────────────────────────────────────
function AssignmentResults({ assignmentId, assignmentTitle, onBack }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState("");

  useEffect(()=>{
    api.getAssignmentResults(assignmentId).then(setData).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  },[assignmentId]);

  if (loading) return <Spinner />;

  return <div>
    <button onClick={onBack} style={{background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:22,padding:0}}>← Sınıfa Dön</button>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:20}}>{assignmentTitle}</div>
    <Toast msg={err} onClose={()=>setErr("")} />
    {data&&<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
        {[{label:"Teslim Eden",value:`${data.submitted_count}/${data.total_students}`},{label:"Sınıf Ort.",value:data.avg_score!=null?`%${Math.round(data.avg_score)}`:"—"},{label:"Bekleyen",value:data.total_students-data.submitted_count}].map(s=>(
          <div key={s.label} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"16px 18px"}}>
            <div style={{fontSize:11,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:"#38bdf8"}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{border:"1px solid #1e293b",borderRadius:12,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px 130px",padding:"10px 20px",background:"#0a0f1e",fontSize:11,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:1}}>
          <span>Öğrenci</span><span style={{textAlign:"center"}}>Not</span><span style={{textAlign:"right"}}>Teslim</span>
        </div>
        {data.results.map((r,i)=>(
          <div key={r.student_id} style={{display:"grid",gridTemplateColumns:"1fr 90px 130px",padding:"12px 20px",alignItems:"center",borderTop:"1px solid #1e293b",background:i%2===0?"#0f172a":"transparent"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(56,189,248,.1)",color:"#38bdf8",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {r.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <span style={{fontSize:14,color:"#f1f5f9",fontWeight:500}}>{r.full_name}</span>
            </div>
            <div style={{textAlign:"center"}}><ScorePill score={r.score} /></div>
            <div style={{textAlign:"right",fontSize:12,color:"#475569"}}>
              {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : <span style={{color:"#334155"}}>Bekliyor</span>}
            </div>
          </div>
        ))}
      </div>
    </>}
  </div>;
}

// ── Notlarım sayfası ──────────────────────────────────────────────────
function NotesPage() {
  const [notes, setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText]     = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const load = () => api.getNotes().then(setNotes).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try { await api.addNote({ content:text }); setText(""); load(); }
    catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteNote(id); load(); }
    catch(e) { setErr(e.message); }
  };

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Notlarım</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Kişisel notların ve öğrencilere yazdıkların.</div>
    <Toast msg={err} onClose={()=>setErr("")} />
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"18px 22px",marginBottom:24}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Yeni not ekle..."
        style={{width:"100%",padding:"11px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}
        onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
      />
      <button onClick={handleAdd} disabled={saving||!text.trim()} style={{padding:"9px 22px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {saving?"...":"Kaydet"}
      </button>
    </div>
    {loading?<Spinner/>:notes.length===0?<div style={{fontSize:13,color:"#334155",textAlign:"center",padding:24}}>Henüz not yok.</div>:(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {notes.map(n=>(
          <div key={n.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"14px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <span style={{fontSize:12,fontWeight:700,color:"#38bdf8"}}>{n.target}</span>
                {n.classroom&&<span style={{fontSize:11,color:"#334155",marginLeft:8}}>· {n.classroom}</span>}
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:11,color:"#334155"}}>{new Date(n.created_at).toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</span>
                <button onClick={()=>handleDelete(n.id)} style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:14,padding:0}}>✕</button>
              </div>
            </div>
            <div style={{fontSize:14,color:"#94a3b8",lineHeight:1.6}}>{n.content}</div>
          </div>
        ))}
      </div>
    )}
  </div>;
}

// ── Destek ───────────────────────────────────────────────────────────
function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [success, setSuccess] = useState("");

  useEffect(()=>{ api.getTickets().then(setTickets).finally(()=>setLoading(false)); },[]);

  const handleSend = async () => {
    if (!subject.trim()||!message.trim()) { setErr("Tüm alanları doldurun"); return; }
    setSending(true); setErr(""); setSuccess("");
    try {
      await api.submitTicket({ subject, message });
      setSuccess("Talebiniz alındı! En kısa sürede yanıt vereceğiz.");
      setSubject(""); setMessage("");
      api.getTickets().then(setTickets);
    } catch(e) { setErr(e.message); }
    finally { setSending(false); }
  };

  const statusColor = { open:"#fde047", answered:"#86efac", closed:"#475569" };
  const statusLabel = { open:"Bekliyor", answered:"Yanıtlandı", closed:"Kapandı" };

  return <div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Destek</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Sorun ya da öneriniz mi var? Bize yazın.</div>
    <Toast msg={err} onClose={()=>setErr("")} />
    {success&&<div style={{background:"rgba(134,239,172,.1)",border:"1px solid rgba(134,239,172,.3)",borderRadius:10,padding:"11px 16px",marginBottom:18,fontSize:13,color:"#86efac"}}>{success}</div>}
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"20px 24px",marginBottom:28}}>
      <Field label="Konu" value={subject} onChange={setSubject} placeholder="Kısaca konuyu belirtin..." />
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:7}}>Mesaj</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder="Detaylı açıklayın..."
          style={{width:"100%",padding:"11px 14px",background:"#0a0f1e",border:"1.5px solid #1e293b",borderRadius:9,color:"#f1f5f9",fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="#38bdf8"} onBlur={e=>e.target.style.borderColor="#1e293b"}
        />
      </div>
      <button onClick={handleSend} disabled={sending} style={{padding:"11px 28px",background:sending?"#0c4a6e":"#38bdf8",color:sending?"#7dd3fc":"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {sending?"Gönderiliyor...":"Gönder →"}
      </button>
    </div>
    {!loading&&tickets.length>0&&<>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:12}}>Önceki Talepler</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tickets.map(t=>(
          <div key={t.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"#f1f5f9",marginBottom:3}}>{t.subject}</div>
              <div style={{fontSize:12,color:"#475569"}}>{new Date(t.created_at).toLocaleDateString("tr-TR")}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:statusColor[t.status],background:`${statusColor[t.status]}20`,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{statusLabel[t.status]}</span>
          </div>
        ))}
      </div>
    </>}
  </div>;
}

// ── Ana uygulama ──────────────────────────────────────────────────────
export default function App() {
  const [active,  setActive]  = useState("dashboard");
  const [context, setContext] = useState({});

  const handleLogout = () => {
    ["lexi_token","lexi_role","lexi_name","lexi_uid"].forEach(k=>localStorage.removeItem(k));
    window.location.href = "/";
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#020817;color:#f1f5f9}
    select option{background:#0f172a;color:#f1f5f9}
    textarea::placeholder,input::placeholder{color:#334155}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
  `;

  return <>
    <style>{css}</style>
    <div style={{display:"flex",minHeight:"100vh"}}>
      <Sidebar active={active} setActive={p=>{setActive(p);setContext({});}} onLogout={handleLogout} />
      <main style={{flex:1,padding:"40px 48px",overflowY:"auto",background:"#020817"}}>
        {active==="dashboard"          && <Dashboard setActive={setActive} setContext={setContext} />}
        {active==="create-class"       && <CreateClassroomPage setActive={setActive} />}
        {active==="create-assignment"  && <CreateAssignment context={context} setActive={setActive} />}
        {active==="classroom-detail"   && <ClassroomDetail classroomId={context.classroomId} setActive={setActive} setContext={setContext} />}
        {active==="assignment-results" && <AssignmentResults assignmentId={context.assignmentId} assignmentTitle={context.assignmentTitle} onBack={()=>setActive("classroom-detail")} />}
        {active==="notes"              && <NotesPage />}
        {active==="support"            && <SupportPage />}
      </main>
    </div>
  </>;
}

// ── Sınıf Oluştur ─────────────────────────────────────────────────────
function CreateClassroomPage({ setActive }) {
  const [name, setName]     = useState("");
  const [level, setLevel]   = useState("B1");
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [done, setDone]     = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) { setErr("Sınıf adı gerekli"); return; }
    setLoading(true); setErr("");
    try { const c = await apiFetch("/classrooms",{method:"POST",body:{name:name.trim(),level}}); setDone(c); }
    catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  if (done) return <div style={{maxWidth:440,textAlign:"center",paddingTop:40}}>
    <div style={{fontSize:40,marginBottom:16}}>✓</div>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:8}}>Sınıf Oluşturuldu!</div>
    <div style={{fontSize:14,color:"#64748b",marginBottom:24}}>Öğrencilere bu kodu ver:</div>
    <div style={{fontSize:32,fontWeight:900,letterSpacing:8,color:"#38bdf8",background:"rgba(56,189,248,.08)",border:"2px dashed rgba(56,189,248,.3)",borderRadius:14,padding:"20px 32px",marginBottom:28,fontFamily:"monospace"}}>{done.join_code}</div>
    <button onClick={()=>setActive("dashboard")} style={{padding:"12px 28px",background:"#38bdf8",color:"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Panele Dön</button>
  </div>;

  return <div style={{maxWidth:460}}>
    <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:4}}>Yeni Sınıf</div>
    <div style={{fontSize:14,color:"#475569",marginBottom:24}}>Oluşturduktan sonra öğrencilere join kodu vereceksin.</div>
    <Toast msg={err} onClose={()=>setErr("")} />
    <Field label="Sınıf Adı" value={name} onChange={setName} placeholder="Örn: 10-A İngilizce, Yetişkin B1 Grubu..." />
    <div style={{marginBottom:24}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#475569",marginBottom:8}}>Seviye</label>
      <div style={{display:"flex",gap:8}}>
        {LEVELS.map(l=><LevelBtn key={l} val={l} active={level===l} onClick={()=>setLevel(l)} />)}
      </div>
    </div>
    <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#0c4a6e":"#38bdf8",color:loading?"#7dd3fc":"#0f172a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
      {loading?"Oluşturuluyor...":"Sınıfı Oluştur →"}
    </button>
  </div>;
}
