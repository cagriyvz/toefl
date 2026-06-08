/* ==========================================================================
   TOEFL Structure — uygulama mantığı (router + dersler + quiz + ilerleme)
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
  function save(p) { localStorage.setItem(STORE, JSON.stringify(p)); }
  let progress = load();
  // şekil: { skills: { 1:{best:80, done:true}, ... }, diagnostic:{score, total, weak:[]} }
  if (!progress.skills) progress.skills = {};

  function setSkillScore(id, pct) {
    const s = progress.skills[id] || {};
    s.best = Math.max(s.best || 0, pct);
    if (pct >= 70) s.done = true;
    progress.skills[id] = s;
    save(progress);
  }

  // --- Yardımcılar -------------------------------------------------------
  function esc(s){ return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
  const LETTERS = ["A","B","C","D"];

  function totalSkills(){ return Object.keys(CURRICULUM.skills).length; }
  function doneCount(){ return Object.values(progress.skills).filter(s=>s.done).length; }

  function dayProgress(day){
    const ids = CURRICULUM.plan.find(d=>d.day===day).skills;
    const done = ids.filter(id=>progress.skills[id]?.done).length;
    return { done, total: ids.length, pct: Math.round(done/ids.length*100) };
  }

  // --- Router ------------------------------------------------------------
  function go(route, arg){
    window.scrollTo(0,0);
    if (route==="home") return renderHome();
    if (route==="day") return renderDay(arg);
    if (route==="lesson") return renderLesson(arg);
    if (route==="quiz") return renderQuiz(arg);
    if (route==="diagnostic") return renderDiagnosticIntro();
    if (route==="progress") return renderProgress();
  }

  // --- HOME --------------------------------------------------------------
  function renderHome(){
    const done = doneCount(), total = totalSkills();
    const overall = Math.round(done/total*100);
    const diag = progress.diagnostic;

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
        </div>
        <div class="lesson-actions">
          ${diag ? "" : `<button class="btn" onclick="App.go('diagnostic')">🩺 Tanı testiyle başla</button>`}
          <button class="btn ${diag?'':'sec'}" onclick="App.go('day',1)">${done?'Kaldığın yerden devam':'Gün 1 ile başla'} →</button>
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
          <button class="btn" onclick="App.go('quiz',{skill:${id}})">Quiz'e başla (${sk.questions.length} soru) →</button>
          <button class="btn sec" onclick="App.go('day',${day})">Sonra</button>
        </div>
      </div>`;
  }

  // --- QUIZ MOTORU -------------------------------------------------------
  // cfg: {skill:id}  veya  {diagnostic:true}
  let Q = null;
  function renderQuiz(cfg){
    const isDiag = !!cfg.diagnostic;
    const questions = isDiag ? DIAGNOSTIC : CURRICULUM.skills[cfg.skill].questions;
    Q = { cfg, isDiag, questions, idx:0, correct:0, answered:false, wrongSkills:{} };
    paintQuestion();
  }

  function paintQuestion(){
    const q = Q.questions[Q.idx];
    const n = Q.questions.length;
    const pct = Math.round(Q.idx/n*100);
    const title = Q.isDiag ? "Tanı Testi" : "Skill "+Q.cfg.skill;

    let body;
    if (q.type==="mc") body = mcMarkup(q);
    else body = errMarkup(q);

    const backBtn = Q.isDiag
      ? `<button class="back" onclick="App.go('home')">← Çık</button>`
      : `<button class="back" onclick="App.go('lesson',${Q.cfg.skill})">← Derse dön</button>`;

    view().innerHTML = `
      ${backBtn}
      <div class="card">
        <div class="quiz-head">
          <span class="qcount">${esc(title)}</span>
          <div class="qprog"><i style="width:${pct}%"></i></div>
          <span class="qcount">${Q.idx+1} / ${n}</span>
        </div>
        ${body}
        <div class="feedback" id="fb"></div>
        <div class="quiz-foot">
          <button class="btn" id="nextBtn" style="display:none" onclick="App.next()">
            ${Q.idx+1===n ? "Sonuçları gör" : "Sonraki soru"} →
          </button>
        </div>
      </div>`;
    Q.answered = false;
  }

  function mcMarkup(q){
    const stem = esc(q.stem).replace(/___/g,'<span class="blank">______</span>');
    const opts = q.options.map((o,i)=>`
      <button class="opt" data-i="${i}" onclick="App.answerMC(${i})">
        <span class="lett">${LETTERS[i]}</span><span>${esc(o)}</span>
      </button>`).join("");
    return `<div class="question">${stem}</div><div class="options">${opts}</div>`;
  }

  function errMarkup(q){
    const html = q.segments.map(seg=>{
      if (seg.plain!==undefined) return esc(seg.plain);
      return `<span class="uw" data-c="${seg.choice}" onclick="App.answerErr('${seg.choice}')">
        <span class="lbl">${seg.choice}</span>${esc(seg.text)}</span>`;
    }).join("");
    return `<div class="hint">Hatalı olan <b>altı çizili</b> bölümü seç:</div>
            <div class="err-sentence">${html}</div>`;
  }

  function answerMC(i){
    if (Q.answered) return;
    Q.answered = true;
    const q = Q.questions[Q.idx];
    const ok = i===q.answer;
    document.querySelectorAll(".opt").forEach(b=>{
      const bi = +b.dataset.i; b.disabled = true;
      if (bi===q.answer) b.classList.add("correct");
      else if (bi===i) b.classList.add("wrong");
    });
    finishQuestion(ok, q);
  }

  function answerErr(choice){
    if (Q.answered) return;
    Q.answered = true;
    const q = Q.questions[Q.idx];
    const ok = choice===q.answer;
    document.querySelectorAll(".uw").forEach(el=>{
      el.classList.add("locked");
      const c = el.dataset.c;
      if (c===q.answer) el.classList.add("correct");
      else if (c===choice) el.classList.add("wrong");
    });
    finishQuestion(ok, q);
  }

  function finishQuestion(ok, q){
    if (ok) Q.correct++;
    else if (Q.isDiag && q.skill) Q.wrongSkills[q.skill] = true;
    const fb = document.getElementById("fb");
    const detail = q.explain || q.correction || "";
    fb.className = "feedback show " + (ok?"ok":"no");
    fb.innerHTML = `<span class="res ${ok?'ok':'no'}">${ok?'✓ Doğru':'✗ Yanlış'}</span>
      <b>${ok?'Açıklama':'Doğru cevap & açıklama'}</b>${esc(detail)}`;
    document.getElementById("nextBtn").style.display = "inline-block";
  }

  function next(){
    Q.idx++;
    if (Q.idx < Q.questions.length) return paintQuestion();
    finishQuiz();
  }

  function finishQuiz(){
    const n = Q.questions.length;
    const pct = Math.round(Q.correct/n*100);
    if (Q.isDiag){
      const weak = Object.keys(Q.wrongSkills).map(Number).sort((a,b)=>a-b);
      progress.diagnostic = { score:Q.correct, total:n, weak };
      save(progress);
      return renderDiagnosticResult();
    }
    setSkillScore(Q.cfg.skill, pct);
    renderQuizResult(pct);
  }

  function renderQuizResult(pct){
    const sk = CURRICULUM.skills[Q.cfg.skill];
    const day = CURRICULUM.plan.find(d=>d.skills.includes(+Q.cfg.skill)).day;
    const msg = pct>=90?"Mükemmel! 🏆":pct>=70?"Güzel iş, bu skill tamam ✅":"Bu konuyu tekrar gözden geçir 🔁";
    view().innerHTML = `
      <div class="card result-card" style="--deg:${pct*3.6}deg">
        <div class="score-ring"><div class="inner">${pct}%</div></div>
        <h2>${msg}</h2>
        <p>${sk.title} · ${Q.correct}/${Q.questions.length} doğru</p>
        <div class="lesson-actions" style="justify-content:center">
          <button class="btn" onclick="App.go('quiz',{skill:${Q.cfg.skill}})">Tekrar dene</button>
          <button class="btn sec" onclick="App.go('day',${day})">Gün ${day}'e dön</button>
          <button class="btn sec" onclick="App.nextSkill(${Q.cfg.skill})">Sonraki skill →</button>
        </div>
      </div>`;
  }

  function nextSkill(id){
    const ids = Object.keys(CURRICULUM.skills).map(Number);
    const next = ids.find(x=>x>id);
    if (next) go("lesson", next); else go("progress");
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
        <div class="lesson-actions">
          <button class="btn" onclick="App.go('quiz',{diagnostic:true})">Teste başla →</button>
        </div>
      </div>`;
  }

  function renderDiagnosticResult(){
    const d = progress.diagnostic;
    const pct = Math.round(d.score/d.total*100);
    let weakHtml;
    if (!d.weak.length){
      weakHtml = `<p style="color:var(--good);font-weight:600">Harika — belirgin bir zayıf konun yok! 🎉 Yine de planı baştan sona geçmeni öneririm.</p>`;
    } else {
      weakHtml = `<div class="weak-list">${d.weak.map(id=>{
        const sk = CURRICULUM.skills[id];
        return `<div class="weak-item"><span>Skill ${id} — ${esc(sk.title)}</span>
          <a href="#" onclick="App.go('lesson',${id});return false">Çalış →</a></div>`;
      }).join("")}</div>`;
    }
    view().innerHTML = `
      <div class="card result-card" style="--deg:${pct*3.6}deg">
        <div class="score-ring"><div class="inner">${pct}%</div></div>
        <h2>Tanı testi tamamlandı</h2>
        <p>${d.score}/${d.total} doğru</p>
      </div>
      <div class="section-title">Öncelik vermen gereken konular</div>
      ${weakHtml}
      <div class="lesson-actions" style="margin-top:18px">
        <button class="btn" onclick="App.go('${d.weak.length?'lesson':'day'}',${d.weak.length?d.weak[0]:1})">
          ${d.weak.length?'İlk zayıf konuyla başla':'Gün 1 ile başla'} →</button>
        <button class="btn sec" onclick="App.go('home')">Plana dön</button>
      </div>`;
  }

  // --- PROGRESS ----------------------------------------------------------
  function renderProgress(){
    const cells = Object.keys(CURRICULUM.skills).map(id=>{
      const sk = CURRICULUM.skills[id];
      const st = progress.skills[id] || {};
      const v = st.best || 0;
      const col = v>=70?"var(--good)":v>0?"var(--warn)":"var(--line)";
      return `<div class="prog-cell" onclick="App.go('lesson',${id})" style="cursor:pointer">
        <b>Skill ${id}</b><br><small>${esc(sk.title)}</small>
        <div class="bar"><i style="width:${v}%;background:${col}"></i></div>
        <small>${v?v+"% (en iyi)":"henüz çalışılmadı"}</small>
      </div>`;
    }).join("");
    const done = doneCount(), total = totalSkills();
    view().innerHTML = `
      <button class="back" onclick="App.go('home')">← Ana sayfa</button>
      <div class="hero">
        <h1>İlerlemen 📊</h1>
        <p>${done}/${total} skill tamamlandı (70%+ = tamam sayılır).</p>
        <div class="day-prog" style="margin-top:14px"><i style="width:${Math.round(done/total*100)}%"></i></div>
      </div>
      <div class="section-title">Tüm beceriler</div>
      <div class="prog-grid">${cells}</div>`;
  }

  // --- RESET -------------------------------------------------------------
  function resetProgress(){
    if (confirm("Tüm ilerlemen silinecek. Emin misin?")){
      localStorage.removeItem(STORE);
      progress = { skills:{} };
      go("home");
    }
  }

  // init
  document.addEventListener("DOMContentLoaded", ()=>go("home"));

  return { go, answerMC, answerErr, next, nextSkill, resetProgress };
})();
