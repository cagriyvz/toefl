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
  if (!progress.wrong)  progress.wrong  = [];   // yanlış yapılan soru id'leri

  // --- Soru indeksi (id -> soru) ----------------------------------------
  const QINDEX = {};
  for (const [id, sk] of Object.entries(CURRICULUM.skills)) {
    sk.questions.forEach((q, i) => {
      QINDEX["s"+id+"_"+i] = Object.assign({}, q, { _id:"s"+id+"_"+i, _skill:+id });
    });
  }
  DIAGNOSTIC.forEach((q, i) => {
    QINDEX["d"+i] = Object.assign({}, q, { _id:"d"+i, _skill:q.skill });
  });

  function skillQuestions(id){
    return CURRICULUM.skills[id].questions.map((q,i)=>QINDEX["s"+id+"_"+i]);
  }
  function diagnosticQuestions(){ return DIAGNOSTIC.map((q,i)=>QINDEX["d"+i]); }

  function setSkillScore(id, pct) {
    const s = progress.skills[id] || {};
    s.best = Math.max(s.best || 0, pct);
    if (pct >= 70) s.done = true;
    progress.skills[id] = s; save();
  }
  function addWrong(id){ if(id && !progress.wrong.includes(id)){ progress.wrong.push(id); save(); } }
  function removeWrong(id){ const i=progress.wrong.indexOf(id); if(i>=0){ progress.wrong.splice(i,1); save(); } }

  // --- Yardımcılar -------------------------------------------------------
  function esc(s){ return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
  const LETTERS = ["A","B","C","D"];
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
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
  }

  // --- HOME --------------------------------------------------------------
  function renderHome(){
    const done = doneCount(), total = totalSkills();
    const overall = Math.round(done/total*100);
    const diag = progress.diagnostic;
    const wrongN = progress.wrong.length;

    const days = CURRICULUM.plan.map(d=>{
      const dp = dayProgress(d.day);
      const tags = d.skills.map(s=>`<span class="tag">Skill ${s}</span>`).join("");
      return `<div class="day-card" onclick="App.go('day',${d.day})">
        <div class="day-num">Gün ${d.day}</div>
        <h3>${esc(d.title)}</h3>
        <div class="focus">${esc(d.focus)}</div>
        <div class="skill-tags">${tags}</div>
        <div class="day-prog"><i style="width:${dp.pct}%"></i></div>
        <div class="day-prog-label">${dp.done}/${dp.total} skill tamamlandı</div>
      </div>`;
    }).join("");

    view().innerHTML = `
      <section class="hero">
        <h1>Bir haftada TOEFL Structure 🎯</h1>
        <p>25 dilbilgisi becerisi, 7 güne bölünmüş. Her gün: kuralları oku, mini quizlerle pekiştir.</p>
        <div class="hero-row">
          <div class="stat"><b>${done}/${total}</b><span>Skill tamamlandı</span></div>
          <div class="stat"><b>${overall}%</b><span>Genel ilerleme</span></div>
          <div class="stat"><b>${diag ? diag.score+"/"+diag.total : "—"}</b><span>Tanı testi</span></div>
          <div class="stat"><b>${progress.examBest!=null?progress.examBest+"%":"—"}</b><span>En iyi deneme</span></div>
        </div>
        <div class="lesson-actions">
          ${diag ? "" : `<button class="btn" onclick="App.go('diagnostic')">🩺 Tanı testiyle başla</button>`}
          <button class="btn ${diag?'':'sec'}" onclick="App.go('day',1)">${done?'Kaldığın yerden devam':'Gün 1 ile başla'} →</button>
          <button class="btn sec" onclick="App.go('exam')">⏱️ Tam Deneme (25 dk)</button>
          ${wrongN?`<button class="btn sec" onclick="App.go('review')">🔁 Tekrar Havuzu (${wrongN})</button>`:""}
        </div>
      </section>
      <div class="section-title">7 Günlük Plan</div>
      <div class="days">${days}</div>`;
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
          <button class="btn" onclick="App.go('quiz',${id})">Quiz'e başla (${sk.questions.length} soru) →</button>
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

  function startQuiz(skillId){
    Q = { mode:"practice", skillId, questions:skillQuestions(skillId),
          idx:0, correct:0, answers:[] };
    paintQuestion();
  }
  function renderDiagnosticInternal(){
    Q = { mode:"diagnostic", questions:diagnosticQuestions(),
          idx:0, correct:0, answers:[], wrongSkills:{} };
    paintQuestion();
  }
  function startReview(){
    const qs = progress.wrong.map(id=>QINDEX[id]).filter(Boolean);
    if (!qs.length){ return renderEmptyReview(); }
    Q = { mode:"review", questions:shuffle(qs.slice()), idx:0, correct:0, answers:[] };
    paintQuestion();
  }
  function startExam(){
    const mc=[], err=[];
    for (const id of Object.keys(CURRICULUM.skills))
      skillQuestions(id).forEach(q=> (q.type==="mc"?mc:err).push(q));
    shuffle(mc); shuffle(err);
    const questions = [...mc.slice(0,15), ...err.slice(0,25)]; // 15 Structure + 25 Written
    Q = { mode:"exam", questions, idx:0, correct:0, answers:new Array(questions.length).fill(null),
          examEnd: Date.now() + 25*60*1000 };
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
                     exam:"Tam Deneme", review:"Tekrar Havuzu" };
    const body = q.type==="mc" ? mcMarkup(q, exam) : errMarkup(q, exam);

    const backTargets = {
      practice:`App.go('lesson',${Q.skillId})`, diagnostic:"App.go('home')",
      exam:"App.confirmQuit()", review:"App.go('home')"
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

    if (ok){ Q.correct++; if (Q.mode==="review") removeWrong(q._id); }
    else { addWrong(q._id); if (Q.mode==="diagnostic" && q._skill) Q.wrongSkills[q._skill]=true; }

    const detail = q.explain || q.correction || "";
    const fb = document.getElementById("fb");
    fb.className = "feedback show " + (ok?"ok":"no");
    fb.innerHTML = `<span class="res ${ok?'ok':'no'}">${ok?'✓ Doğru':'✗ Yanlış'}</span>
      <b>${ok?'Açıklama':'Doğru cevap & açıklama'}</b>${esc(detail)}`;
    document.getElementById("nextBtn").style.display = "inline-block";
  }

  function prevExam(){ if(Q.idx>0){ Q.idx--; paintQuestion(); } }

  function next(){
    Q.idx++;
    if (Q.idx < Q.questions.length) return paintQuestion();
    if (Q.mode==="exam") return finishExam();
    if (Q.mode==="diagnostic") return finishDiagnostic();
    if (Q.mode==="review") return finishReview();
    finishPractice();
  }

  // --- Sonuç ekranları ---------------------------------------------------
  function ringCard(pct, h2, sub){
    return `<div class="card result-card" style="--deg:${pct*3.6}deg">
      <div class="score-ring"><div class="inner">${pct}%</div></div>
      <h2>${h2}</h2><p>${sub}</p></div>`;
  }

  function finishPractice(){
    const n=Q.questions.length, pct=Math.round(Q.correct/n*100);
    setSkillScore(Q.skillId, pct);
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
  function finishDiagnostic(){
    const n=Q.questions.length;
    const weak=Object.keys(Q.wrongSkills).map(Number).sort((a,b)=>a-b);
    progress.diagnostic={ score:Q.correct, total:n, weak }; save();
    const pct=Math.round(Q.correct/n*100);
    let weakHtml;
    if(!weak.length){
      weakHtml=`<p style="color:var(--good);font-weight:600">Harika — belirgin bir zayıf konun yok! 🎉 Yine de planı baştan sona geçmeni öneririm.</p>`;
    } else {
      weakHtml=`<div class="weak-list">${weak.map(id=>{
        const sk=CURRICULUM.skills[id];
        return `<div class="weak-item"><span>Skill ${id} — ${esc(sk.title)}</span>
          <a href="#" onclick="App.go('lesson',${id});return false">Çalış →</a></div>`;
      }).join("")}</div>`;
    }
    view().innerHTML = ringCard(pct,"Tanı testi tamamlandı",`${Q.correct}/${n} doğru`) + `
      <div class="section-title">Öncelik vermen gereken konular</div>${weakHtml}
      <div class="lesson-actions" style="margin-top:18px">
        <button class="btn" onclick="App.go('${weak.length?'lesson':'day'}',${weak.length?weak[0]:1})">
          ${weak.length?'İlk zayıf konuyla başla':'Gün 1 ile başla'} →</button>
        <button class="btn sec" onclick="App.go('home')">Plana dön</button>
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
      if(ok) correct++; else addWrong(q._id);
    });
    const n=Q.questions.length, pct=Math.round(correct/n*100);
    progress.examBest = Math.max(progress.examBest||0, pct);
    progress.examLast = { correct, total:n, date:Date.now() }; save();

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

  // --- RESET -------------------------------------------------------------
  function resetProgress(){
    if (confirm("Tüm ilerlemen silinecek. Emin misin?")){
      localStorage.removeItem(STORE);
      progress = { skills:{}, wrong:[] };
      go("home");
    }
  }

  document.addEventListener("DOMContentLoaded", ()=>go("home"));

  return { go, answerMC, answerErr, next, prevExam, nextSkill, resetProgress,
           beginDiagnostic:renderDiagnosticInternal, beginExam:startExam, confirmQuit };
})();
