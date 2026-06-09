/* ==========================================================================
   TOEFL Structure — uygulama mantığı
   Modlar: practice (skill) · diagnostic · exam (süreli tam deneme) · review (tekrar havuzu)
   Bağımlılık yok; ilerleme localStorage'da saklanır.
   ========================================================================== */

const App = (() => {
  const STORE = "toefl_structure_progress_v1";
  const view = () => document.getElementById("view");

  // --- İlerleme deposu ---------------------------------------------------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; }
    catch { return {}; }
  }
  function save() { localStorage.setItem(STORE, JSON.stringify(progress)); }
  let progress = load();
  if (!progress.skills) progress.skills = {};
  if (!Array.isArray(progress.wrong)) progress.wrong = [];
  // Eski sürümde 'wrong' string id dizisiydi → temizle (artık soru anlık görüntüsü saklanır)
  progress.wrong = progress.wrong.filter(x => x && typeof x === "object");

  // --- Soru kaynağı: PROSEDÜREL ÜRETİCİ (her seferinde TAZE) -------------
  // GEN yoksa (ör. test) elimizdeki kürasyon bankasına düşeriz.
  const HAS_GEN = (typeof GEN !== "undefined");
  function genSkill(id, n){
    if (HAS_GEN && GEN.has(id)) return GEN.forSkill(id, n);
    return (CURRICULUM.skills[id]?.questions || []).map((q,i)=>Object.assign({},q,{_id:"s"+id+"_"+i,_skill:+id}));
  }
  function genExam(){
    if (HAS_GEN) return GEN.examSet();
    // yedek: kürasyon bankasından örnekle
    const mc=[],err=[];
    for(const id of Object.keys(CURRICULUM.skills))
      genSkill(id,99).forEach(q=>(q.type==="mc"?mc:err).push(q));
    return [...shuffle(mc).slice(0,15), ...shuffle(err).slice(0,25)];
  }
  function genDiagnostic(n){
    if (HAS_GEN) return GEN.diagnosticSet(n);
    return DIAGNOSTIC.map((q,i)=>Object.assign({},q,{_id:"d"+i,_skill:q.skill})).slice(0,n);
  }

  function setSkillScore(id, pct) {
    const s = progress.skills[id] || {};
    s.best = Math.max(s.best || 0, pct);
    if (pct >= 70) s.done = true;
    progress.skills[id] = s; save();
  }
  // Yanlış havuzu: üretilen sorular geçici olduğundan TAM anlık görüntü saklanır.
  function addWrong(q){
    const snap = JSON.parse(JSON.stringify(q));
    snap._wid = (progress.wseq = (progress.wseq||0)+1);
    progress.wrong.push(snap);
    if (progress.wrong.length > 300) progress.wrong.shift();
    save();
  }
  function removeWrong(wid){ const i=progress.wrong.findIndex(x=>x._wid===wid); if(i>=0){ progress.wrong.splice(i,1); save(); } }

  // --- Yardımcılar -------------------------------------------------------
  function esc(s){ return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
  const LETTERS = ["A","B","C","D"];
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function rnd(a){ return a[Math.floor(Math.random()*a.length)]; }
  function isCorrect(q, ans){ return q.type==="mc" ? ans===q.answer : ans===q.answer; }
  function answerLabel(q, ans){ return q.type==="mc" ? (ans==null?"—":LETTERS[ans]+") "+q.options[ans]) : (ans||"—"); }

  function totalSkills(){ return Object.keys(CURRICULUM.skills).length; }
  function doneCount(){ return Object.values(progress.skills).filter(s=>s.done).length; }
  function dayProgress(day){
    const ids = CURRICULUM.plan.find(d=>d.day===day).skills;
    const done = ids.filter(id=>progress.skills[id]?.done).length;
    return { done, total: ids.length, pct: Math.round(done/ids.length*100) };
  }

  // --- Router ------------------------------------------------------------
  let examTimer = null;
  function go(route, arg){
    if (examTimer){ clearInterval(examTimer); examTimer=null; }
    window.scrollTo(0,0);
    if (route==="home") return renderHome();
    if (route==="day") return renderDay(arg);
    if (route==="lesson") return renderLesson(arg);
    if (route==="quiz") return startQuiz(arg);
    if (route==="diagnostic") return renderDiagnosticIntro();
    if (route==="exam") return renderExamIntro();
    if (route==="review") return startReview();
    if (route==="progress") return renderProgress();
    if (route==="auth") return renderAuth(arg);
    if (route==="account") return renderAccount();
    if (route==="book") return renderBookIntro();
    if (route==="bookquiz") return startBookQuiz();
    if (route==="vocab") return renderVocabIntro();
    if (route==="vocabflash") return startVocabFlash();
    if (route==="vocabquiz") return startVocabQuiz();
    if (route==="admin") return renderAdmin();
    if (route==="adminuser") return renderAdminUser(arg);
    if (route==="adminsettings") return renderAdminSettings();
  }

  // --- HOME --------------------------------------------------------------
  function skillCard(id, priority){
    const sk=CURRICULUM.skills[id]; const st=progress.skills[id]||{};
    const cls = sk.category==="Structure"?"struct":"written";
    return `<div class="skill-row" onclick="App.go('lesson',${id})">
      <div class="skill-badge ${priority?'pri':''}">${id}</div>
      <div class="meta"><b>${esc(sk.title)}</b>
        <small><span class="pill ${cls}">${sk.category}</span>${priority?' <span class="pill pri-pill">öncelik</span>':''}${st.best?` · en iyi: ${st.best}%`:''}</small></div>
      <div class="check ${st.done?'done':''}">${st.done?'✓':''}</div>
    </div>`;
  }
  function renderHome(){
    const done = doneCount(), total = totalSkills();
    const overall = Math.round(done/total*100);
    const diag = progress.diagnostic;
    const wrongN = progress.wrong.length;
    const u = API.user();
    const greeting = u ? `Merhaba ${esc(u.firstName||u.name)} 👋` : "TOEFL Structure 🎯";

    // Kişiye özel plan varsa onu göster; yoksa tanı testine yönlendir
    let planHtml;
    if (progress.plan && progress.plan.order){
      const weak = progress.plan.weak||[];
      const rest = progress.plan.order.filter(id=>!weak.includes(id));
      planHtml = `
        <div class="section-title">🎯 Öncelikli konuların ${weak.length?`(${weak.length})`:''}</div>
        <div class="skill-list">${ weak.length ? weak.map(id=>skillCard(id,true)).join("")
            : '<p class="cat">Tanıda zayıf konu çıkmadı — aşağıdan istediğinden başla. 👏'}</div>
        <div class="section-title">📚 Diğer konular</div>
        <div class="skill-list">${rest.map(id=>skillCard(id,false)).join("")}`;
    } else {
      planHtml = `
        <div class="card" style="text-align:center">
          <h2>🩺 Önce tanı testi</h2>
          <p class="cat">Seviyeni ölçüp <b>sana özel</b> bir plan çıkaralım. 20 soru, ~10 dk.</p>
          <div class="lesson-actions" style="justify-content:center">
            <button class="btn" onclick="App.go('diagnostic')">Tanı testine başla →</button>
          </div>
        </div>`;
    }

    view().innerHTML = `
      <section class="hero">
        <h1>${greeting}</h1>
        <p>${progress.plan?'Sana özel çalışma planın hazır. Öncelikli konularından başla.':'Kişisel planın için tanı testini tamamla.'}</p>
        <div class="hero-row">
          <div class="stat"><b>${done}/${total}</b><span>Tamamlanan beceri</span></div>
          <div class="stat"><b>${overall}%</b><span>Genel ilerleme</span></div>
          <div class="stat"><b>${diag ? diag.score+"/"+diag.total : "—"}</b><span>Tanı testi</span></div>
          <div class="stat"><b>${progress.examBest!=null?progress.examBest+"%":"—"}</b><span>En iyi deneme</span></div>
        </div>
        <div class="lesson-actions">
          <button class="btn sec" onclick="App.go('exam')">⏱️ Tam Deneme</button>
          <button class="btn sec" onclick="App.go('book')">📕 Kitap Soruları</button>
          <button class="btn sec" onclick="App.go('vocab')">📚 Kelime</button>
          ${wrongN?`<button class="btn sec" onclick="App.go('review')">🔁 Tekrar (${wrongN})</button>`:""}
        </div>
      </section>
      ${planHtml}`;
  }

  // --- DAY ---------------------------------------------------------------
  function renderDay(day){
    const d = CURRICULUM.plan.find(x=>x.day===day);
    const rows = d.skills.map(id=>{
      const sk = CURRICULUM.skills[id];
      const st = progress.skills[id] || {};
      const cls = sk.category==="Structure" ? "struct" : "written";
      return `<div class="skill-row" onclick="App.go('lesson',${id})">
        <div class="skill-badge">${id}</div>
        <div class="meta">
          <b>${esc(sk.title)}</b>
          <small><span class="pill ${cls}">${sk.category}</span>${st.best?` · en iyi: ${st.best}%`:""}</small>
        </div>
        <div class="check ${st.done?'done':''}">${st.done?'✓':''}</div>
      </div>`;
    }).join("");

    view().innerHTML = `
      <button class="back" onclick="App.go('home')">← Plana dön</button>
      <div class="card" style="margin-bottom:18px">
        <div class="day-num" style="color:var(--accent);font-weight:700">GÜN ${d.day}</div>
        <h2>${esc(d.title)}</h2>
        <p class="cat" style="margin-bottom:0">${esc(d.focus)}</p>
      </div>
      <div class="section-title">Bugünün becerileri</div>
      <div class="skill-list">${rows}</div>`;
  }

  // --- LESSON ------------------------------------------------------------
  function renderLesson(id){
    const sk = CURRICULUM.skills[id];
    const day = CURRICULUM.plan.find(d=>d.skills.includes(+id)).day;
    view().innerHTML = `
      <button class="back" onclick="App.go('day',${day})">← Gün ${day}</button>
      <div class="card">
        <div class="cat">Skill ${id} · ${sk.category}</div>
        <h2>${esc(sk.title)}</h2>
        <div class="rule">${sk.rule}</div>
        <div class="chart">📌 <b>Kilit kural:</b> ${esc(sk.chart)}</div>
        <div class="lesson-actions">
          <button class="btn" onclick="App.go('quiz',${id})">Quiz'e başla (20 soru) →</button>
          <button class="btn sec" onclick="App.go('day',${day})">Sonra</button>
        </div>
      </div>`;
  }

  // ======================================================================
  //  QUIZ MOTORU
  //  Q = { mode, questions[], idx, correct, answered, answers[], wrongSkills{},
  //        skillId?, examEnd? }
  // ======================================================================
  let Q = null;

  const PRACTICE_N = 20;   // her skill quizinde taze soru sayısı
  function startQuiz(skillId){
    Q = { mode:"practice", skillId, questions:genSkill(skillId, PRACTICE_N),
          idx:0, correct:0, answers:[], startedAt:Date.now() };
    API.logEvent("start_practice", {skill:skillId});
    paintQuestion();
  }
  function renderDiagnosticInternal(){
    Q = { mode:"diagnostic", questions:genDiagnostic(20),
          idx:0, correct:0, answers:[], wrongSkills:{}, startedAt:Date.now() };
    paintQuestion();
  }
  function startReview(){
    const qs = progress.wrong.slice();   // anlık görüntüler (taze değil, hatalı sorular)
    if (!qs.length){ return renderEmptyReview(); }
    Q = { mode:"review", questions:shuffle(qs), idx:0, correct:0, answers:[], startedAt:Date.now() };
    paintQuestion();
  }
  function startExam(){
    const questions = genExam();   // 40 TAZE soru (15 Structure + 25 Written), her seferinde farklı
    Q = { mode:"exam", questions, idx:0, correct:0, answers:new Array(questions.length).fill(null),
          examEnd: Date.now() + 25*60*1000, startedAt:Date.now() };
    API.logEvent("start_exam", {});
    paintQuestion();
    examTimer = setInterval(tickTimer, 1000);
  }

  function fmtLeft(){
    const left = Q && Q.examEnd ? Math.max(0, Math.round((Q.examEnd - Date.now())/1000)) : 25*60;
    return String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");
  }
  function tickTimer(){
    const el = document.getElementById("timer");
    if (!el){ clearInterval(examTimer); examTimer=null; return; }
    const left = Math.max(0, Math.round((Q.examEnd - Date.now())/1000));
    el.textContent = fmtLeft();
    el.classList.toggle("low", left<=60);
    if (left<=0){ clearInterval(examTimer); examTimer=null; finishExam(); }
  }

  // --- Tek soru çizimi ---------------------------------------------------
  function paintQuestion(){
    const q = Q.questions[Q.idx];
    const n = Q.questions.length;
    const pct = Math.round(Q.idx/n*100);
    const exam = Q.mode==="exam";

    const titles = { practice:"Skill "+Q.skillId, diagnostic:"Tanı Testi",
                     exam:"Tam Deneme", review:"Tekrar Havuzu", vocabquiz:"Kelime Quizi", book:"📕 Kitap Soruları" };
    const body = q.type==="mc" ? mcMarkup(q, exam) : errMarkup(q, exam);

    const backTargets = {
      practice:`App.go('lesson',${Q.skillId})`, diagnostic:"App.go('home')",
      exam:"App.confirmQuit()", review:"App.go('home')", vocabquiz:"App.go('vocab')", book:"App.go('book')"
    };

    const timer = exam ? `<span class="timer" id="timer">${fmtLeft()}</span>` : "";
    const nextLabel = Q.idx+1===n ? (exam?"Bitir ve gör":"Sonuçları gör") : "Sonraki soru";

    view().innerHTML = `
      <button class="back" onclick="${backTargets[Q.mode]}">← ${exam?"Sınavdan çık":"Çık"}</button>
      <div class="card">
        <div class="quiz-head">
          <span class="qcount">${esc(titles[Q.mode])}</span>
          <div class="qprog"><i style="width:${pct}%"></i></div>
          <span class="qcount">${timer} ${Q.idx+1} / ${n}</span>
        </div>
        ${body}
        <div class="feedback" id="fb"></div>
        <div class="quiz-foot">
          ${exam ? `<button class="btn sec" id="prevBtn" ${Q.idx===0?'style="display:none"':''} onclick="App.prevExam()">← Önceki</button>`:""}
          <button class="btn" id="nextBtn" ${exam?'':'style="display:none"'} onclick="App.next()">${nextLabel} →</button>
        </div>
      </div>`;

    Q.answered = false;

    // Sınavda önceden verilmiş cevabı geri yükle
    if (exam && Q.answers[Q.idx]!=null) restoreExamChoice(q, Q.answers[Q.idx]);
  }

  function mcMarkup(q, exam){
    const stem = esc(q.stem).replace(/___/g,'<span class="blank">______</span>');
    const opts = q.options.map((o,i)=>`
      <button class="opt" data-i="${i}" onclick="App.answerMC(${i})">
        <span class="lett">${LETTERS[i]}</span><span>${esc(o)}</span>
      </button>`).join("");
    return `<div class="question">${stem}</div><div class="options">${opts}</div>`;
  }
  function errMarkup(q, exam){
    const html = q.segments.map(seg=>{
      if (seg.plain!==undefined) return esc(seg.plain);
      return `<span class="uw" data-c="${seg.choice}" onclick="App.answerErr('${seg.choice}')">
        <span class="lbl">${seg.choice}</span>${esc(seg.text)}</span>`;
    }).join("");
    return `<div class="hint">Hatalı olan <b>altı çizili</b> bölümü seç:</div>
            <div class="err-sentence">${html}</div>`;
  }

  function restoreExamChoice(q, ans){
    if (q.type==="mc"){
      const b=document.querySelector(`.opt[data-i="${ans}"]`); if(b) b.classList.add("picked");
    } else {
      const el=document.querySelector(`.uw[data-c="${ans}"]`); if(el) el.classList.add("picked");
    }
  }

  // --- Cevap verme -------------------------------------------------------
  function answerMC(i){ handleAnswer(i, "mc"); }
  function answerErr(c){ handleAnswer(c, "err"); }

  function handleAnswer(ans, kind){
    const q = Q.questions[Q.idx];

    if (Q.mode==="exam"){
      Q.answers[Q.idx] = ans;
      // sadece seçimi işaretle, doğru/yanlış gösterme
      if (kind==="mc"){
        document.querySelectorAll(".opt").forEach(b=>b.classList.toggle("picked", +b.dataset.i===ans));
      } else {
        document.querySelectorAll(".uw").forEach(el=>el.classList.toggle("picked", el.dataset.c===ans));
      }
      return;
    }

    if (Q.answered) return;
    Q.answered = true;
    const ok = isCorrect(q, ans);

    if (kind==="mc"){
      document.querySelectorAll(".opt").forEach(b=>{ b.disabled=true;
        const bi=+b.dataset.i;
        if (bi===q.answer) b.classList.add("correct");
        else if (bi===ans) b.classList.add("wrong");
      });
    } else {
      document.querySelectorAll(".uw").forEach(el=>{ el.classList.add("locked");
        if (el.dataset.c===q.answer) el.classList.add("correct");
        else if (el.dataset.c===ans) el.classList.add("wrong");
      });
    }

    if (ok){ Q.correct++; if (Q.mode==="review") removeWrong(q._wid); }
    else { addWrong(q); if (Q.mode==="diagnostic" && q._skill) Q.wrongSkills[q._skill]=true; }

    const detail = q.explain || q.correction || "";
    const fb = document.getElementById("fb");
    fb.className = "feedback show " + (ok?"ok":"no");
    const aiBtn = API.authed()
      ? `<div class="ai-box"><button class="btn sec sm" onclick="App.aiExplain()">🤖 AI ile daha detaylı açıkla</button><div id="ai-out"></div></div>`
      : "";
    fb.innerHTML = `<span class="res ${ok?'ok':'no'}">${ok?'✓ Doğru':'✗ Yanlış'}</span>
      <b>${ok?'Özet':'Doğru cevap & özet'}</b>${esc(detail)}${breakdownHTML(q, ans)}${aiBtn}`;
    document.getElementById("nextBtn").style.display = "inline-block";
  }

  // --- AI AÇIKLAMA (ücretsiz sağlayıcı; sunucuda AI_API_KEY varsa) --------
  function questionToPrompt(q){
    if(q.type==="mc"){
      return `Soru: ${q.stem}\nŞıklar:\n`+q.options.map((o,i)=>`${LETTERS[i]}) ${o}`).join("\n")
        +`\nDoğru cevap: ${LETTERS[q.answer]}.\nBu şık neden doğru, diğer şıklar neden yanlış? Gramer kuralını da kısaca hatırlat.`;
    }
    const sent=q.segments.map(s=>s.plain!==undefined?s.plain:`[${s.choice}: ${s.text}]`).join("");
    return `Aşağıdaki cümlede altı çizili 4 bölüm köşeli parantezde verildi:\n${sent}\nHatalı bölüm: ${q.answer}. Düzeltme: ${q.correction||""}.\nNeden hatalı, diğer bölümler neden doğru? Kuralı kısaca açıkla.`;
  }
  async function aiExplain(){
    const out=document.getElementById("ai-out"); if(!out||!Q) return;
    out.innerHTML=`<span class="cat">🤖 AI düşünüyor…</span>`;
    try{
      const r=await API.explain(questionToPrompt(Q.questions[Q.idx]));
      if(r&&r.ok&&r.text) out.innerHTML=`<div class="ai-text">${esc(r.text).replace(/\n/g,"<br>")}</div>`;
      else out.innerHTML=`<span class="cat">${esc((r&&r.reason)||"AI şu an kullanılamıyor")}. Yukarıdaki şık şık açıklamayı kullanabilirsin.</span>`;
    }catch(e){ out.innerHTML=`<span class="cat">AI hatası: ${esc(e.message)}</span>`; }
  }

  // Her şık için detaylı açıklama bloğu
  function breakdownHTML(q, userAns){
    if (!q.breakdown) return "";
    let rows="";
    if (q.type==="mc"){
      // Boşluk doldurma: doğru şık yeşil, diğerleri kırmızı
      q.options.forEach((o,i)=>{
        rows += bdRow(LETTERS[i], o, q.breakdown[i], i===q.answer?"answer":"wrong", userAns===i);
      });
    } else {
      // Hata bulma: SADECE hatalı (doğru cevap) yeşil; diğer 3 kısım nötr (gri)
      q.segments.filter(s=>s.choice!==undefined).forEach(s=>{
        rows += bdRow(s.choice, s.text, q.breakdown[s.choice], s.choice===q.answer?"answer":"neutral", userAns===s.choice);
      });
    }
    const hint = q.type==="mc" ? "Şık şık açıklama" : "Bölüm bölüm açıklama (yeşil = seçilmesi gereken hatalı kısım)";
    return `<div class="breakdown"><div class="bd-title">${hint}</div>${rows}</div>`;
  }
  function bdRow(letter, text, why, kind, isUser){
    // kind: answer (yeşil/doğru cevap) · wrong (kırmızı) · neutral (gri, dokunma)
    const M = { answer:{c:"good",m:"✓"}, wrong:{c:"bad",m:"✗"}, neutral:{c:"neu",m:"•"} };
    const k = M[kind] || M.neutral;
    const ansTag = kind==="answer" ? `<span class="bd-tag ok">doğru cevap</span>` : "";
    const usrTag = isUser ? `<span class="bd-tag">senin cevabın</span>` : "";
    return `<div class="bd-row ${k.c}">
      <span class="bd-lett">${k.m} ${letter}</span>
      <div class="bd-body"><b>${esc(text)}</b>${ansTag}${usrTag}<div class="bd-why">${esc(why||"")}</div></div>
    </div>`;
  }

  function prevExam(){ if(Q.idx>0){ Q.idx--; paintQuestion(); } }

  function next(){
    Q.idx++;
    if (Q.idx < Q.questions.length) return paintQuestion();
    if (Q.mode==="exam") return finishExam();
    if (Q.mode==="diagnostic") return finishDiagnostic();
    if (Q.mode==="review") return finishReview();
    if (Q.mode==="vocabquiz") return finishVocab();
    if (Q.mode==="book") return finishBook();
    finishPractice();
  }

  // --- Sonuç ekranları ---------------------------------------------------
  function ringCard(pct, h2, sub){
    return `<div class="card result-card" style="--deg:${pct*3.6}deg">
      <div class="score-ring"><div class="inner">${pct}%</div></div>
      <h2>${h2}</h2><p>${sub}</p></div>`;
  }
  // Denemeyi backend'e kaydet (giriş yapılmışsa); döndürdüğü ilerlemeyle yereli güncelle.
  function recordAttempt(mode, skill, correct, total){
    const dur = Q.startedAt ? Math.round((Date.now()-Q.startedAt)/1000) : 0;
    if (API.authed()){
      API.saveAttempt({mode, skill: skill||null, correct, total, duration:dur})
         .then(r=>{ if(r&&r.progress) mergeServerProgress(r.progress); })
         .catch(()=>{});
    }
  }
  function mergeServerProgress(sp){
    if (sp.skills){ for(const k in sp.skills){ progress.skills[k]=Object.assign(progress.skills[k]||{}, sp.skills[k]); } }
    if (sp.examBest!=null) progress.examBest = Math.max(progress.examBest||0, sp.examBest);
    if (sp.weakSkills) progress.serverWeak = sp.weakSkills;
    if (sp.strongSkills) progress.serverStrong = sp.strongSkills;
    if (sp.byMode && sp.byMode.diagnostic) progress.diagnosticDone = true;
    save();
  }

  function finishPractice(){
    const n=Q.questions.length, pct=Math.round(Q.correct/n*100);
    setSkillScore(Q.skillId, pct);
    recordAttempt("practice", Q.skillId, Q.correct, n);
    const sk=CURRICULUM.skills[Q.skillId];
    const day=CURRICULUM.plan.find(d=>d.skills.includes(+Q.skillId)).day;
    const msg=pct>=90?"Mükemmel! 🏆":pct>=70?"Güzel iş, bu skill tamam ✅":"Bu konuyu tekrar gözden geçir 🔁";
    view().innerHTML = ringCard(pct,msg,`${sk.title} · ${Q.correct}/${n} doğru`) + `
      <div class="lesson-actions" style="justify-content:center;margin-top:18px">
        <button class="btn" onclick="App.go('quiz',${Q.skillId})">Tekrar dene</button>
        <button class="btn sec" onclick="App.go('day',${day})">Gün ${day}'e dön</button>
        <button class="btn sec" onclick="App.nextSkill(${Q.skillId})">Sonraki skill →</button>
      </div>`;
  }
  function nextSkill(id){
    const ids=Object.keys(CURRICULUM.skills).map(Number);
    const nx=ids.find(x=>x>id);
    if (nx) go("lesson",nx); else go("progress");
  }

  function finishReview(){
    const n=Q.questions.length, pct=Math.round(Q.correct/n*100);
    recordAttempt("review", null, Q.correct, n);
    const left=progress.wrong.length;
    view().innerHTML = ringCard(pct,"Tekrar turu bitti 🔁",`${Q.correct}/${n} doğru · havuzda ${left} soru kaldı`) + `
      <div class="lesson-actions" style="justify-content:center;margin-top:18px">
        ${left?`<button class="btn" onclick="App.go('review')">Kalanları çöz (${left})</button>`:`<p style="color:var(--good);font-weight:600">Havuz temizlendi! 🎉</p>`}
        <button class="btn sec" onclick="App.go('home')">Ana sayfa</button>
      </div>`;
  }
  function renderEmptyReview(){
    view().innerHTML = `<button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="card"><h2>🔁 Tekrar Havuzu</h2>
      <p class="empty">Havuz boş — henüz yanlış yapılmış soru yok. Quiz çözdükçe yanlışların buraya birikecek ve burada tekrar çözebileceksin.</p>
      <div class="lesson-actions" style="justify-content:center"><button class="btn" onclick="App.go('day',1)">Çalışmaya başla →</button></div></div>`;
  }

  // --- DIAGNOSTIC --------------------------------------------------------
  function renderDiagnosticIntro(){
    view().innerHTML = `
      <button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="card">
        <div class="cat">Başlangıç değerlendirmesi</div>
        <h2>🩺 Tanı Testi</h2>
        <div class="rule">
          <p>${DIAGNOSTIC.length} soruluk kısa bir karışık test. Amacı seni notlandırmak değil —
          <b>hangi becerilerde zayıf olduğunu</b> bulup sana öncelik listesi çıkarmak.</p>
          <p>Her sorudan sonra doğru cevabı ve açıklamayı göreceksin. Bilmiyorsan tahmin et, sorun değil.</p>
        </div>
        <div class="chart">📌 Bitince zayıf olduğun becerilere doğrudan giden bir liste alacaksın.</div>
        <div class="lesson-actions"><button class="btn" onclick="App.beginDiagnostic()">Teste başla →</button></div>
      </div>`;
  }
  // Tanı sonucundan KİŞİYE ÖZEL plan üret: zayıflar önce (kitap sırasında),
  // sonra kalan konular. Plan progress.plan'a yazılır.
  function buildPersonalPlan(weak){
    const all = Object.keys(CURRICULUM.skills).map(Number);
    const w = weak.slice().sort((a,b)=>a-b);
    const rest = all.filter(id=>!w.includes(id));
    return { order:[...w, ...rest], weak:w, createdAt:Date.now() };
  }
  function finishDiagnostic(){
    const n=Q.questions.length;
    const weak=Object.keys(Q.wrongSkills).map(Number).sort((a,b)=>a-b);
    progress.diagnostic={ score:Q.correct, total:n, weak };
    progress.diagnosticDone=true;
    progress.plan=buildPersonalPlan(weak);
    save();
    recordAttempt("diagnostic", null, Q.correct, n);
    const pct=Math.round(Q.correct/n*100);
    const lvl = pct>=80?"İyi seviyedesin 👏":pct>=50?"Orta seviyedesin 💪":"Temelden çalışmalısın 📚";
    let body;
    if(!weak.length){
      body=`<p style="color:var(--good);font-weight:600;text-align:center">Harika — belirgin bir zayıf konun yok! 🎉</p>
        <p class="cat" style="text-align:center">Yine de planı baştan sona geçmeni öneririm.</p>`;
    } else {
      const days = Math.ceil(weak.length/3);
      body=`<p class="cat" style="text-align:center">Sana özel çıkardığım plana göre önce şu <b>${weak.length}</b> konuya
        odaklan (yaklaşık <b>${days} gün</b>), sonra kalanları pekiştir:</p>
        <div class="weak-list">${weak.map((id,i)=>{
          const sk=CURRICULUM.skills[id];
          return `<div class="weak-item"><span><b>${i+1}.</b> Skill ${id} — ${esc(sk.title)}</span>
            <a href="#" onclick="App.go('lesson',${id});return false">Çalış →</a></div>`;
        }).join("")}</div>`;
    }
    view().innerHTML = ringCard(pct,"Tanı testi tamamlandı 🩺",`${Q.correct}/${n} doğru · ${lvl}`) + `
      <div class="section-title">🎯 Sana özel çalışma planın</div>${body}
      <div class="lesson-actions" style="margin-top:18px;justify-content:center">
        <button class="btn" onclick="App.go('${weak.length?'lesson':'home'}'${weak.length?','+weak[0]:''})">
          ${weak.length?'İlk konuyla başla':'Çalışmaya başla'} →</button>
        <button class="btn sec" onclick="App.go('home')">Planımı gör</button>
      </div>`;
  }

  // --- EXAM --------------------------------------------------------------
  function renderExamIntro(){
    view().innerHTML = `
      <button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="card">
        <div class="cat">Gerçek sınav simülasyonu</div>
        <h2>⏱️ Tam Deneme</h2>
        <div class="rule">
          <p>Gerçek TOEFL Structure bölümü gibi: <b>40 soru</b> (15 Structure + 25 Written Expression),
          <b>25 dakika</b>. Süre dolunca sınav otomatik biter.</p>
          <p>Sınav sırasında doğru/yanlış <b>gösterilmez</b>; sorular arasında ileri-geri gidebilir, cevabını değiştirebilirsin.
          Bitince tüm soruların çözümlü değerlendirmesini görürsün.</p>
        </div>
        <div class="chart">📌 İpucu: önce bildiklerini işaretle, emin olmadıklarına sonra dön. Boş bırakma — yanlışın ekstra cezası yok.</div>
        <div class="lesson-actions"><button class="btn" onclick="App.beginExam()">Sınavı başlat ▶</button></div>
      </div>`;
  }
  function confirmQuit(){
    if (confirm("Sınavdan çıkılsın mı? İlerlemen kaydedilmez.")){ go("home"); }
  }
  function finishExam(){
    if (examTimer){ clearInterval(examTimer); examTimer=null; }
    let correct=0;
    Q.questions.forEach((q,i)=>{
      const a=Q.answers[i];
      const ok=a!=null && isCorrect(q,a);
      if(ok) correct++; else addWrong(q);
    });
    const n=Q.questions.length, pct=Math.round(correct/n*100);
    progress.examBest = Math.max(progress.examBest||0, pct);
    progress.examLast = { correct, total:n, date:Date.now() }; save();
    Q.correct = correct;
    recordAttempt("exam", null, correct, n);

    const review = Q.questions.map((q,i)=>{
      const a=Q.answers[i];
      const ok=a!=null && isCorrect(q,a);
      const yours=answerLabel(q,a);
      const right=q.type==="mc"?LETTERS[q.answer]+") "+q.options[q.answer]
                               :q.answer+") doğrusu — "+(q.correction||"");
      const stem = q.type==="mc"
        ? esc(q.stem).replace(/___/g,"______")
        : q.segments.map(s=>s.plain!==undefined?esc(s.plain):"["+s.choice+":"+esc(s.text)+"]").join("");
      return `<div class="rev-item ${ok?'ok':'no'}">
        <div class="rev-q"><b>${i+1}.</b> ${stem}</div>
        <div class="rev-line">Senin cevabın: <span class="${ok?'g':'r'}">${esc(yours)}</span></div>
        ${ok?"":`<div class="rev-line">Doğru: <span class="g">${esc(right)}</span></div>`}
        <div class="rev-exp">${esc(q.explain||q.correction||"")}</div>
        ${breakdownHTML(q, a)}
      </div>`;
    }).join("");

    const msg = pct>=84?"Çok iyi! Hazırsın 🏆":pct>=68?"İyi yoldasın 💪":"Zayıf konulara dönme zamanı 🔁";
    view().innerHTML = ringCard(pct,msg,`${correct}/${n} doğru · 40 soruluk deneme`) + `
      <div class="lesson-actions" style="justify-content:center;margin:16px 0">
        <button class="btn" onclick="App.go('exam')">Yeni deneme</button>
        <button class="btn sec" onclick="App.go('review')">Yanlışları tekrar et (${progress.wrong.length})</button>
        <button class="btn sec" onclick="App.go('home')">Ana sayfa</button>
      </div>
      <div class="section-title">Çözümlü değerlendirme</div>
      <div class="review-list">${review}</div>`;
  }

  // --- PROGRESS ----------------------------------------------------------
  function renderProgress(){
    const cells = Object.keys(CURRICULUM.skills).map(id=>{
      const sk=CURRICULUM.skills[id]; const st=progress.skills[id]||{}; const v=st.best||0;
      const col=v>=70?"var(--good)":v>0?"var(--warn)":"var(--line)";
      return `<div class="prog-cell" onclick="App.go('lesson',${id})" style="cursor:pointer">
        <b>Skill ${id}</b><br><small>${esc(sk.title)}</small>
        <div class="bar"><i style="width:${v}%;background:${col}"></i></div>
        <small>${v?v+"% (en iyi)":"henüz çalışılmadı"}</small></div>`;
    }).join("");
    const done=doneCount(), total=totalSkills();
    view().innerHTML = `
      <button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="hero">
        <h1>İlerlemen 📊</h1>
        <p>${done}/${total} skill tamamlandı (70%+ = tamam) · Tekrar havuzu: ${progress.wrong.length} soru
          ${progress.examBest!=null?` · En iyi deneme: ${progress.examBest}%`:""}</p>
        <div class="day-prog" style="margin-top:14px"><i style="width:${Math.round(done/total*100)}%"></i></div>
      </div>
      <div class="section-title">Tüm beceriler</div>
      <div class="prog-grid">${cells}</div>`;
  }

  // --- AUTH (giriş / kayıt) — uygulamanın ilk ekranı ---------------------
  function renderAuth(mode){
    mode = mode || "login";
    const reg = mode==="register";
    view().innerHTML = `
      <div class="auth-wrap">
        <div class="card auth-card">
          <div class="auth-brand"><div class="auth-logo">📘</div>
            <h2>TOEFL Structure</h2>
            <p class="cat">${reg?"Hesap oluştur, tanı testiyle başla":"Hesabına giriş yap"}</p>
          </div>
          <div class="form">
            ${reg?`<div class="form-row">
              <label>Ad<input id="au-first" placeholder="Adın" autocomplete="given-name"></label>
              <label>Soyad<input id="au-last" placeholder="Soyadın" autocomplete="family-name"></label>
            </div>`:""}
            <label>E-posta<input id="au-email" type="email" placeholder="ornek@gmail.com" autocomplete="email"></label>
            <label>Şifre<input id="au-pass" type="password" placeholder="••••••"
              autocomplete="${reg?'new-password':'current-password'}"
              onkeydown="if(event.key==='Enter')App.submitAuth('${mode}')"></label>
            <div class="form-err" id="au-err"></div>
            <button class="btn" id="au-submit" onclick="App.submitAuth('${mode}')">${reg?"Kayıt ol ve başla →":"Giriş yap →"}</button>
            <div class="form-switch">
              ${reg?`Zaten hesabın var mı? <a href="#" onclick="App.go('auth','login');return false">Giriş yap</a>`
                   :`Hesabın yok mu? <a href="#" onclick="App.go('auth','register');return false">Kayıt ol</a>`}
            </div>
          </div>
        </div>
      </div>`;
  }
  // Yeni oturum (kayıt/giriş): yereldeki her şeyi sıfırla — herkes sıfırdan başlar.
  function resetLocalForNewSession(){
    localStorage.removeItem(STORE);
    localStorage.removeItem("toefl_vocab");
    progress = { skills:{}, wrong:[] };
  }
  // Tanı testi yapılmış mı? (yerel ya da sunucu)
  function diagnosticDone(){ return !!(progress.diagnostic || progress.diagnosticDone); }
  async function submitAuth(mode){
    const err=document.getElementById("au-err");
    const email=document.getElementById("au-email").value.trim();
    const pass=document.getElementById("au-pass").value;
    err.textContent="";
    if(!API.enabled()){ err.textContent="Sunucuya ulaşılamıyor. Birazdan tekrar dene."; return; }
    if(mode==="register"){
      const fn=document.getElementById("au-first").value.trim();
      const ln=document.getElementById("au-last").value.trim();
      if(!fn){ err.textContent="Ad gerekli."; return; }
      const btn=document.getElementById("au-submit"); btn.disabled=true; btn.textContent="...";
      try{ await API.register(fn,ln,email,pass); resetLocalForNewSession(); refreshAccountNav();
           document.body.classList.remove("locked");
           renderDiagnosticInternal(); }   // kayıt olur olmaz DİREKT tanı testi (sıfırdan)
      catch(e){ err.textContent=e.message||"Hata"; btn.disabled=false; btn.textContent="Kayıt ol"; }
    } else {
      const btn=document.getElementById("au-submit"); btn.disabled=true; btn.textContent="...";
      try{ await API.login(email,pass); resetLocalForNewSession(); await syncFromServer(); refreshAccountNav();
           document.body.classList.remove("locked");
           // Tanı testi yapılmadıysa önce onu yaptır, yoksa ana sayfa
           if(diagnosticDone()) go("home"); else renderDiagnosticInternal(); }
      catch(e){ err.textContent=e.message||"Hata"; btn.disabled=false; btn.textContent="Giriş yap"; }
    }
  }
  async function syncFromServer(){
    if(!API.authed()) return;
    try{ const r=await API.me(); if(r&&r.progress) mergeServerProgress(r.progress); }catch(_){}
  }
  // --- PROFİL (zengin) ---------------------------------------------------
  function renderAccount(){
    const u=API.user();
    if(!u){ return go("auth"); }
    const initials = ((u.firstName||u.name||"?").charAt(0)+(u.lastName||"").charAt(0)).toUpperCase();
    view().innerHTML = `
      <button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="card profile-head">
        <div class="avatar">${esc(initials)}</div>
        <div>
          <h2 style="margin:0">${esc(u.name)}</h2>
          <div class="cat">${esc(u.email)} ${u.isAdmin?'· <span class="badge-admin">Yönetici</span>':''}</div>
        </div>
        <button class="btn sec sm" style="margin-left:auto" onclick="App.doLogout()">Çıkış</button>
      </div>
      <div id="prof-body"><p class="empty">İlerleme yükleniyor…</p></div>`;
    loadProfile();
  }
  async function loadProfile(){
    let prog = progress;
    if(API.authed()){ try{ const r=await API.me(); if(r&&r.progress){ mergeServerProgress(r.progress); prog=r.progress; } }catch(_){} }
    const el=document.getElementById("prof-body"); if(!el) return;
    const total=totalSkills();
    const strong=(prog.strongSkills)||Object.entries(progress.skills).filter(([k,v])=>v.done).map(([k])=>+k);
    const weak=(prog.weakSkills)||Object.entries(progress.skills).filter(([k,v])=>v.best&&v.best<70).map(([k])=>+k);
    const done=strong.length;
    const examBest=prog.examBest!=null?prog.examBest:(progress.examBest!=null?progress.examBest:null);
    const vocabKnown=(JSON.parse(localStorage.getItem("toefl_vocab")||"{}").known||[]).length;
    const skillChip=id=>`<a class="chip" href="#" onclick="App.go('lesson',${id});return false">Skill ${id} · ${esc(CURRICULUM.skills[id].title)}</a>`;
    const hist=(prog.examHistory||[]).slice().reverse().slice(0,8).map(h=>{
      const d=new Date(h.date*1000||h.date); return `<div class="hist-row"><span>${h.correct}/${h.total} (${h.score}%)</span><small>${isNaN(d)?'':d.toLocaleDateString('tr-TR')}</small></div>`;
    }).join("") || `<p class="cat">Henüz tam deneme yok.</p>`;
    el.innerHTML = `
      <div class="hero-row" style="margin:0 0 18px">
        <div class="stat"><b>${done}/${total}</b><span>Tamamlanan beceri</span></div>
        <div class="stat"><b>${examBest!=null?examBest+"%":"—"}</b><span>En iyi deneme</span></div>
        <div class="stat"><b>${prog.completedExams||0}</b><span>Tam deneme</span></div>
        <div class="stat"><b>${prog.totalAttempts||0}</b><span>Toplam çözüm</span></div>
        <div class="stat"><b>${vocabKnown}</b><span>Bilinen kelime</span></div>
      </div>
      <div class="section-title">💪 Güçlü olduğun konular (${strong.length})</div>
      <div class="chips">${strong.length?strong.map(skillChip).join(""):'<span class="cat">Henüz tamamlanan konu yok.</span>'}</div>
      <div class="section-title">📌 Eksiklerin / tekrar etmen gerekenler (${weak.length})</div>
      <div class="chips">${weak.length?weak.map(skillChip).join(""):'<span class="cat">Belirgin eksik görünmüyor. 👏</span>'}</div>
      <div class="section-title">📝 Son deneme sonuçların</div>
      <div class="hist">${hist}</div>
      <div class="lesson-actions" style="margin-top:18px">
        <button class="btn" onclick="App.go('progress')">📊 Detaylı ilerleme</button>
        <button class="btn sec" onclick="App.go('review')">🔁 Tekrar havuzu (${progress.wrong.length})</button>
        ${API.user()&&API.user().isAdmin?`<button class="btn sec" onclick="App.go('admin')">🛠️ Admin paneli</button>`:''}
      </div>`;
  }
  async function doLogout(){ await API.logout(); go("home"); }

  // --- LEADERBOARD -------------------------------------------------------
  async function renderLeaderboard(){
    view().innerHTML = `<button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="hero"><h1>🏆 Lider Tablosu</h1><p>Diğer öğrencilerle kıyasla — en iyi deneme skoru ve tamamlanan beceriler.</p></div>
      <div id="lb-body"><p class="empty">Yükleniyor…</p></div>`;
    const set=h=>{ const el=document.getElementById("lb-body"); if(el) el.innerHTML=h; };
    if(!API.enabled()){ set(`<p class="empty">Lider tablosu için bir sunucuya bağlı olman gerekir. <a href="#" onclick="App.go('auth');return false">Giriş yap / sunucu ayarla</a></p>`); return; }
    try{
      const r=await API.leaderboard();
      const me=API.user();
      const rows=r.leaderboard.map((u,i)=>`
        <div class="lb-row ${me&&u.name===me.name?'self':''}">
          <span class="lb-rank">${i+1}</span>
          <span class="lb-name">${esc(u.name)}</span>
          <span class="lb-stat">${u.examBest!=null?u.examBest+"%":"—"}<small>deneme</small></span>
          <span class="lb-stat">${u.skillsDone}<small>beceri</small></span>
          <span class="lb-stat">${u.attempts}<small>çözüm</small></span>
        </div>`).join("") || `<p class="empty">Henüz kimse yok. İlk sen ol!</p>`;
      set(`<div class="lb-head"><span>#</span><span>İsim</span><span>En iyi</span><span>Beceri</span><span>Çözüm</span></div>${rows}`);
    }catch(e){ set(`<p class="empty">Yüklenemedi: ${esc(e.message)}</p>`); }
  }

  // --- Üst menü hesap + admin düğmesi (her render'da güncellenir) ---------
  function refreshAccountNav(){
    const el=document.getElementById("nav-account");
    const ad=document.getElementById("nav-admin");
    if(ad){ const u=API.user(); ad.innerHTML=(API.authed()&&u&&u.isAdmin)?`<button onclick="App.go('admin')">🛠️ Admin</button>`:""; }
    if(!el) return;
    if(API.authed()){ const u=API.user(); el.innerHTML=`<button onclick="App.go('account')">👤 ${esc((u&&u.firstName)||(u&&u.name)||"Hesap")}</button>`; }
    else { el.innerHTML=`<button onclick="App.go('auth')">Giriş / Kayıt</button>`; }
  }

  // --- ADMIN PANELİ ------------------------------------------------------
  async function renderAdmin(){
    if(!(API.authed()&&API.user()&&API.user().isAdmin)){ return go("home"); }
    view().innerHTML=`<button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="hero"><h1>🛠️ Admin Paneli</h1><p>Tüm üyeler, bilgileri ve gelişimleri.</p>
        <div class="hero-row" id="adm-stats"></div>
        <div class="lesson-actions"><button class="btn sec" onclick="App.go('adminsettings')">⚙️ AI / API Ayarları</button></div>
      </div>
      <div class="section-title">Üyeler</div>
      <div id="adm-users"><p class="empty">Yükleniyor…</p></div>`;
    try{
      const st=await API.adminStats();
      const s=document.getElementById("adm-stats");
      if(s) s.innerHTML=`
        <div class="stat"><b>${st.users}</b><span>Üye</span></div>
        <div class="stat"><b>${st.activeWeek}</b><span>Bu hafta aktif</span></div>
        <div class="stat"><b>${st.attempts}</b><span>Toplam çözüm</span></div>
        <div class="stat"><b>${st.exams}</b><span>Tam deneme</span></div>`;
      const r=await API.adminUsers();
      const body=document.getElementById("adm-users"); if(!body) return;
      const rows=r.users.map(u=>`
        <div class="adm-row" onclick="App.go('adminuser',${u.id})">
          <div class="adm-main"><b>${esc(u.name||"—")}</b>${u.isAdmin?' <span class="badge-admin">admin</span>':''}
            <small>${esc(u.email)}</small></div>
          <span class="adm-stat">${u.examBest!=null?u.examBest+"%":"—"}<small>deneme</small></span>
          <span class="adm-stat">${u.skillsDone}<small>beceri</small></span>
          <span class="adm-stat">${u.attempts}<small>çözüm</small></span>
          <span class="adm-stat">${fmtAgo(u.lastSeen)}<small>son</small></span>
        </div>`).join("") || `<p class="empty">Henüz üye yok.</p>`;
      body.innerHTML=`<div class="adm-head"><span>Üye</span><span>Deneme</span><span>Beceri</span><span>Çözüm</span><span>Son</span></div>${rows}`;
    }catch(e){ const b=document.getElementById("adm-users"); if(b) b.innerHTML=`<p class="empty">Yüklenemedi: ${esc(e.message)}</p>`; }
  }
  function fmtAgo(ts){ if(!ts) return "—"; const d=(Date.now()/1000-ts); if(d<60)return "az önce"; if(d<3600)return Math.round(d/60)+"dk"; if(d<86400)return Math.round(d/3600)+"sa"; return Math.round(d/86400)+"g"; }
  function fmtDate(ts){ if(!ts) return "—"; const d=new Date(ts*1000); return isNaN(d)?"—":d.toLocaleString("tr-TR"); }
  function fmtDur(secs){ if(!secs) return "0 dk"; const m=Math.round(secs/60); if(m<60) return m+" dk"; return Math.floor(m/60)+" sa "+(m%60)+" dk"; }
  const MODE_TR={practice:"Konu quizi",exam:"Tam deneme",diagnostic:"Tanı testi",review:"Tekrar",vocab:"Kelime",book:"Kitap"};
  function modeTr(m){ return MODE_TR[m]||m; }

  async function renderAdminUser(id){
    if(!(API.authed()&&API.user()&&API.user().isAdmin)){ return go("home"); }
    view().innerHTML=`<button class="back" onclick="App.go('admin')">← Admin paneli</button><div id="adu"><p class="empty">Yükleniyor…</p></div>`;
    try{
      const d=await API.adminUserDetail(id);
      const p=d.progress, u=d.user;
      const strong=(p.strongSkills||[]).map(s=>"Skill "+s).join(", ")||"—";
      const weak=(p.weakSkills||[]).map(s=>"Skill "+s).join(", ")||"—";
      const byMode=(d.byMode||[]).map(m=>`<div class="hist-row"><span>${esc(modeTr(m.mode))} · ${m.count} kez · ort. %${m.avgScore}</span><small>${fmtDur(m.seconds)}</small></div>`).join("")||`<p class="cat">—</p>`;
      const attempts=d.attempts.slice(0,40).map(a=>`<div class="hist-row"><span>${esc(modeTr(a.mode))}${a.skill?(" · skill "+a.skill):""} — ${a.correct}/${a.total} (%${a.score})</span><small>${fmtDur(a.duration)} · ${fmtDate(a.created)}</small></div>`).join("")||`<p class="cat">Çözüm yok.</p>`;
      const events=d.events.slice(0,40).map(e=>`<div class="hist-row"><span>${esc(modeTr(e.type))}</span><small>${fmtDate(e.created)}</small></div>`).join("")||`<p class="cat">Log yok.</p>`;
      const el=document.getElementById("adu"); if(!el) return;
      el.innerHTML=`
        <div class="card profile-head">
          <div class="avatar">${esc(((u.firstName||"?").charAt(0)+(u.lastName||"").charAt(0)).toUpperCase())}</div>
          <div style="flex:1"><h2 style="margin:0" id="adu-name">${esc(u.name)}</h2><div class="cat">${esc(u.email)} ${u.isAdmin?'· <span class="badge-admin">admin</span>':''}</div>
          <div class="cat">Kayıt: ${fmtDate(d.created)} · Son görülme: ${fmtAgo(d.lastSeen)}</div></div>
        </div>
        <div class="section-title">✏️ İsmi düzenle</div>
        <div class="form-row">
          <input id="adu-first" placeholder="Ad" value="${esc(u.firstName||"")}">
          <input id="adu-last" placeholder="Soyad" value="${esc(u.lastName||"")}">
          <button class="btn sm" onclick="App.adminEditName(${u.id})">Kaydet</button>
        </div>
        <div class="form-err" id="adu-msg"></div>
        <div class="hero-row" style="margin:14px 0">
          <div class="stat"><b>${(p.strongSkills||[]).length}</b><span>Beceri</span></div>
          <div class="stat"><b>${p.examBest!=null?p.examBest+"%":"—"}</b><span>En iyi deneme</span></div>
          <div class="stat"><b>${p.completedExams||0}</b><span>Deneme</span></div>
          <div class="stat"><b>${d.totalAttempts||0}</b><span>Çözüm</span></div>
          <div class="stat"><b>${fmtDur(d.totalSeconds)}</b><span>Toplam süre</span></div>
        </div>
        <div class="section-title">⏱️ Mod bazında (süre)</div><div class="hist">${byMode}</div>
        <div class="section-title">💪 Güçlü</div><p>${esc(strong)}</p>
        <div class="section-title">📌 Eksik</div><p>${esc(weak)}</p>
        <div class="section-title">📝 Tüm çözümler (süre + tarih)</div><div class="hist">${attempts}</div>
        <div class="section-title">🧾 Etkinlik logları</div><div class="hist">${events}</div>
        <div class="lesson-actions" style="margin-top:18px">
          <button class="btn sec danger" onclick="App.adminDelete(${u.id})">🗑️ Kullanıcıyı sil</button>
        </div>`;
    }catch(e){ const el=document.getElementById("adu"); if(el) el.innerHTML=`<p class="empty">Yüklenemedi: ${esc(e.message)}</p>`; }
  }
  async function adminEditName(id){
    const fn=document.getElementById("adu-first").value.trim();
    const ln=document.getElementById("adu-last").value.trim();
    const msg=document.getElementById("adu-msg");
    try{ const r=await API.adminEditUser(id,fn,ln); msg.style.color="var(--good)"; msg.textContent="✓ Kaydedildi: "+r.name;
         const h=document.getElementById("adu-name"); if(h)h.textContent=r.name; }
    catch(e){ msg.style.color="var(--bad)"; msg.textContent=e.message; }
  }
  async function adminDelete(id){
    if(!confirm("Bu kullanıcı ve tüm verileri silinsin mi?")) return;
    try{ await API.adminDeleteUser(id); go("admin"); }catch(e){ alert(e.message); }
  }

  // Admin AI / API ayarları — API anahtarı BURADAN girilir
  async function renderAdminSettings(){
    if(!(API.authed()&&API.user()&&API.user().isAdmin)){ return go("home"); }
    view().innerHTML=`<button class="back" onclick="App.go('admin')">← Admin paneli</button>
      <div class="card auth-card">
        <h2>⚙️ AI / API Ayarları</h2>
        <p class="cat" id="set-status">Yükleniyor…</p>
        <div class="form">
          <label>Groq API Anahtarı
            <input id="set-key" type="password" placeholder="gsk_... (console.groq.com)" autocomplete="off"></label>
          <label>Model
            <input id="set-model" placeholder="llama-3.3-70b-versatile"></label>
          <div class="form-err" id="set-err"></div>
          <button class="btn" onclick="App.saveAiSettings()">Kaydet</button>
          <p class="cat">Anahtar sunucuda güvenle saklanır, kullanıcılara gösterilmez. Kaydedince
          quizlerdeki "🤖 AI ile açıkla" butonu çalışır. Anahtar al: console.groq.com → API Keys.</p>
        </div>
      </div>`;
    try{
      const s=await API.adminGetSettings();
      const st=document.getElementById("set-status"); if(st) st.innerHTML = s.aiKeySet?'<span class="online-dot ok"></span> API anahtarı tanımlı':'<span class="online-dot no"></span> API anahtarı yok';
      const m=document.getElementById("set-model"); if(m) m.value=s.aiModel||"";
    }catch(e){ const st=document.getElementById("set-status"); if(st) st.textContent=e.message; }
  }
  async function saveAiSettings(){
    const key=document.getElementById("set-key").value.trim();
    const model=document.getElementById("set-model").value.trim();
    const err=document.getElementById("set-err"); err.textContent="";
    try{ await API.adminSaveSettings(key||null, model||null); err.style.color="var(--good)"; err.textContent="✓ Kaydedildi"; await API.health(); }
    catch(e){ err.style.color="var(--bad)"; err.textContent=e.message; }
  }

  // --- KİTAP SORULARI ----------------------------------------------------
  const HAS_BOOK = (typeof BOOK !== "undefined");
  function renderBookIntro(){
    const n = HAS_BOOK ? BOOK.questions.length : 0;
    view().innerHTML = `<button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="hero"><h1>📕 Kitap Soruları</h1>
        <p>${esc(HAS_BOOK?BOOK.source:"")} — kitaptan birebir ${n} soru (Structure + Written Expression).</p>
        <div class="lesson-actions">
          <button class="btn" onclick="App.go('bookquiz')">Kitap testine başla (${n} soru) →</button>
        </div></div>
      <div class="card"><p class="cat">Bu bölümde kitabın gerçek pre-test soruları var. Çözdükçe yanlışların
      tekrar havuzuna eklenir. Ayrıca "Tam Deneme" ve konu quizlerinde <b>sınırsız üretilen taze sorular</b> da devam ediyor.</p></div>`;
  }
  function startBookQuiz(){
    if(!HAS_BOOK){ return go("home"); }
    Q={ mode:"book", questions:BOOK.questions.map(q=>Object.assign({},q,{_id:"b"+Math.random().toString(36).slice(2)})),
        idx:0, correct:0, answers:[], startedAt:Date.now() };
    API.logEvent("start_book",{});
    paintQuestion();
  }
  function finishBook(){
    const n=Q.questions.length, pct=Math.round(Q.correct/n*100);
    recordAttempt("book", null, Q.correct, n);
    const msg=pct>=80?"Kitabı iyi sindirmişsin! 🏆":pct>=50?"Güzel, tekrar edebilirsin 💪":"Konulara dönüp pekiştir 📚";
    view().innerHTML=ringCard(pct,msg,`${Q.correct}/${n} doğru · ${esc(BOOK.title)}`)+`
      <div class="lesson-actions" style="justify-content:center;margin-top:18px">
        <button class="btn" onclick="App.go('bookquiz')">Tekrar çöz</button>
        <button class="btn sec" onclick="App.go('review')">🔁 Yanlışları tekrar et (${progress.wrong.length})</button>
        <button class="btn sec" onclick="App.go('home')">Ana sayfa</button></div>`;
  }

  // --- KELİME ÇALIŞMASI --------------------------------------------------
  const HAS_VOCAB = (typeof VOCAB !== "undefined");
  function loadVocab(){ try{ return JSON.parse(localStorage.getItem("toefl_vocab"))||{known:[]}; }catch{ return {known:[]}; } }
  function saveVocabState(v){ localStorage.setItem("toefl_vocab", JSON.stringify(v)); }
  function markKnown(word, known){ const v=loadVocab(); const s=new Set(v.known); known?s.add(word):s.delete(word); v.known=[...s]; saveVocabState(v); }

  function renderVocabIntro(){
    const known=loadVocab().known.length;
    const total=HAS_VOCAB?VOCAB.length:0;
    view().innerHTML=`<button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="hero"><h1>📚 Kelime Çalışması</h1>
        <p>TOEFL'da sık çıkan ${total} akademik kelime. Kartlarla öğren, quizle pekiştir.</p>
        <div class="hero-row">
          <div class="stat"><b>${known}/${total}</b><span>Bilinen kelime</span></div>
          <div class="stat"><b>${Math.round(known/Math.max(total,1)*100)}%</b><span>İlerleme</span></div>
        </div>
        <div class="lesson-actions">
          <button class="btn" onclick="App.go('vocabflash')">🃏 Kartlarla öğren</button>
          <button class="btn sec" onclick="App.go('vocabquiz')">📝 Kelime quizi (10 soru)</button>
        </div>
      </div>`;
  }

  // Flashcards
  let VF=null;
  function startVocabFlash(){ VF={ list:shuffle(VOCAB.slice()), idx:0, revealed:false, learned:0 }; paintFlash(); }
  function paintFlash(){
    if(VF.idx>=VF.list.length){
      view().innerHTML=ringCard(100,"Kart turu bitti 🃏",`${VF.list.length} kelime gözden geçirildi`)+`
        <div class="lesson-actions" style="justify-content:center;margin-top:18px">
          <button class="btn" onclick="App.go('vocabflash')">Yeniden karıştır</button>
          <button class="btn sec" onclick="App.go('vocabquiz')">Quize geç</button>
          <button class="btn sec" onclick="App.go('vocab')">Kelime ana sayfa</button></div>`;
      return;
    }
    const w=VF.list[VF.idx]; const known=loadVocab().known.includes(w.w);
    view().innerHTML=`<button class="back" onclick="App.go('vocab')">← Kelime</button>
      <div class="card flash" onclick="App.flashReveal()">
        <div class="flash-top"><span class="qcount">${VF.idx+1} / ${VF.list.length}</span>
          ${known?'<span class="pill struct">biliyorum</span>':''}</div>
        <div class="flash-word">${esc(w.w)}</div>
        <div class="flash-pos">${esc(w.pos)}</div>
        ${VF.revealed?`<div class="flash-mean">${esc(w.tr)}</div><div class="flash-ex">“${esc(w.ex)}”</div>`
                     :`<div class="flash-hint">Anlamı görmek için karta dokun</div>`}
      </div>
      <div class="lesson-actions" style="justify-content:center">
        ${VF.revealed?`<button class="btn good-btn" onclick="App.flashNext(true)">✓ Biliyorum</button>
          <button class="btn sec" onclick="App.flashNext(false)">↻ Tekrar göster</button>`
         :`<button class="btn" onclick="App.flashReveal()">Anlamı göster</button>`}
      </div>`;
  }
  function flashReveal(){ VF.revealed=true; paintFlash(); }
  function flashNext(known){ const w=VF.list[VF.idx]; markKnown(w.w, known); VF.idx++; VF.revealed=false; paintFlash(); }

  // Kelime quizi (quiz motorunu kullanır)
  function vocabQuestion(){
    const w=rnd(VOCAB);
    const others=shuffle(VOCAB.filter(x=>x.w!==w.w)).slice(0,3);
    const opts=shuffle([{t:w.tr,ok:true,why:`Doğru. Örnek: ${w.ex}`},
      ...others.map(o=>({t:o.tr,ok:false,why:`Bu '${o.w}' kelimesinin anlamı.`}))]);
    return { type:"mc", _id:"v"+Math.random().toString(36).slice(2), _skill:undefined,
      stem:`"${w.w}" (${w.pos}) ne demek?`,
      options:opts.map(o=>o.t), answer:opts.findIndex(o=>o.ok),
      breakdown:opts.map(o=>o.why),
      explain:`${w.w} = ${w.tr}. Örnek: ${w.ex}` };
  }
  function startVocabQuiz(){
    const seen=new Set(); const qs=[]; let g=0;
    while(qs.length<10 && g<200){ const q=vocabQuestion(); g++; if(seen.has(q.stem))continue; seen.add(q.stem); qs.push(q); }
    Q={ mode:"vocabquiz", questions:qs, idx:0, correct:0, answers:[], startedAt:Date.now() };
    API.logEvent("start_vocab",{});
    paintQuestion();
  }
  function finishVocab(){
    const n=Q.questions.length, pct=Math.round(Q.correct/n*100);
    recordAttempt("vocab", null, Q.correct, n);
    const msg=pct>=80?"Harika kelime bilgisi! 🏆":pct>=50?"Fena değil, çalışmaya devam 💪":"Kartlarla biraz daha çalış 🃏";
    view().innerHTML=ringCard(pct,msg,`${Q.correct}/${n} doğru`)+`
      <div class="lesson-actions" style="justify-content:center;margin-top:18px">
        <button class="btn" onclick="App.go('vocabquiz')">Yeni quiz</button>
        <button class="btn sec" onclick="App.go('vocabflash')">🃏 Kartlar</button>
        <button class="btn sec" onclick="App.go('vocab')">Kelime ana sayfa</button></div>`;
  }

  // --- RESET -------------------------------------------------------------
  function resetProgress(){
    if (confirm("Tüm yerel ilerlemen silinecek. Emin misin?")){
      localStorage.removeItem(STORE);
      progress = { skills:{}, wrong:[] };
      go("home");
    }
  }

  // --- BOOT --------------------------------------------------------------
  // Giriş kapısı: backend varsa ve giriş yapılmadıysa uygulamaya girilemez.
  function gateLocked(){ return API.enabled() && !API.authed(); }
  async function boot(){
    if (API.enabled()){
      await API.health();
      if (API.authed()) await syncFromServer();
    }
    go("home"); // kilitliyse sarmalayıcı otomatik auth'a yönlendirir
  }
  document.addEventListener("DOMContentLoaded", boot);

  // Sarmalayıcı: kapı kilitliyse her yolu giriş ekranına çevir + menü/hesap tazele
  const _go = go;
  go = function(r,a){
    if (gateLocked() && r!=="auth"){ r="auth"; a=a||"login"; }
    _go(r,a);
    refreshAccountNav();
    document.body.classList.toggle("locked", gateLocked());
    const nav=document.querySelector(".topnav"); if(nav) nav.classList.remove("open");
  };

  return { go:(r,a)=>go(r,a), answerMC, answerErr, next, prevExam, nextSkill, resetProgress,
           beginDiagnostic:renderDiagnosticInternal, beginExam:startExam, confirmQuit,
           submitAuth, doLogout, aiExplain,
           flashReveal, flashNext, adminDelete, saveAiSettings, adminEditName };
})();
