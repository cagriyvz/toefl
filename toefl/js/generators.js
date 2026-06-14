/* ==========================================================================
   TOEFL Structure — PROSEDÜREL SORU ÜRETİCİ MOTORU
   Her skill için kelime havuzlu şablonlar. Çıktı: her seferinde TAZE,
   gramer açısından garanti doğru sorular + her şık için detaylı açıklama.
   Kombinasyon sayısı her konuda 100'ün çok üstündedir → "100+ soru / her
   girişte farklı soru" gereksinimini karşılar.
   Soru şeması app.js ile uyumlu: {type, stem/segments, options/answer,
   breakdown, explain/correction, _id, _skill}
   ========================================================================== */

const GEN = (() => {
  let SEQ = 0;
  const uid = () => "g"+(Date.now().toString(36))+(SEQ++);
  const rnd = a => a[Math.floor(Math.random()*a.length)];
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  // n farklı eleman seç
  function pickN(a,n){ return shuffle(a.slice()).slice(0,n); }

  // ---- kelime havuzları --------------------------------------------------
  // Düzenli fiiller (formları açıkça yazıldı; yazım hatası riski yok)
  const V = [
    {b:"develop",  s:"develops",  ing:"developing",  ed:"developed"},
    {b:"produce",  s:"produces",  ing:"producing",   ed:"produced"},
    {b:"deliver",  s:"delivers",  ing:"delivering",  ed:"delivered"},
    {b:"complete", s:"completes", ing:"completing",  ed:"completed"},
    {b:"design",   s:"designs",   ing:"designing",   ed:"designed"},
    {b:"record",   s:"records",   ing:"recording",   ed:"recorded"},
    {b:"present",  s:"presents",  ing:"presenting",  ed:"presented"},
    {b:"examine",  s:"examines",  ing:"examining",   ed:"examined"},
    {b:"publish",  s:"publishes", ing:"publishing",  ed:"published"},
    {b:"manage",   s:"manages",   ing:"managing",    ed:"managed"},
    {b:"operate",  s:"operates",  ing:"operating",   ed:"operated"},
    {b:"organize", s:"organizes", ing:"organizing",  ed:"organized"},
    {b:"measure",  s:"measures",  ing:"measuring",   ed:"measured"},
    {b:"collect",  s:"collects",  ing:"collecting",  ed:"collected"},
    {b:"improve",  s:"improves",  ing:"improving",   ed:"improved"},
    {b:"support",  s:"supports",  ing:"supporting",  ed:"supported"},
    {b:"review",   s:"reviews",   ing:"reviewing",   ed:"reviewed"},
    {b:"inspect",  s:"inspects",  ing:"inspecting",  ed:"inspected"}
  ];
  // Düzensiz fiiller (have + V3 için)
  const IRR = [
    {b:"take",  pp:"taken",  past:"took"},
    {b:"write", pp:"written", past:"wrote"},
    {b:"give",  pp:"given",  past:"gave"},
    {b:"see",   pp:"seen",   past:"saw"},
    {b:"begin", pp:"begun",  past:"began"},
    {b:"choose",pp:"chosen", past:"chose"},
    {b:"break", pp:"broken", past:"broke"},
    {b:"speak", pp:"spoken", past:"spoke"},
    {b:"drive", pp:"driven", past:"drove"},
    {b:"grow",  pp:"grown",  past:"grew"},
    {b:"know",  pp:"known",  past:"knew"},
    {b:"throw", pp:"thrown", past:"threw"}
  ];
  const SUBJ_S = ["the scientist","the teacher","the engineer","the manager","the artist","the author",
    "the researcher","the technician","the architect","the editor","the inspector","the designer",
    "the biologist","the journalist","the historian","the surgeon","the pilot","the lawyer","the chef",
    "the photographer","the curator","the geologist","the astronomer","the nurse","the analyst",
    "the director","the professor","the carpenter","the electrician","the translator","the coach"];
  const SUBJ_P = ["the scientists","the teachers","the engineers","the workers","the students","the researchers",
    "the technicians","the editors","the doctors","the farmers","the inspectors","the designers",
    "the biologists","the journalists","the historians","the surgeons","the pilots","the lawyers","the chefs",
    "the photographers","the curators","the geologists","the astronomers","the nurses","the analysts",
    "the directors","the professors","the volunteers","the climbers","the divers","the sailors"];
  const OBJ = ["the project","the report","the experiment","the design","the proposal","the equipment",
    "the program","the survey","the documents","the system","the device","the prototype","the vaccine",
    "the bridge","the software","the engine","the telescope","the highway","the curriculum","the model",
    "the database","the campaign","the algorithm","the exhibit","the recipe","the satellite","the sculpture",
    "the festival","the textbook","the garden"];
  const PLACE = ["the laboratory","the office","the factory","the university","the museum","the library",
    "the hospital","the studio","the warehouse","the institute","the harbor","the campus","the valley",
    "the capital","the market","the station","the clinic","the observatory","the gallery","the workshop"];
  const TIME = ["Every year,","In recent decades,","During the study,","Throughout the project,",
    "In the past century,","Each season,","Over many years,","In the modern era,"];
  const ADJ = ["complex","detailed","modern","accurate","practical","efficient","original","valuable"];
  const ADJpair = [ // sıfat / zarf çiftleri
    {adj:"careful",  adv:"carefully"},  {adj:"quick",   adv:"quickly"},
    {adj:"successful",adv:"successfully"},{adj:"clear",   adv:"clearly"},
    {adj:"efficient",adv:"efficiently"},{adj:"precise",  adv:"precisely"},
    {adj:"rapid",    adv:"rapidly"},    {adj:"complete", adv:"completely"},
    {adj:"proper",   adv:"properly"},   {adj:"accurate", adv:"accurately"}];

  const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
  const lcfirst = s => s.charAt(0).toLowerCase()+s.slice(1);

  // Cümle başını çeşitlendiren giriş öbekleri (ilk kelimeyi değiştirir → tekdüzelik biter)
  const LEADS = ["In recent years","During the study","According to the report","Across the region",
    "For many years","In most cases","At the conference","Last season","Among researchers",
    "In the new edition","After the review","Throughout history","In the latest survey","Over the past decade",
    "In practice","As expected","By all accounts","In this field","In the report","At the institute"];
  // %60 ihtimalle bir giriş öbeği ekler ve devamının ilk harfini küçültür
  function withLead(startText){
    return Math.random()<0.6 ? (rnd(LEADS)+", "+lcfirst(startText)) : startText;
  }

  // ---- yardımcı kurucular ------------------------------------------------
  // mc: correct={t,why}, distractors=[{t,why}...]
  function mc(skill, stem, correct, distractors, summary){
    const opts = shuffle([{...correct,ok:true}, ...distractors.map(d=>({...d,ok:false}))]);
    return { type:"mc", _id:uid(), _skill:skill, stem,
      options:opts.map(o=>o.t), answer:opts.findIndex(o=>o.ok),
      breakdown:opts.map(o=>o.why),
      explain: summary || ("Doğru cevap: \""+correct.t+"\". "+(correct.why||"")) };
  }
  // err: parts = sıralı; her madde {plain} ya da {choice,text,why,error?,correction?}
  function err(skill, parts, summary){
    let li=0; const labels=["A","B","C","D"];
    const segments=[]; const breakdown={}; let answer=null, correction="";
    parts.forEach(p=>{
      if (p.plain!==undefined){ segments.push({plain:p.plain}); return; }
      const L=labels[li++];
      segments.push({choice:L, text:p.text});
      breakdown[L]=p.why;
      if (p.error){ answer=L; correction=p.correction||""; }
    });
    return { type:"err", _id:uid(), _skill:skill, segments, answer, breakdown,
      correction: correction, explain: summary||correction };
  }

  // ======================================================================
  //  SKILL ÜRETİCİLERİ (1–25)
  // ======================================================================
  const G = {};

  // Skill 1 — Özne & Fiil
  G[1] = () => {
    const v=rnd(V), s=rnd(SUBJ_S), o=rnd(OBJ), t=rnd(TIME);
    if (Math.random()<0.5){ // fiil eksik
      return mc(1, `${t} ${s} ___ ${o}.`,
        {t:v.s,  why:"Tam (çekimli) fiil. Cümlenin zaten öznesi var, sadece fiil gerekiyordu."},
        [{t:v.ing, why:"-ing tek başına fiil olamaz; yanında 'be' (is/are/was) olmalıydı."},
         {t:"to "+v.b, why:"Mastar (to+fiil) cümlenin asıl fiili olamaz."},
         {t:"it "+v.s, why:"Fazladan özne ('it'). Cümlede zaten bir özne var, ikinci özne olmaz."}],
        `Özne (${s}) var, çekimli bir fiil lazım → "${v.s}".`);
    } else { // özne eksik
      const subj=cap(s);
      return mc(1, `___ ${v.s} ${o} at ${rnd(PLACE)}.`,
        {t:subj, why:"Geçerli bir özne (isim öbeği). Cümlenin ihtiyacı buydu."},
        [{t:cap(v.ing), why:"-ing bir özne değil; fiil/sıfat görevindedir."},
         {t:rnd(["Carefully","Quickly","Regularly"]), why:"Zarf özne olamaz."},
         {t:"At "+rnd(PLACE), why:"Edat öbeği özne olamaz; içindeki isim edatın nesnesidir."}],
        `Fiil (${v.s}) var ama özne yok → "${subj}".`);
    }
  };

  // Skill 2 — Edatların nesnesi
  G[2] = () => {
    const v=rnd(V), s=rnd(SUBJ_S), p1=rnd(PLACE), p2=rnd(PLACE), o=rnd(OBJ);
    const open=rnd([`In ${p1} near ${p2}`, `At ${p1} during the project`, `After the meeting in ${p1}`,
      `Among the records in ${p1}`, `Throughout ${p1}`, `On the upper floor of ${p1}`,
      `Beside ${p1}`, `Within ${p1}`, `Near ${p1} every morning`, `Inside ${p1}`]);
    return mc(2, `${open}, ___ ${v.s} ${o}.`,
      {t:s, why:"Gerçek özne. Baştaki edat öbeklerinden sonra cümlenin bir öznesi olmalı."},
      [{t:"In "+rnd(PLACE), why:"Edat öbeği özne olamaz; içindeki isim edatın nesnesidir."},
       {t:rnd(["regularly","carefully","quickly"]), why:"Zarf özne görevini göremez."},
       {t:"it "+v.s, why:"Fazladan özne+fiil; cümlenin yapısını bozar."}],
      `Baştaki "In ... near ..." edat öbekleri; bunlardan sonra hâlâ bir özne lazım → "${s}".`);
  };

  // Skill 3 — Present participle (sıfat vs fiil)
  G[3] = () => {
    const v=rnd(V), s=rnd(SUBJ_P), p=rnd(PLACE), o=rnd(OBJ);
    const bare=s.replace(/^the /,"");
    const subj=rnd([cap(s), "Several "+bare, "Many "+bare, cap(bare), "Most "+bare]);
    return mc(3, `${subj} ___ in ${p} ${v.s} ${o} efficiently.`,
      {t:rnd(["working","operating","meeting"]), why:"Participle sıfat. Asıl fiil ("+v.s+") zaten var; özneyi niteleyen -ing biçimi doğru."},
      [{t:"is "+rnd(["working","operating"]), why:"Fazladan fiil. Cümlede zaten asıl fiil var, ikinci fiil olmaz."},
       {t:"they "+rnd(["work","operate"]), why:"Fazladan özne+fiil; bağlaç olmadan ikinci clause kurulamaz."},
       {t:rnd(["work","operate"]), why:"İkinci bir çekimli fiil; cümlede iki fiil olur."}],
      `Asıl fiil "${v.s}" zaten var → boşluğa özneyi niteleyen participle sıfat gelir.`);
  };

  // Skill 4 — Past participle (pasif sıfat)
  G[4] = () => {
    const v=rnd(V);
    const s=rnd(["reports","documents","samples","designs","results","articles","findings",
      "records","drawings","proposals","photographs","measurements","specimens","manuscripts"]);
    const agent=rnd(["the committee","the experts","the board","the team","the editors","the panel",
      "a specialist","the engineers","the reviewers","the auditors","the professor","the institute"]);
    const tail=rnd(["were finally published","were widely praised","became a new standard",
      "were later revised","received an award","were quickly approved","were carefully archived",
      "were soon forgotten","drew great interest","were openly criticized"]);
    const subj=rnd([`The ${s}`, `Several ${s}`, `Many ${s}`, cap(s), `Most ${s}`, `All ${s}`]);
    return mc(4, `${subj} ___ by ${agent} ${tail}.`,
      {t:v.ed, why:"Past participle (pasif sıfat). Cümlenin asıl fiili zaten var; özneyi niteleyen V3 doğru."},
      [{t:"were "+v.ed, why:"Fazladan fiil. Cümlede zaten asıl fiil var, ikinci fiil olmaz."},
       {t:v.ing, why:"Etken -ing; anlam pasif ('by ...'), V3 gerekir."},
       {t:"they "+v.ed, why:"Fazladan özne+fiil; bağlaçsız ikinci clause olmaz."}],
      `'by ${agent}' pasif yapı → özneyi niteleyen V3 "${v.ed}".`);
  };

  // Skill 5 — Coordinate bağlaçlar (geniş, tutarlı cümle havuzları)
  const C5 = {
    so:  { rel:"sonuç (sebep→sonuç)",
           a:["It started to rain","The road was icy","The power went out","She missed the bus",
            "The store ran out of bread","The printer jammed","The flight was cancelled","His phone died",
            "The river flooded the path","Nobody answered the door","The wifi went down","The match was rained off",
            "A storm hit the coast","The elevator was broken","Demand grew quickly"],
           b:["the game was postponed","we took a taxi","they lit candles","she walked to work",
            "he baked his own","the report was delayed","the trip was rescheduled","he borrowed a charger",
            "the village was evacuated","we left a note","the class moved online","the players went home",
            "the ferries stopped running","we used the stairs","the factory added a shift"] },
    but: { rel:"zıtlık",
           a:["The team practiced for months","The recipe looked complicated","Tickets were expensive",
            "The hike was long","She studied all night","The old engine was rusty","The reviews were poor",
            "The room was tiny","He spoke very quietly","The bridge looked fragile"],
           b:["they still lost the final","it was actually easy","the concert sold out fast",
            "the view was worth it","she failed the quiz","it still ran smoothly","the film became a hit",
            "it felt surprisingly cozy","everyone heard him clearly","it carried heavy trucks"] },
    and: { rel:"ekleme",
           a:["The sun rose over the hills","The orchestra began to play","Visitors filled the gallery",
            "The bakery opened at dawn","The children built a sandcastle","Snow covered the rooftops",
            "The market grew busy","The garden bloomed in spring","The lecture started on time"],
           b:["the valley glowed with light","the audience fell silent","the gift shop stayed busy",
            "the smell of bread spread","the waves washed it away","the streets turned white",
            "prices began to climb","bees moved between the flowers","the hall was completely full"] },
    or:  { rel:"seçenek",
           a:["We can hike the trail","You may submit it online","They can stay another night","We could cook at home",
            "You can pay by card","We can meet on Monday","Students may work in pairs","You can take the train"],
           b:["we can rent bikes","you may mail a printed copy","they can catch the early train","we could order takeout",
            "you can pay with cash","we can wait until Friday","they may work alone","you can drive instead"] },
  };
  G[5] = () => {
    const conj=rnd(["so","but","and","or"]);
    const p=C5[conj];
    return mc(5, `${rnd(p.a)}, ___ ${rnd(p.b)}.`,
      {t:conj, why:`Coordinate bağlaç; iki bağımsız clause'u virgülle birleştirir (${p.rel}).`},
      shuffle([
        {t:"then",       why:"Bağlaç değil, zarftır; iki clause'u tek başına birleştiremez."},
        {t:"however",    why:"Conjunctive adverb; clause bağlamak için noktalı virgül gerekir."},
        {t:"therefore",  why:"Conjunctive adverb; iki clause'u sadece virgülle bağlayamaz."},
        {t:"as a result",why:"Bağlaç değil; clause birleştirici görevi göremez."},
        {t:"moreover",   why:"Conjunctive adverb; coordinate bağlaç değildir."}]).slice(0,3),
      `İki bağımsız clause'u birleştiren coordinate bağlaç (and/but/or/so) → "${conj}".`);
  };

  // Skill 6 — Adverb clause bağlaçları
  G[6] = () => {
    const v=rnd(V), s=rnd(SUBJ_S), o=rnd(OBJ);
    const pron = s.includes("scientist")||s.includes("author")||s.includes("editor")?"she":"he";
    const conj=rnd([{w:"After",x:"zaman"},{w:"Because",x:"sebep"},{w:"Although",x:"zıtlık"},{w:"When",x:"zaman"}]);
    return mc(6, `___ ${v.ed} ${o}, ${pron} ${rnd(["left the office","wrote a summary","began the next task"])}.`,
      {t:`${conj.w} ${s}`, why:`Bağlaç (${conj.w}) + özne (${s}). İlk clause'un hem öznesi hem bağlacı tamam (${conj.x}).`},
      [{t:cap(s), why:"Özne var ama iki clause'u birleştiren bağlaç yok."},
       {t:conj.w, why:"Bağlaç var ama 'verbed ...' clause'unun öznesi yok."},
       {t:rnd(["Having","Finishing","Working"]), why:"-ing'li öbek burada tam bir clause kurmaz; bağlaç+özne gerekiyordu."}],
      `İlk boşlukta hem bağlaç hem özne gerekiyor → "${conj.w} ${s}".`);
  };

  // Skill 7 — Noun clause bağlaçları
  G[7] = () => {
    const frames=[
      {v:"explained", conj:"why", d:["because","the","so"], cl:["the experiment had failed","the plan was changed","the costs had risen","the project was delayed","the theory was wrong"]},
      {v:"described", conj:"how", d:["what","which","that the"], cl:["the system actually works","the engine starts","the cells divide","the device operates","the process begins"]},
      {v:"wondered",  conj:"whether", d:["that","what","which"], cl:["the results were reliable","the offer was genuine","the data was complete","the method was valid","the source was correct"]},
      {v:"forgot",    conj:"where", d:["that","which","because"], cl:["the keys had been left","the files were stored","the meeting would be held","the samples were kept"]},
      {v:"asked",     conj:"when", d:["that","what","which"], cl:["the train would arrive","the results would come","the store would open","the season would begin"]}];
    const f=rnd(frames), s=rnd(SUBJ_S), cl=rnd(f.cl);
    return mc(7, withLead(`${cap(s)} ${f.v} ___ ${cl}.`),
      {t:f.conj, why:`Noun clause bağlacı; '${f.v}' fiilinin nesnesi olan clause'u başlatır.`},
      [{t:f.d[0], why:"Anlam/yapı uymuyor; burada fiilin nesnesi olan bir noun clause gerekiyor."},
       {t:f.d[1], why:"Bu bağlaç clause'un öznesi/nesnesi olmalıydı; cümlede o boşluk yok."},
       {t:f.d[2], why:"Yapı bozuk; tek bir noun clause bağlacı yeterli."}],
      `'${f.v}' fiilinin nesnesi olan noun clause'u başlatan bağlaç → "${f.conj}".`);
  };

  // Skill 8 — Noun clause bağlacı = özne
  G[8] = () => {
    const v=rnd(V), o=rnd(OBJ), s=rnd(SUBJ_S);
    return mc(8, withLead(`${cap(s)} could not explain what ___ to ${o}.`),
      {t:"had happened", why:"'what' hem bağlaç hem öznedir; hemen ardından çekimli fiil gelir."},
      [{t:"happening", why:"-ing tek başına fiil değil; clause'un fiili eksik kalır."},
       {t:"the happening", why:"İsim öbeği; 'what' zaten özne, ikinci özne olmaz ve fiil yok."},
       {t:"it happened", why:"Fazladan özne ('it'); 'what' zaten özne görevinde."}],
      `'what' bağlaç+özne olduğundan ardından fiil gelir → "had happened".`);
  };

  // Skill 9 — Adjective clause bağlaçları (nesne)
  G[9] = () => {
    const v=rnd(V), s=rnd(SUBJ_S), o=rnd(OBJ);
    return mc(9, withLead(`${cap(o)} ___ ${s} ${v.ed} was highly detailed.`),
      {t:"that", why:"Adjective clause bağlacı; ismi niteler, ardından özne+fiil gelir (that S V)."},
      [{t:"it", why:"Bağlaç değil; iki clause'u birleştiremez."},
       {t:"which it", why:"Fazladan özne; 'which' zaten bağlaç, ardından 'it' gereksiz."},
       {t:"what", why:"'what' adjective clause başlatmaz; ismi niteleyen who/which/that gerekir."}],
      `İsmi niteleyen, ardından özne+fiil gelen bağlaç → "that".`);
  };

  // Skill 10 — Adjective clause bağlacı = özne
  G[10] = () => {
    const s=rnd(SUBJ_S), vb=rnd(["received","attracted","drew","earned"]);
    return mc(10, withLead(`${cap(s)} ${rnd(["praised","approved","selected"])} the design ___ ${vb} the most attention.`),
      {t:"that "+vb, why:"Bağlaç (that) + fiil. 'that' clause'un öznesidir; hemen ardından fiil gelir."},
      [{t:"it "+vb, why:"Fazladan özne; bağlaç yok, iki clause birleşmez."},
       {t:"which it "+vb, why:"'which' zaten özne; ardından 'it' fazladan özne olur."},
       {t:rnd(["receiving","attracting","drawing"]), why:"-ing tek başına clause'un fiilini oluşturmaz; bağlaç+fiil gerekli."}],
      `İsmi niteleyen ve clause'un öznesi olan bağlaç → ardından fiil ("that ${vb}").`);
  };

  // Skill 11 — Araya giren öbekle uyum (özne tekil, araya çoğul öbek girer)
  G[11] = () => {
    const o=rnd(["quality","cost","design","purpose","value","size","range"]);
    const plur=rnd(["products","materials","components","samples","devices","reports","machines"]);
    return err(11,[
      {plain:withLead("The ")}, {choice:"A",text:o, why:"Asıl özne ve TEKİL → fiil tekil olmalı."},
      {plain:" of the "}, {choice:"B",text:plur, why:"'of'un nesnesi; araya giren öbek, fiili etkilemez."},
      {plain:" "}, {choice:"C",text:"have", why:"HATA: çoğul fiil. Asıl özne tekil ('"+o+"') → 'has' olmalı.", error:true, correction:"'have' → 'has'"},
      {plain:" "}, {choice:"D",text:rnd(["improved","increased","changed","declined"]), why:"Fiilin ikinci parçası (V3); doğru."}
    ], `'have' → 'has'. Asıl özne '${o}' tekil; 'of ${plur}' araya giren öbektir, fiili etkilemez.`);
  };

  // Skill 12 — Miktar ifadeleriyle uyum
  G[12] = () => {
    const sing=rnd(["information","equipment","research","water","knowledge","money","evidence","software","data","funding"]);
    return err(12,[
      {plain:rnd(["Most","Half","Part","Some","Much"])+" "}, {choice:"A",text:"of", why:"Miktar ifadesinde uyum 'of'tan sonraki isme bakar."},
      {plain:" the "}, {choice:"B",text:sing, why:"'of'tan sonraki isim TEKİL/sayılamaz → fiil tekil olmalı."},
      {plain:" "}, {choice:"C",text:"were", why:"HATA: çoğul fiil. '"+sing+"' tekil/sayılamaz → 'was'.", error:true, correction:"'were' → 'was'"},
      {plain:" "}, {choice:"D",text:rnd(["accurate","useful","reliable","available","incomplete","outdated","confidential"]), why:"Sıfat; doğru kullanılmış."}
    ], `'were' → 'was'. Miktar ifadesinde fiil 'of'tan sonraki isme ('${sing}', tekil) uyar.`);
  };

  // Skill 13 — Belirli kelimelerle uyum (each/every...)
  G[13] = () => {
    const w=rnd(["Each","Every","Either","Neither"]);
    const plur=rnd(["countries","students","machines","samples","regions","teams"]);
    const noun=rnd(["flag","report","manual","sensor","leader","result"]);
    return err(13,[
      {plain:w+" "}, {choice:"A",text:"of", why:"'"+w+"' tekildir; ardından tekil fiil gelir."},
      {plain:" the "}, {choice:"B",text:plur, why:"'of'un nesnesi; '"+w+"' yine tekil kalır."},
      {plain:" "}, {choice:"C",text:"have", why:"HATA: '"+w+"' tekil → 'has' olmalı.", error:true, correction:"'have' → 'has'"},
      {plain:" its own "}, {choice:"D",text:noun, why:"Tekil iyelik+isim; '"+w+"' ile uyumlu."}
    ], `'have' → 'has'. '${w}' dilbilgisel olarak tekildir.`);
  };

  // Skill 14 — Paralel yapı (and/or)
  G[14] = () => {
    const trio=rnd([
      {a:"reading", b:"writing", wrong:"to speak", right:"speaking"},
      {a:"to plan", b:"to design", wrong:"building", right:"to build"},
      {a:"quickly", b:"safely", wrong:"efficient", right:"efficiently"},
      {a:"cleaning", b:"cooking", wrong:"to wash", right:"washing"},
      {a:"to analyze", b:"to compare", wrong:"summarizing", right:"to summarize"},
      {a:"painting", b:"drawing", wrong:"to sculpt", right:"sculpting"},
      {a:"clearly", b:"briefly", wrong:"accurate", right:"accurately"},
      {a:"to gather", b:"to sort", wrong:"recording", right:"to record"},
      {a:"hiking", b:"swimming", wrong:"to climb", right:"climbing"},
      {a:"to observe", b:"to measure", wrong:"calculating", right:"to calculate"}]);
    const lead=rnd(["The course focuses on","The program involves","The job requires","The training covers","Students practice"]);
    return err(14,[
      {plain:withLead(lead+" ")}, {choice:"A",text:trio.a, why:"Listenin ilk öğesi; biçimi belirler."},
      {plain:", "}, {choice:"B",text:trio.b, why:"İlk öğeyle aynı biçim; doğru."},
      {plain:", and "}, {choice:"C",text:trio.wrong, why:"HATA: paralellik bozuldu. '"+trio.a+"' ile aynı biçimde olmalı → '"+trio.right+"'.", error:true, correction:"'"+trio.wrong+"' → '"+trio.right+"'"},
      {plain:" a "}, {choice:"D",text:rnd(["language","structure","method","report","subject","skill","model","sample"]), why:"İsim; doğru kullanılmış."}
    ], `'${trio.wrong}' → '${trio.right}'. and/or ile bağlanan öğeler aynı biçimde olmalı.`);
  };

  // Skill 15 — both...and / either...or / not only...but also
  G[15] = () => {
    const f=rnd([
      {pair:"both", j:"and", a:"efficient", wrong:"economy", right:"economical"},
      {pair:"either", j:"or", a:"to stay", wrong:"leaving", right:"to leave"},
      {pair:"neither", j:"nor", a:"the manager", wrong:"workers", right:"the workers"},
      {pair:"both", j:"and", a:"practical", wrong:"affordability", right:"affordable"},
      {pair:"either", j:"or", a:"to call", wrong:"emailing", right:"to email"},
      {pair:"neither", j:"nor", a:"the teacher", wrong:"students", right:"the students"},
      {pair:"both", j:"and", a:"durable", wrong:"flexibility", right:"flexible"},
      {pair:"either", j:"or", a:"to invest", wrong:"saving", right:"to save"},
      {pair:"neither", j:"nor", a:"the director", wrong:"actors", right:"the actors"},
      {pair:"both", j:"and", a:"reliable", wrong:"speed", right:"fast"}]);
    const subj=rnd(["The plan","The new model","The proposal","The design","The system","The strategy","The device"]);
    const tail=rnd(["according to the report","in every test","overall","in the long run","for the company"]);
    return err(15,[
      {plain:withLead(subj+" is ")}, {choice:"A",text:f.pair, why:"İkili bağlacın ilk parçası ('"+f.pair+" ... "+f.j+"')."},
      {plain:" "}, {choice:"B",text:f.a, why:"İlk öğe; biçimi belirler."},
      {plain:" "}, {choice:"C",text:f.j, why:"İkili bağlacın ikinci parçası; doğru eşleşme."},
      {plain:" "}, {choice:"D",text:f.wrong, why:"HATA: paralellik yok. '"+f.a+"' ile aynı biçim → '"+f.right+"'.", error:true, correction:"'"+f.wrong+"' → '"+f.right+"'"},
      {plain:" "+tail+"."}
    ], `'${f.wrong}' → '${f.right}'. ${f.pair}…${f.j} yapısının iki yanı paralel olmalı.`);
  };

  // Skill 16 — have + V3
  G[16] = () => {
    const v=rnd(IRR), s=rnd(SUBJ_P);
    return err(16,[
      {plain:withLead(cap(s)+" ")}, {choice:"A",text:"have", why:"Yardımcı fiil; ardından V3 (past participle) gelmeli."},
      {plain:" "}, {choice:"B",text:v.past, why:"HATA: V2 (geçmiş) kullanılmış. 'have' sonrası V3 olmalı → '"+v.pp+"'.", error:true, correction:"'"+v.past+"' → '"+v.pp+"'"},
      {plain:" several "}, {choice:"C",text:rnd(["reports","designs","surveys","devices","projects","samples"]), why:"Çoğul isim; doğru."},
      {plain:" this "}, {choice:"D",text:rnd(["year","month","decade","season"]), why:"Zaman ifadesi; doğru."}
    ], `'${v.past}' → '${v.pp}'. have/has + past participle (V3) kuralı.`);
  };

  // Skill 17 — be + Ving / be + V3
  G[17] = () => {
    const v=rnd(V), s=rnd(SUBJ_S);
    return err(17,[
      {plain:withLead("The "+rnd(["bridge","road","building","system"])+" ")}, {choice:"A",text:"is", why:"'be' fiili; ardından Ving (etken) ya da V3 (edilgen) gelmeli."},
      {plain:" currently being "}, {choice:"B",text:v.b, why:"HATA: 'being' sonrası V3 gerekir (edilgen) → '"+v.ed+"'.", error:true, correction:"'"+v.b+"' → '"+v.ed+"'"},
      {plain:" by "}, {choice:"C",text:rnd(["a local firm","the agency","experts"]), why:"Edilgen yapının fail ('by ...') kısmı; doğru."},
      {plain:" this "}, {choice:"D",text:rnd(["year","month"]), why:"Zaman ifadesi; doğru."}
    ], `'${v.b}' → '${v.ed}'. 'be being' edilgen yapısından sonra V3 gelir.`);
  };

  // Skill 18 — modal + V1
  G[18] = () => {
    const v=rnd(V), s=rnd(SUBJ_P), m=rnd(["must","will","should","can","may"]);
    const wrongForm=rnd([v.s, v.ed, v.ing]);
    return err(18,[
      {plain:withLead(cap(s)+" ")}, {choice:"A",text:m, why:"Modal fiil; ardından YALIN fiil (V1) gelmeli."},
      {plain:" "}, {choice:"B",text:wrongForm, why:"HATA: modal sonrası çekimli/-ing/-ed biçim olmaz → yalın '"+v.b+"'.", error:true, correction:"'"+wrongForm+"' → '"+v.b+"'"},
      {plain:" the "}, {choice:"C",text:rnd(OBJ).replace("the ",""), why:"Nesne; doğru."},
      {plain:" before the "}, {choice:"D",text:rnd(["deadline","meeting","review","launch"]), why:"İsim; doğru."}
    ], `'${wrongForm}' → '${v.b}'. modal (${m}) + yalın fiil (V1).`);
  };

  // Skill 19 — tekil/çoğul isim
  G[19] = () => {
    const det=rnd([{w:"Every",n:1},{w:"Each",n:1},{w:"One",n:1},{w:"Many",n:2},{w:"Several",n:2},{w:"Various",n:2},{w:"Both",n:2}]);
    const sing=rnd(["passenger","student","sample","device","report","sensor"]);
    const plur=sing+"s";
    const wrongText = det.n===1 ? plur : sing;       // tekil bekleniyorsa çoğul yazıp hata yap; çoğul bekleniyorsa tekil
    const rightText = det.n===1 ? sing : plur;
    return err(19,[
      {plain:det.w+" "}, {choice:"A",text:wrongText, why:"HATA: '"+det.w+"' "+(det.n===1?"TEKİL":"ÇOĞUL")+" isim ister → '"+rightText+"'.", error:true, correction:"'"+wrongText+"' → '"+rightText+"'"},
      {plain:" must "}, {choice:"B",text:rnd(["show","carry","provide","submit"]), why:"Modal sonrası yalın fiil; doğru."},
      {plain:" a "}, {choice:"C",text:rnd(["valid","proper","detailed"]), why:"Sıfat; doğru."},
      {plain:" "}, {choice:"D",text:rnd(["ticket","form","document","code"]), why:"İsim; doğru."}
    ], `'${wrongText}' → '${rightText}'. '${det.w}' ${det.n===1?"tekil":"çoğul"} isim alır.`);
  };

  // Skill 20 — sayılabilen/sayılamayan
  G[20] = () => {
    // İki sağlam kalıp: (a) yanlış belirteç, (b) sayılamayanı çoğul yapma
    const detErr = rnd([
      {det:"amount",  right:"number", noun:"resources", why:"'amount of' sayılamayanlarla kullanılır; 'resources' sayılabilir → 'number of'."},
      {det:"much",    right:"many",   noun:"machines",  why:"'much' sayılamayanlarla; 'machines' sayılabilir → 'many'."},
      {det:"fewer",   right:"less",   noun:"equipment", why:"'fewer' sayılabilenlerle; 'equipment' sayılamaz → 'less'."},
      {det:"many",    right:"much",   noun:"information",why:"'many' sayılabilenlerle; 'information' sayılamaz → 'much'."}]);
    const lead=rnd(["The study still needs","The project required","The lab has collected","Researchers gathered","The team still lacks"]);
    return err(20,[
      {plain:withLead(lead+" ")}, {choice:"A",text:detErr.det, why:"HATA: "+detErr.why, error:true, correction:"'"+detErr.det+"' → '"+detErr.right+"'"},
      {plain:" "}, {choice:"B",text:detErr.noun, why:"İsim; sayılabilirliği belirteci belirler."},
      {plain:" to "}, {choice:"C",text:rnd(["complete","finish","support","validate","continue"]), why:"Fiil; doğru."},
      {plain:" the "}, {choice:"D",text:rnd(["analysis","project","review","study","experiment","report"]), why:"İsim; doğru."}
    ], `'${detErr.det}' → '${detErr.right}'. ${detErr.why}`);
  };

  // Skill 21 — özne/nesne zamiri
  G[21] = () => {
    return err(21,[
      {plain:withLead("The "+rnd(["teacher","manager","director","committee"])+" gave ")}, {choice:"A",text:rnd(["the students","my colleague","the new staff"]), why:"Fiilin nesnesi; doğru."},
      {plain:" and "}, {choice:"B",text:"I", why:"HATA: fiilin nesnesi konumunda nesne zamiri gerekir → 'me'.", error:true, correction:"'I' → 'me'"},
      {plain:" extra "}, {choice:"C",text:rnd(["time","support","funding"]), why:"İsim; doğru."},
      {plain:" to finish the "}, {choice:"D",text:rnd(["task","report","project"]), why:"İsim; doğru."}
    ], `'I' → 'me'. Fiilin nesnesi konumunda nesne zamiri (me) kullanılır.`);
  };

  // Skill 22 — iyelik (its / it's)
  G[22] = () => {
    const s=rnd(["The company","The firm","The agency","The university","The team"]);
    return err(22,[
      {plain:withLead(s+" ")}, {choice:"A",text:rnd(["increased","expanded","improved","reduced"]), why:"Fiil; doğru."},
      {plain:" "}, {choice:"B",text:"it's", why:"HATA: 'it's' = 'it is'. İyelik için kesmesiz 'its' gerekir.", error:true, correction:"'it's' → 'its'"},
      {plain:" "}, {choice:"C",text:rnd(["profits","sales","output","staff"]), why:"İsim; doğru."},
      {plain:" last "}, {choice:"D",text:rnd(["quarter","year","season"]), why:"Zaman ifadesi; doğru."}
    ], `'it's' → 'its'. 'its' iyelik sıfatıdır; 'it's' ise 'it is' demektir.`);
  };

  // Skill 23 — zamir referansı
  G[23] = () => {
    const sing=rnd(["student","employee","researcher","citizen","traveler","applicant","customer","driver","patient","member"]);
    const cond=rnd(["misses a deadline","has a question","needs assistance","makes an error","finishes early","loses a document"]);
    return err(23,[
      {plain:rnd(["When a ","If a ","Whenever a ","Each time a ","Once a "])}, {choice:"A",text:sing, why:"TEKİL gönderim; zamir de tekil olmalı."},
      {plain:" "+cond+", "}, {choice:"B",text:"they", why:"HATA: tekil '"+sing+"' ile uyumsuz çoğul zamir → 'he or she'.", error:true, correction:"'they' → 'he or she'"},
      {plain:" should "}, {choice:"C",text:rnd(["contact","inform","notify","email","call"]), why:"Modal sonrası yalın fiil; doğru."},
      {plain:" the "}, {choice:"D",text:rnd(["instructor","supervisor","office","manager","desk"]), why:"İsim; doğru."}
    ], `'they' → 'he or she'. Zamir, gönderdiği tekil isim ('${sing}') ile uyumlu olmalı.`);
  };

  // Skill 24 — sıfat / zarf
  G[24] = () => {
    const p=rnd(ADJpair), s=rnd(SUBJ_P), o=rnd(["task","project","report","design"]);
    return err(24,[
      {plain:withLead(cap(s)+" ")}, {choice:"A",text:rnd(["completed","finished","handled","performed"]), why:"Fiil; doğru kullanılmış."},
      {plain:" the "}, {choice:"B",text:rnd(ADJ), why:"İsmi ("+o+") niteleyen sıfat; doğru."},
      {plain:" "+o+" "}, {choice:"C",text:p.adj, why:"HATA: fiili niteliyor → zarf olmalı → '"+p.adv+"'.", error:true, correction:"'"+p.adj+"' → '"+p.adv+"'"},
      {plain:" and "}, {choice:"D",text:rnd(["efficiently","precisely","early"]), why:"Fiili niteleyen zarf; doğru."}
    ], `'${p.adj}' → '${p.adv}'. Fiili niteleyen sözcük zarf olmalıdır.`);
  };

  // Skill 25 — linking verb + sıfat
  G[25] = () => {
    const p=rnd(ADJpair);
    const lv=rnd(["seems","sounds","appears","remains","looks","becomes"]);
    const s=rnd(["The proposal","The plan","The result","The method","The solution"]);
    return err(25,[
      {plain:withLead(s+" ")}, {choice:"A",text:lv, why:"Linking verb; ardından özneyi niteleyen SIFAT gelir."},
      {plain:" "}, {choice:"B",text:p.adv, why:"HATA: linking verb sonrası sıfat gelir (zarf değil) → '"+p.adj+"'.", error:true, correction:"'"+p.adv+"' → '"+p.adj+"'"},
      {plain:" to "}, {choice:"C",text:rnd(["most experts","the committee","the team"]), why:"Edat öbeği; doğru."},
      {plain:" after the "}, {choice:"D",text:rnd(["review","analysis","meeting"]), why:"İsim; doğru."}
    ], `'${p.adv}' → '${p.adj}'. Linking verb'lerden (${lv}) sonra sıfat kullanılır.`);
  };

  // Skill 26 — Karşılaştırma (Comparative & Superlative)
  const CMP_S = [
    {a:"big",c:"bigger",s:"biggest"},{a:"long",c:"longer",s:"longest"},{a:"small",c:"smaller",s:"smallest"},
    {a:"fast",c:"faster",s:"fastest"},{a:"old",c:"older",s:"oldest"},{a:"high",c:"higher",s:"highest"},
    {a:"cheap",c:"cheaper",s:"cheapest"},{a:"strong",c:"stronger",s:"strongest"},{a:"warm",c:"warmer",s:"warmest"},
    {a:"hard",c:"harder",s:"hardest"},{a:"deep",c:"deeper",s:"deepest"},{a:"tall",c:"taller",s:"tallest"},
    {a:"short",c:"shorter",s:"shortest"},{a:"light",c:"lighter",s:"lightest"}];
  const CMP_L = ["expensive","important","difficult","popular","efficient","useful","valuable","modern","famous","reliable"];
  G[26] = () => {
    const subj=rnd(["The new model","This bridge","The second test","Her latest book","The express train",
      "His new car","The summer course","The modern wing","This laptop","The northern route"]);
    if (Math.random()<0.6){ // comparative (… than …)
      const obj=rnd(["the old one","the previous version","the first one","the others","last year's model","the rest"]);
      if (Math.random()<0.5){ const w=rnd(CMP_S);
        return mc(26, `${subj} is ___ than ${obj}.`,
          {t:w.c, why:"Kısa sıfat + -er, ardından 'than' (comparative)."},
          [{t:"more "+w.a, why:"Çift karşılaştırma; kısa sıfatta sadece -er gelir, 'more' eklenmez."},
           {t:w.s, why:"Superlatif (en); 'than' ile karşılaştırmada -er gerekir."},
           {t:"as "+w.a, why:"'as ... as' yapısı; 'than' ile birlikte kullanılmaz."}],
          `'than' ile karşılaştırma → "${w.c}".`);
      } else { const a=rnd(CMP_L);
        return mc(26, `${subj} is ___ than ${obj}.`,
          {t:"more "+a, why:"Uzun sıfat: 'more' + sıfat, ardından 'than'."},
          [{t:a+"er", why:"Uzun sıfata -er eklenmez; 'more' gelir."},
           {t:"most "+a, why:"Superlatif; karşılaştırmada 'more ... than' gerekir."},
           {t:"as "+a, why:"'as ... as' yapısı; 'than' ile kullanılmaz."}],
          `Uzun sıfat + 'than' → "more ${a}".`);
      }
    } else { // superlative (the … in …)
      const place=rnd(["in the city","in the series","in the region","of all","in the museum","on the market"]);
      if (Math.random()<0.5){ const w=rnd(CMP_S);
        return mc(26, `It is the ___ ${place}.`,
          {t:w.s, why:"Kısa sıfat superlatifi: -est, başında 'the'."},
          [{t:w.c, why:"Comparative (-er); 'the ... in' yapısında superlatif gerekir."},
           {t:"most "+w.a, why:"Kısa sıfatta 'most' kullanılmaz; -est gelir."},
           {t:"more "+w.a, why:"Comparative biçimi; superlatif gerekiyordu."}],
          `'the ... ${place}' → superlatif "${w.s}".`);
      } else { const a=rnd(CMP_L);
        return mc(26, `It is the ___ ${place}.`,
          {t:"most "+a, why:"Uzun sıfat superlatifi: 'most' + sıfat."},
          [{t:a+"est", why:"Uzun sıfata -est eklenmez; 'most' gelir."},
           {t:"more "+a, why:"Comparative; superlatif gerekiyordu."},
           {t:"the most "+a+"est", why:"Çift superlatif; sadece 'most '+sıfat yeterli."}],
          `Uzun sıfat superlatifi → "most ${a}".`);
      }
    }
  };

  // Skill 27 — Devrik yapı (Inversion: olumsuz zarf + yardımcı fiil + özne)
  G[27] = () => {
    const neg=rnd(["Rarely","Seldom","Never","Hardly ever","Not often","Only rarely"]);
    const subj=rnd(["the students","the workers","the players","the guests","the members","the visitors","the engineers","the doctors"]);
    const vb=rnd(["arrive late","complain openly","agree at first","travel abroad","finish early","respond quickly","work on weekends","make mistakes"]);
    return mc(27, `${neg} ___ ${vb}.`,
      {t:`do ${subj}`, why:"Olumsuz zarfla başlayan cümlede devrik yapı: yardımcı fiil (do) + özne."},
      [{t:`${subj}`, why:"Devrik yapı yok; olumsuz zarftan sonra yardımcı fiil öne gelmeli."},
       {t:`${subj} do`, why:"Sıralama yanlış; 'do' özneden ÖNCE gelmeli."},
       {t:`does ${subj}`, why:`Özne çoğul (${subj}) → 'do', 'does' değil.`}],
      `Olumsuz zarf (${neg}) + devrik yapı → "do ${subj}".`);
  };

  // Skill 28 — Koşul cümleleri (Conditionals: if + were/had)
  G[28] = () => {
    if (Math.random()<0.5){ // type 2: if + were
      const s=rnd(["I","she","he","the manager","the city","your plan"]);
      const comp=rnd(["the director","in charge","larger","ready on time","more flexible","responsible for it"]);
      const res=rnd(["things would change","we would start now","it would be easier","they would agree","the team would benefit"]);
      return mc(28, `If ${s} ___ ${comp}, ${res}.`,
        {t:"were", why:"Gerçek dışı (type 2) koşulda 'be' fiili her özneyle 'were' olur."},
        [{t:"was", why:"Resmi koşul cümlesinde gerçek-dışı için 'were' tercih edilir (was değil)."},
         {t:"is", why:"Şimdiki zaman; gerçek-dışı koşulda geçmiş biçim ('were') gerekir."},
         {t:"be", why:"Çekimsiz; 'if' clause'unda 'were' gerekir."}],
        `Gerçek-dışı koşul → "If ${s} were ...".`);
    } else { // type 3: if + had + V3
      const s=rnd(["they","we","she","the team","the company","the students"]);
      const v=rnd(IRR);
      const res=rnd(["they would have succeeded","we would have caught it","the result would have changed","it would have worked"]);
      return mc(28, `If ${s} ___ ${v.pp} it earlier, ${res}.`,
        {t:"had", why:"Geçmişe yönelik gerçek-dışı koşul (type 3): if + had + V3."},
        [{t:"have", why:"'if' clause'unda 'had' gerekir (have değil)."},
         {t:"would have", why:"'would have' sonuç clause'unda olur, 'if' clause'unda değil."},
         {t:"has", why:"type 3 koşulda 'had' + V3 gerekir."}],
        `Geçmiş gerçek-dışı koşul → "If ${s} had ${v.pp} ...".`);
    }
  };

  // Skill 29 — Gerund vs Infinitive
  const GER_V = ["enjoy","avoid","finish","consider","suggest","practice","deny","recommend","miss","quit","admit"];
  const INF_V = ["want","decide","hope","plan","agree","refuse","promise","learn","manage","offer","expect"];
  G[29] = () => {
    const s=rnd(["She","He","The student","The manager","The team","Our teacher","My brother"]);
    const v=rnd(V);
    if (Math.random()<0.5){ const gv=rnd(GER_V);
      return mc(29, `${s} ${gv}s ___ ${rnd(OBJ)}.`,
        {t:v.ing, why:`'${gv}' fiilinden sonra gerund (-ing) gelir.`},
        [{t:"to "+v.b, why:`'${gv}' mastar (to+fiil) almaz; -ing alır.`},
         {t:v.b, why:"Yalın fiil; bu fiilden sonra -ing gerekir."},
         {t:v.ed, why:"Geçmiş biçim; burada gerund (-ing) gerekir."}],
        `'${gv}' + -ing → "${v.ing}".`);
    } else { const iv=rnd(INF_V);
      return mc(29, `${s} ${iv}s ___ ${rnd(OBJ)}.`,
        {t:"to "+v.b, why:`'${iv}' fiilinden sonra mastar (to + fiil) gelir.`},
        [{t:v.ing, why:`'${iv}' gerund (-ing) almaz; mastar alır.`},
         {t:v.b, why:"Yalın fiil; bu fiilden sonra 'to + fiil' gerekir."},
         {t:v.ed, why:"Geçmiş biçim; burada mastar (to + fiil) gerekir."}],
        `'${iv}' + to + fiil → "to ${v.b}".`);
    }
  };

  // Skill 30 — Articles (a / an / the)
  // an: ünlü SES ile başlayanlar (sessiz h dahil) · a: ünsüz ses (/juː/, /w/ dahil)
  const ART_AN = ["apple","umbrella","elephant","idea","engineer","orange","island","hour","honest answer",
    "X-ray","old map","egg","oven","artist","easy exam","unusual request","exciting offer","interesting story",
    "honest mistake","ancient ruin","empty box","open window"];
  const ART_A = ["book","car","table","house","computer","garden","university","uniform","useful tool",
    "European tour","one-way ticket","unique idea","historic site","dog","phone","camera","ticket","library",
    "popular song","global market","small village","heavy box"];
  const ART_THE = ["sun","moon","sky","ocean","world","universe","equator","atmosphere","internet",
    "same problem","first prize","largest planet","tallest tower","oldest building","capital"];
  G[30] = () => {
    if (Math.random()<0.7){ // a vs an
      const useAn=Math.random()<0.5;
      const noun=useAn?rnd(ART_AN):rnd(ART_A);
      const correct=useAn?"an":"a", wrong=useAn?"a":"an";
      const lead=rnd(["She bought","He wrote","They found","We saw","I need","You will need","The shop sold","She drew"]);
      return mc(30, `${lead} ___ ${noun}.`,
        {t:correct, why:`'${noun}' ${useAn?"ünlü sesle":"ünsüz sesle"} başlıyor → "${correct}" (ses kuralı).`},
        [{t:wrong, why:`Ses uyumsuz; '${noun}' için "${correct}" gerekir.`},
         {t:"the", why:"İlk kez bahsediliyor (belirli değil) → 'a/an' gerekir, 'the' değil."},
         {t:"—", why:"Tekil sayılabilir isim makalesiz olmaz; 'a/an' gerekir."}],
        `Ses kuralı: ${useAn?"ünlü ses → an":"ünsüz ses → a"} → "${correct} ${noun}".`);
    } else { // the (tek/belirli)
      const n=rnd(ART_THE);
      return mc(30, `___ ${n} ${rnd(["is well known","was studied","changed over time","is important","remained the same"])}.`,
        {t:"The", why:`Tek/belirli şey ('${n}') → 'the'.`},
        [{t:"A", why:"Belirli/tek bir şey için 'the' gerekir, 'a' değil."},
         {t:"An", why:"Belirli/tek bir şey için 'the' gerekir, 'an' değil."},
         {t:"—", why:"Burada belirli bir şey kastediliyor → 'the' gerekir."}],
        `Tek/belirli isim → "The ${n}".`);
    }
  };

  // ortak: participle formlu fiiller (reduced clauses & passive için)
  const VPP = [
    {b:"publish",ing:"publishing",pp:"published"},{b:"design",ing:"designing",pp:"designed"},
    {b:"build",ing:"building",pp:"built"},{b:"write",ing:"writing",pp:"written"},
    {b:"paint",ing:"painting",pp:"painted"},{b:"complete",ing:"completing",pp:"completed"},
    {b:"record",ing:"recording",pp:"recorded"},{b:"translate",ing:"translating",pp:"translated"},
    {b:"discover",ing:"discovering",pp:"discovered"},{b:"repair",ing:"repairing",pp:"repaired"}];

  // Skill 31 — Reduced clauses (kısaltılmış cümlecikler)
  G[31] = () => {
    const w=rnd(VPP);
    if (Math.random()<0.5){ // PASİF: "The novel, ___ in 1925, ..."  (which was V3 → V3)
      const subj=rnd(["The novel","The bridge","The vaccine","The report","The painting","The law","The theory","The device","The cathedral","The software"]);
      const time=rnd(["in 1925","last year","after long delays","during the war","in a single week","two years ago","by a small team"]);
      const main=rnd(["remains popular","is still used","changed the field","won an award","is widely studied","drew much praise","became a classic"]);
      return mc(31, `${subj}, ___ ${time}, ${main}.`,
        {t:w.pp, why:"Pasif kısaltılmış cümlecik: 'which/that was "+w.pp+"' → sadece V3 ("+w.pp+")."},
        [{t:w.ing, why:"Etken -ing; anlam pasif olduğundan V3 gerekir."},
         {t:"was "+w.pp, why:"Çekimli fiil; cümlede zaten asıl fiil var, ikinci fiil olmaz."},
         {t:"which "+w.ing, why:"Kısaltmada bağlaç+yardımcı fiil DÜŞER; tek başına V3 kalır."}],
        `'which/that was ${w.pp}' kısaltılır → "${w.pp}".`);
    } else { // ETKEN: "The committee, ___ the proposal, ..."  (who was V-ing → V-ing)
      const subj=rnd(["The committee","The author","The team","The researcher","The architect","The engineer","The student","The board"]);
      const obj=rnd(["the proposal","the data","the project","the results","the evidence","the design","the survey"]);
      const main=rnd(["made a discovery","asked for changes","reached a conclusion","found an error","won the prize","raised concerns"]);
      return mc(31, `${subj}, ___ ${obj}, ${main}.`,
        {t:w.ing, why:"Etken kısaltılmış cümlecik: 'who/which was "+w.ing+"' → sadece -ing ("+w.ing+")."},
        [{t:w.pp, why:"Pasif V3; burada özne eylemi yapıyor (etken) → -ing gerekir."},
         {t:"who "+w.ing, why:"Kısaltmada bağlaç düşer; tek başına -ing kalır."},
         {t:w.b+"s", why:"Çekimli fiil; cümlede zaten asıl fiil var."}],
        `'who/which was ${w.ing}' kısaltılır → "${w.ing}".`);
    }
  };

  // Skill 32 — Redundancy / Wordiness (gereksiz tekrar)
  const REDUN = [
    {a:"introduced a ", red:"new", b:" innovation", tail:"that changed the market", why:"'innovation' zaten 'yeni' demek; 'new' gereksiz."},
    {a:"decided to ", red:"return", b:" back", tail:"to the office", why:"'return' zaten 'geri dönmek'; 'back' gereksiz.", redIsFirst:true},
    {a:"had to ", red:"repeat", b:" again", tail:"the same steps", why:"'repeat' zaten 'tekrar'; 'again' gereksiz.", redIsFirst:true},
    {a:"reviewed the ", red:"final", b:" outcome", tail:"of the study", why:"'outcome' zaten sonuç; 'final' gereksiz."},
    {a:"studied the ", red:"past", b:" history", tail:"of the city", why:"'history' zaten geçmiş; 'past' gereksiz."},
    {a:"asked them to ", red:"join", b:" together", tail:"for the task", why:"'join' zaten 'birleşmek'; 'together' gereksiz.", redIsFirst:true},
    {a:"was ", red:"completely", b:" finished", tail:"by noon", why:"'finished' zaten tam bitti demek; 'completely' gereksiz.", redIsFirst:true},
    {a:"gathered ", red:"true", b:" facts", tail:"about the case", why:"'facts' zaten doğru bilgi; 'true' gereksiz."},
    {a:"learned the ", red:"basic", b:" fundamentals", tail:"of design", why:"'fundamentals' zaten temel; 'basic' gereksiz."},
    {a:"decided to ", red:"advance", b:" forward", tail:"with the plan", why:"'advance' zaten 'ileri gitmek'; 'forward' gereksiz.", redIsFirst:true}];
  G[32] = () => {
    const r=rnd(REDUN), s=rnd(SUBJ_P);
    // 4 altı çizili: A=red kelimesi (HATA), B,C,D normal
    const second = r.redIsFirst ? r.b.trim() : r.b.trim();
    return err(32,[
      {plain:cap(s)+" "+r.a}, {choice:"A",text:r.red, why:"HATA: "+r.why+" (kaldır).", error:true, correction:"'"+r.red+"' gereksiz → çıkar"},
      {plain:" "}, {choice:"B",text:second, why:"İsim/fiil; doğru kullanılmış."},
      {plain:" "}, {choice:"C",text:r.tail.split(" ")[0], why:"Doğru."},
      {plain:" "+r.tail.split(" ").slice(1).join(" ")+" "}, {choice:"D",text:rnd(["overall","recently","clearly","mainly"]), why:"Zarf; doğru."}
    ], `'${r.red}' gereksiz tekrardır. ${r.why}`);
  };

  // Skill 33 — Word form (isim/fiil/sıfat/zarf)
  const FAM = [
    {n:"success",v:"succeed",adj:"successful",adv:"successfully"},
    {n:"creation",v:"create",adj:"creative",adv:"creatively"},
    {n:"decision",v:"decide",adj:"decisive",adv:"decisively"},
    {n:"production",v:"produce",adj:"productive",adv:"productively"},
    {n:"competition",v:"compete",adj:"competitive",adv:"competitively"},
    {n:"difference",v:"differ",adj:"different",adv:"differently"},
    {n:"analysis",v:"analyze",adj:"analytical",adv:"analytically"},
    {n:"strength",v:"strengthen",adj:"strong",adv:"strongly"},
    {n:"beauty",v:"beautify",adj:"beautiful",adv:"beautifully"},
    {n:"attraction",v:"attract",adj:"attractive",adv:"attractively"}];
  G[33] = () => {
    const fm=rnd(FAM);
    const slot=rnd(["n","adj","adv"]);
    const T=rnd(["company","project","design","method","program","strategy","plan","approach","system","report","team","study"]);
    const frames={
      n:[`The ${T} achieved real ___.`,`Experts praised the ___ of the ${T}.`,`The ${T} showed clear ___.`],
      adj:[`It was a ___ ${T}.`,`They followed a ___ ${T}.`,`The ${T} was highly ___.`],
      adv:[`The ${T} was run ___.`,`The team handled the ${T} ___.`,`The ${T} worked ___.`]};
    const slotName={n:"isim",adj:"sıfat",adv:"zarf"};
    const others={n:["v","adj","adv"],adj:["n","v","adv"],adv:["n","v","adj"]}[slot];
    const tr={n:"isim",v:"fiil",adj:"sıfat",adv:"zarf"};
    return mc(33, rnd(frames[slot]),
      {t:fm[slot], why:`Bu boşluk ${slotName[slot]} ister → "${fm[slot]}".`},
      others.map(o=>({t:fm[o], why:`Bu ${tr[o]} biçimi; burada ${slotName[slot]} gerekir.`})),
      `Doğru sözcük türü ${slotName[slot]} → "${fm[slot]}".`);
  };

  // Skill 34 — Prepositions / idiomatic
  const COLL = [
    {lead:"She is interested",p:"in"},{lead:"The result depends",p:"on"},{lead:"They are proud",p:"of"},
    {lead:"He is good",p:"at"},{lead:"The manager is responsible",p:"for"},{lead:"This is similar",p:"to"},
    {lead:"The copy is different",p:"from"},{lead:"The team is capable",p:"of"},{lead:"The town is famous",p:"for"},
    {lead:"The box is full",p:"of"},{lead:"We must focus",p:"on"},{lead:"They succeeded",p:"in"},
    {lead:"She is afraid",p:"of"},{lead:"The plan is suitable",p:"for"},{lead:"He is aware",p:"of"},
    {lead:"The committee relies",p:"on"},{lead:"The mixture consists",p:"of"},{lead:"She is fond",p:"of"},
    {lead:"They are accustomed",p:"to"},{lead:"He is married",p:"to"}];
  const PREPS=["in","on","at","for","of","to","from","with","about","by"];
  G[34] = () => {
    const c=rnd(COLL);
    const obj=rnd(["modern art","the new method","their results","the project","this field","the outcome",
      "the proposal","the data","her work","the budget","the topic","the design"]);
    const wrong=shuffle(PREPS.filter(p=>p!==c.p)).slice(0,3);
    return mc(34, `${c.lead} ___ ${obj}.`,
      {t:c.p, why:`Bu kalıp '${c.p}' edatıyla kullanılır.`},
      wrong.map(p=>({t:p, why:`Bu kalıpla '${p}' kullanılmaz; doğrusu '${c.p}'.`})),
      `'${c.lead.split(" ").slice(-1)[0]}' + '${c.p}' kalıbı.`);
  };

  // Skill 35 — Causatives (make/have/let + yalın fiil)
  G[35] = () => {
    const caus=rnd(["made","had","let"]);
    const subj=rnd(["The teacher","The manager","Her boss","The coach","The director","His father","The officer"]);
    const obj=rnd(["the students","her assistant","the team","the workers","his brother","the class","the new staff"]);
    const v=rnd(V);
    const rest=rnd(["the report","the exercise","the form","the project","the room","the schedule"]);
    return mc(35, `${subj} ${caus} ${obj} ___ ${rest}.`,
      {t:v.b, why:`make/have/let + nesne + YALIN fiil → "${v.b}".`},
      [{t:"to "+v.b, why:"make/have/let mastar (to) almaz; yalın fiil gerekir."},
       {t:v.ing, why:"-ing değil; bu yapıda yalın fiil gelir."},
       {t:v.ed, why:"Geçmiş biçim değil; yalın fiil gerekir."}],
      `${caus} (causative) + nesne + yalın fiil → "${v.b}".`);
  };

  // Skill 36 — Tense consistency (zaman uyumu)
  G[36] = () => {
    const ctx=rnd(["Last year","Yesterday","In 2019","Last month","A century ago","During the 1990s","Two weeks ago"]);
    const s=rnd(SUBJ_S);
    const vv=shuffle(V.slice()).slice(0,3), [v1,v2,v3]=vv;
    const oo=shuffle(OBJ.slice()).slice(0,3).map(o=>o.replace("the ","")), [o1,o2,o3]=oo;
    return err(36,[
      {plain:ctx+", "+s+" "}, {choice:"A",text:v1.ed, why:"Geçmiş zaman; cümleyle uyumlu, doğru."},
      {plain:" the "+o1+", "}, {choice:"B",text:v2.ed, why:"Geçmiş zaman; doğru."},
      {plain:" the "+o2+", and "}, {choice:"C",text:v3.s, why:"HATA: cümle GEÇMİŞ ("+ctx+"); bu fiil de geçmiş olmalı → '"+v3.ed+"'.", error:true, correction:"'"+v3.s+"' → '"+v3.ed+"'"},
      {plain:" the "}, {choice:"D",text:o3, why:"İsim; doğru."}
    ], `'${v3.s}' → '${v3.ed}'. Cümle geçmiş zamanda (${ctx}); fiiller tutarlı olmalı.`);
  };

  // ---- dışa açılan API ---------------------------------------------------
  // Soruyu CÜMLE bazında tanımlayan anahtar (şık sırası değil, asıl cümle)
  function qKey(q){
    return q.type==="mc"
      ? q.stem
      : q.segments.map(s=>s.text!==undefined?("["+s.text+"]"):s.plain).join("");
  }
  // Bir skill için n adet TAZE, AYNI CÜMLE tekrar etmeyen soru üret
  function forSkill(skill, n){
    if (!G[skill]) return [];
    const out=[], seen=new Set(); let guard=0;
    while(out.length<n && guard<n*60){
      const q=G[skill](); guard++;
      const key=qKey(q);
      if(seen.has(key)) continue;
      seen.add(key); out.push(q);
    }
    return out;
  }
  // n adet, aynı cümleyi tekrarlamadan, verilen skill listesinden üret
  function uniqueFrom(skills, n){
    const out=[], seen=new Set(); let guard=0;
    while(out.length<n && guard<n*80){
      const q=G[rnd(skills)](); guard++;
      const key=qKey(q);
      if(seen.has(key)) continue;
      seen.add(key); out.push(q);
    }
    return out;
  }
  // Karışık sınav seti: 15 Structure + 25 Written, hepsi farklı cümle
  function examSet(){
    return [...uniqueFrom([1,2,3,4,5,6,7,8,9,10,26,27,28,29,30,31,33,34,35],15),
            ...uniqueFrom([11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,32,36],25)];
  }
  function diagnosticSet(n){
    const all=Object.keys(G).map(Number);
    return shuffle(all).slice(0,n).map(k=>G[k]());
  }
  function has(skill){ return !!G[skill]; }
  // tek soru (skill)
  function one(skill){ return G[skill] ? G[skill]() : null; }

  return { forSkill, examSet, diagnosticSet, has, one, _G:G };
})();

if (typeof module!=="undefined") module.exports = { GEN };
