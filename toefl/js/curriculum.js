/* ==========================================================================
   TOEFL Structure & Written Expression — Müfredat verisi
   Kaynak yapı: Longman/Phillips "Green TOEFL Structure" (25 Skill)
   Her skill: kural anlatımı + örnek + soru bankası (mc = boşluk doldurma,
   err = hata bulma). Cevaplar ve açıklamalar editör tarafından doğrulandı.
   ========================================================================== */

const CURRICULUM = {

  // 7 GÜNLÜK PLAN ----------------------------------------------------------
  plan: [
    { day: 1, title: "Cümlenin temeli: Özne & Fiil", skills: [1, 2, 3, 4],
      focus: "Her cümlenin bir öznesi ve bir fiili olmalı. Edat öbekleri ve participle'lar seni yanıltmasın." },
    { day: 2, title: "İki cümleyi birleştirmek: Bağlaçlar", skills: [5, 6, 7, 8],
      focus: "İki clause varsa onları doğru bağlaçla birleştir: coordinate, adverb ve noun clause bağlaçları." },
    { day: 3, title: "Adjective clause'lar", skills: [9, 10],
      focus: "who / which / that ile sıfat cümlecikleri. Bağlaç hem özne olabilir hem olmayabilir." },
    { day: 4, title: "Özne–fiil uyumu (Agreement)", skills: [11, 12, 13],
      focus: "Araya giren öbekler, miktar ifadeleri ve özel kelimelerden sonra fiil tekil mi çoğul mu?" },
    { day: 5, title: "Paralel yapı & Fiil formları", skills: [14, 15, 16, 17, 18],
      focus: "Paralellik (and/or, both…and) ve fiil formları: have+V3, be+Ving/V3, modal+V1." },
    { day: 6, title: "İsimler & Zamirler", skills: [19, 20, 21, 22, 23],
      focus: "Tekil/çoğul, sayılabilen/sayılamayan isimler; özne/nesne zamirleri, iyelik ve referans." },
    { day: 7, title: "Sıfat & Zarf", skills: [24, 25],
      focus: "Sıfat mı zarf mı? Linking verb'lerden sonra sıfat." },
    { day: 8, title: "İleri Konular + Genel Tekrar", skills: [26, 27, 28, 29],
      focus: "Karşılaştırma, devrik yapı, koşul cümleleri, gerund/infinitive. Sonra tam deneme sınavı." }
  ],

  // SKILL'LER --------------------------------------------------------------
  skills: {

    1: {
      title: "Özne ve Fiil (Subjects and Verbs)",
      category: "Structure",
      rule: `<p>İngilizce bir cümlede <b>en az bir özne (subject)</b> ve <b>bir fiil (verb)</b> olmalıdır.
        Structure sorularında en sık karşılaşacağın problem: cümlede özne yok, fiil yok, ya da fazladan özne/fiil var.</p>
        <p>Cümleyi okurken yapman gereken ilk şey: <b>özneyi ve fiili bul.</b></p>
        <div class="ex"><p><b>Örnek:</b> ___ was ringing continuously for hours.</p>
        <p>Fiil var (<i>was ringing</i>) ama özne yok. Doğru cevap <b>The phone</b> — tekil fiille uyumlu tekil bir özne.</p></div>`,
      chart: "Cümlede MUTLAKA bir özne + bir fiil olmalı. İlk iş: özneyi ve fiili bul.",
      questions: [
        { type:"mc", stem:"In the early 1900s, Eastman ___ inexpensive Brownie box cameras.",
          options:["it developed","it was developed","developed","developing"], answer:2,
          explain:"Özne (Eastman) var, fiile ihtiyaç var. 'developed' tek başına fiildir. (A)(B) fazladan 'it' öznesi içerir; (D) tek başına fiil olamaz." },
        { type:"mc", stem:"___ every morning and every evening.",
          options:["The delivery of newspapers","Newspapers are delivered","Newspaper delivery","Delivering newspapers"], answer:1,
          explain:"Cümlenin fiili yok. 'are delivered' tam bir fiildir; diğerleri isim öbeği, fiil değil." },
        { type:"mc", stem:"The plane ___ landing at the airport in five minutes.",
          options:["it is","it really is","is descending","will be"], answer:3,
          explain:"'landing' tek başına fiil değil; 'be' formuna ihtiyaç var. 'will be landing' tam fiildir. (A)(B) fazladan özne; (C) gereksiz ikinci fiil." },
        { type:"mc", stem:"Mark Twain ___ the years after the Civil War the \"Gilded Age.\"",
          options:["called","calling","he called","his calls"], answer:0,
          explain:"Özne var (Mark Twain), fiil lazım. 'called' fiildir. (C) fazladan özne, (B)(D) fiil değil." },
        { type:"mc", stem:"Tundra plants ___ close to the ground in the short Arctic summer.",
          options:["growing","they grow","grow","to grow"], answer:2,
          explain:"Özne 'Tundra plants', fiil lazım. 'grow' fiildir; diğerleri ya fiil değil ya fazladan özne içerir." }
      ]
    },

    2: {
      title: "Edatların Nesnesi (Objects of Prepositions)",
      category: "Structure",
      rule: `<p>Bir edattan (in, at, of, to, by, on, behind…) sonra gelen isim/zamir, o edatın <b>nesnesidir</b>
        ve <b>özne olamaz.</b> TOEFL bu nesneyi sana özne gibi gösterip kandırmaya çalışır.</p>
        <div class="ex"><p>The trip <u>(to the island)</u> <u>(on Saturday)</u> will last <u>(for three hours)</u>.</p>
        <p><b>Örnek:</b> To Mike ___ was a big surprise. → Mike, 'to'nun nesnesi; özne değil. Doğru: <b>the party</b>.</p></div>`,
      chart: "Edattan sonraki isim = edatın nesnesi, ASLA özne değildir. Önce edat öbeklerini bir kenara ayır.",
      questions: [
        { type:"mc", stem:"To Mike ___ was a big surprise.",
          options:["really","the party","funny","when"], answer:1,
          explain:"'Mike' edatın (to) nesnesi, özne olamaz. Fiil 'was' için özne lazım: 'the party'." },
        { type:"mc", stem:"The large carotid artery ___ to the main parts of the brain.",
          options:["carrying blood","blood is carried","carries blood","blood carries"], answer:2,
          explain:"Özne 'artery' zaten var; fiil lazım. 'carries blood' uygundur. Diğerleri fazladan özne ekler ya da fiil değildir." },
        { type:"mc", stem:"Between 1725 and 1750, New England witnessed an increase in the specialization of ___.",
          options:["occupations","occupies","they occupied","it occupied them"], answer:0,
          explain:"'of' edatından sonra nesne (isim) gelmeli: 'occupations'. Diğerleri fiil veya cümlecik." },
        { type:"mc", stem:"In the jewelry box ___ a new battery.",
          options:["the watch needs","needs","it needs","the watch"], answer:0,
          explain:"Baştaki 'In the jewelry box' edat öbeği; cümlenin hâlâ öznesi+fiili lazım: 'the watch needs'." },
        { type:"err", segments:[
            {plain:"During "},{choice:"A",text:"the meeting"},{plain:" in the "},{choice:"B",text:"office"},
            {plain:" "},{choice:"C",text:"discussed"},{plain:" the "},{choice:"D",text:"schedule"},{plain:"."}],
          answer:"C", correction:"Cümlenin öznesi yok — 'the meeting' ve 'the office' edat öbeklerinin nesnesi. 'discussed' fiilinin öznesi eksik (örn. 'we discussed')." }
      ]
    },

    3: {
      title: "Present Participle (-ing)",
      category: "Structure",
      rule: `<p>Present participle = fiilin <b>-ing</b> hâli. İki işlevi vardır:
        <b>(1) fiilin parçası</b> (yanında <i>be</i> varsa) veya <b>(2) sıfat</b> (yanında <i>be</i> yoksa).</p>
        <div class="ex"><p>The train <b>is arriving</b> now. → fiil (is var)</p>
        <p>The train <b>arriving</b> now is late. → sıfat (be yok, asıl fiil 'is')</p></div>
        <p>Tuzak: -ing'i fiil sanıp fazladan 'is/was' eklemek. Cümlede zaten asıl fiil varsa, -ing sıfattır.</p>`,
      chart: "-ing → 'be' ile birlikteyse FİİL; tek başınaysa SIFAT. Cümlede başka fiil varsa -ing genelde sıfattır.",
      questions: [
        { type:"mc", stem:"The film ___ appearing at the local theater is my favorite.",
          options:["now","is","it","was"], answer:0,
          explain:"'appearing' burada sıfat (asıl fiil 'is' zaten var). Fazladan fiil (is/was) eklenemez. 'now' uygundur." },
        { type:"mc", stem:"The leaves ___ on the trees turned brown in autumn.",
          options:["are growing","they grow","growing","grow"], answer:2,
          explain:"Asıl fiil 'turned' var. Özneyi niteleyen participle sıfat lazım: 'growing'. Başka fiil eklenemez." },
        { type:"mc", stem:"The chef ___ the meal added too much salt.",
          options:["was preparing","preparing","is preparing","prepares"], answer:1,
          explain:"Asıl fiil 'added' var; özneyi niteleyen sıfat lazım: 'preparing'. Fiil eklersen iki fiil olur." },
        { type:"err", segments:[
            {plain:"The scientist "},{choice:"A",text:"conducting"},{plain:" the experiment "},{choice:"B",text:"is recording"},
            {plain:" the "},{choice:"C",text:"results"},{plain:" "},{choice:"D",text:"careful"},{plain:"."}],
          answer:"D", correction:"'careful' → 'carefully' (fiili niteler, zarf olmalı). Participle yapısı doğru: 'conducting' sıfat, 'is recording' fiil." }
      ]
    },

    4: {
      title: "Past Participle (V3)",
      category: "Structure",
      rule: `<p>Past participle (genelde <b>-ed</b> veya düzensiz V3 biçimi) iki işlev görür:
        <b>(1) pasif fiilin parçası</b> (yanında <i>be</i> veya <i>have</i> varsa) veya <b>(2) sıfat.</b></p>
        <div class="ex"><p>The project <b>was finished</b> early. → fiil (was var)</p>
        <p>The project <b>finished</b> early received praise. → sıfat (be/have yok)</p></div>
        <p>Tuzak: -ed biçimini geçmiş zaman fiili mi yoksa participle sıfat mı diye karıştırmak.</p>`,
      chart: "V3 → be/have ile FİİL; tek başınaysa SIFAT. Düzensiz fiillerin V3'ünü ezberle (broken, written, hidden…).",
      questions: [
        { type:"mc", stem:"The houses ___ in that area were built a century ago.",
          options:["located","are located","they located","locate"], answer:0,
          explain:"Asıl fiil 'were built' var. Özneyi niteleyen sıfat lazım: 'located'. Fiil eklenemez." },
        { type:"mc", stem:"Genes control all of the physical ___ we inherit.",
          options:["that traits","that are traits","traits that","traits are that"], answer:2,
          explain:"'physical traits that we inherit' — 'traits that' isim + adjective clause başlangıcı doğru sıralamadır." },
        { type:"mc", stem:"The documents ___ by the committee will be published soon.",
          options:["reviewing","review","reviewed","are reviewed"], answer:2,
          explain:"Asıl fiil 'will be published' var. Özneyi niteleyen pasif sıfat: 'reviewed' (by the committee)." },
        { type:"err", segments:[
            {plain:"The "},{choice:"A",text:"stolen"},{plain:" paintings "},{choice:"B",text:"was"},{plain:" finally "},
            {choice:"C",text:"recovered"},{plain:" by the "},{choice:"D",text:"police"},{plain:"."}],
          answer:"B", correction:"'was' → 'were' (özne 'paintings' çoğul). 'stolen' ve 'recovered' participle olarak doğru." }
      ]
    },

    5: {
      title: "Coordinate Bağlaçlar (and, but, or, so)",
      category: "Structure",
      rule: `<p>İki clause'u (özne+fiil içeren grup) birleştirmenin bir yolu: aralarına <b>and, but, or, so</b>
        ve bir <b>virgül</b> koymak.</p>
        <div class="ex"><p>The sun was shining<b>, and</b> the sky was blue.</p>
        <p>It was raining<b>, so</b> I took my umbrella.</p></div>
        <p>Yapı: <code>S V , (and/but/or/so) S V</code>. then, later, as a result bağlaç DEĞİLDİR.</p>`,
      chart: "İki clause → ', and/but/or/so' ile bağlanır. 'then, also, therefore' bağlaç değildir (clause bağlayamaz).",
      questions: [
        { type:"mc", stem:"I forgot my coat, ___ I got very cold.",
          options:["then","so","later","as a result"], answer:1,
          explain:"İki clause'u birleştiren bir coordinate bağlaç lazım. 'so' bağlaçtır; then/later/as a result bağlaç değildir." },
        { type:"mc", stem:"Some early batteries used concentrated nitric acid, ___ gave off poisonous fumes.",
          options:["they","then they","but they","and they had"], answer:2,
          explain:"İki clause arasında bağlaç + özne lazım. 'but they' doğru: bağlaç (but) + özne (they)." },
        { type:"mc", stem:"The water was cold, ___ the children swam anyway.",
          options:["but","however","despite","although"], answer:0,
          explain:"Coordinate bağlaç gerekli: 'but'. 'however' bağlaç değil; 'although/despite' farklı yapı kurar." },
        { type:"err", segments:[
            {plain:"The storm "},{choice:"A",text:"damaged"},{plain:" the roof, "},{choice:"B",text:"then"},
            {plain:" the family "},{choice:"C",text:"had to"},{plain:" make expensive "},{choice:"D",text:"repairs"},{plain:"."}],
          answer:"B", correction:"'then' iki clause'u bağlayamaz; 'so' veya 'and' olmalı." }
      ]
    },

    6: {
      title: "Adverb Clause Bağlaçları (because, when, although…)",
      category: "Structure",
      rule: `<p>Adverb clause, bir clause'u diğerine bağlar. İki kalıp vardır:</p>
        <div class="ex"><p>He is tired <b>because</b> he has been working hard. → ortada bağlaç, virgül YOK</p>
        <p><b>Because</b> he has been working hard, he is tired. → başta bağlaç, ortada virgül VAR</p></div>
        <p>Yaygın bağlaçlar — Zaman: after, before, when, while, until, since · Sebep: because, since ·
        Şart: if, whether · Zıtlık: although, even though, though, while.</p>`,
      chart: "Adverb bağlaç başta → ortada virgül. Ortada → virgül yok. Bağlaç + 2 ayrı clause olmalı.",
      questions: [
        { type:"mc", stem:"___ arrived at the library, he started to work immediately.",
          options:["The student","When","He","After the student"], answer:3,
          explain:"'arrived' fiiline özne + iki clause'u bağlayan bağlaç lazım. 'After the student' = bağlaç (after) + özne (student)." },
        { type:"mc", stem:"Prior to the discovery of anesthetics in 1846, surgery was done ___ was still conscious.",
          options:["while the patient","the patient felt","during the patient's","while patiently"], answer:0,
          explain:"İkinci clause'a (was still conscious) bağlaç + özne lazım: 'while the patient'." },
        { type:"mc", stem:"___ the weather was bad, the flight was not cancelled.",
          options:["Despite","Even though","Because of","However"], answer:1,
          explain:"İki clause'u bağlayan zıtlık bağlacı: 'Even though'. Despite/Because of isimle kullanılır; however bağlaç değil." },
        { type:"err", segments:[
            {plain:"Although "},{choice:"A",text:"the medicine"},{plain:" was expensive, "},{choice:"B",text:"but"},
            {plain:" the patient "},{choice:"C",text:"decided"},{plain:" to "},{choice:"D",text:"buy"},{plain:" it."}],
          answer:"B", correction:"'Although' ve 'but' aynı cümlede birlikte kullanılmaz; 'but' atılmalı." }
      ]
    },

    7: {
      title: "Noun Clause Bağlaçları (what, that, whether…)",
      category: "Structure",
      rule: `<p>Noun clause, isim görevi gören bir clause'tur; bir fiilin ya da edatın <b>nesnesi</b> olarak kullanılır.</p>
        <div class="ex"><p>I don't know <b>why he said such things</b>. → fiilin (know) nesnesi</p>
        <p>I am thinking about <b>why he said such things</b>. → edatın (about) nesnesi</p></div>
        <p>Bağlaçlar: what, when, where, why, how, whether, if, that. Yapı: <code>S V (bağlaç) S V</code>.</p>`,
      chart: "Noun clause = isim gibi davranan clause. Fiil/edattan sonra bağlaç + (S V) gelir.",
      questions: [
        { type:"mc", stem:"The citizens worry about ___ is doing.",
          options:["what the government","the government","it","is what the government"], answer:0,
          explain:"'is doing' fiiline özne + bağlaç lazım. 'what the government' = bağlaç (what) + özne (government)." },
        { type:"mc", stem:"Researchers have begun studying what ___ is on human circadian rhythms.",
          options:["it is the effect of light","the light affects","in affecting the light","the effect of light"], answer:3,
          explain:"'what ... is' yapısında özne lazım: 'the effect of light'. Diğerleri fazladan özne/yanlış yapı." },
        { type:"mc", stem:"Scientists cannot explain ___ the universe began.",
          options:["how","what","which","whom"], answer:0,
          explain:"Noun clause bağlacı olarak anlam ve yapı 'how' ister: 'how the universe began'." }
      ]
    },

    8: {
      title: "Noun Clause Bağlacı = Özne",
      category: "Structure",
      rule: `<p>Bazen noun clause bağlacı (what, who, whatever…) aynı zamanda kendi clause'unun <b>öznesidir</b>.
        Bu durumda bağlaçtan hemen sonra fiil gelir (araya ikinci bir özne girmez).</p>
        <div class="ex"><p>I do not understand <b>what</b> happened. → 'what' hem bağlaç hem özne; 'happened' fiili</p></div>
        <p>Tuzak: 'what the happened' gibi araya gereksiz özne koymak yanlıştır.</p>`,
      chart: "Bağlaç (what/who/whatever) aynı anda özne olabilir → hemen ardından FİİL gelir.",
      questions: [
        { type:"mc", stem:"The drastic decline of the beaver helps to illustrate what ___ to the ecosystems.",
          options:["happening","the happening","has happened","about happening"], answer:2,
          explain:"'what' burada hem bağlaç hem özne; ardından tam fiil lazım: 'has happened'." },
        { type:"mc", stem:"___ caused the accident remains unknown.",
          options:["What","It","That it","Which"], answer:0,
          explain:"Cümlenin öznesi olan bir noun clause lazım; 'What caused the accident' tam bir özne clause'udur." },
        { type:"mc", stem:"Nobody knows ___ will win the election.",
          options:["who","whom","which one of","what"], answer:0,
          explain:"Bağlaç hem özne hem fiilin (will win) öznesi: 'who'." }
      ]
    },

    9: {
      title: "Adjective Clause Bağlaçları (who, which, that)",
      category: "Structure",
      rule: `<p>Adjective clause bir ismi niteler ve <b>who, which, that, whom</b> ile başlar.
        Bağlaç, nitelediği ismin hemen <b>arkasından</b> gelir.</p>
        <div class="ex"><p>The book <b>that</b> I read was interesting.</p>
        <p>The woman <b>who</b> called is my teacher.</p></div>
        <p>Burada bağlaç clause içinde <b>nesne</b> görevindedir, bu yüzden ardından bir özne + fiil gelir.</p>`,
      chart: "İsim + (who/which/that) + S V. Bağlaç clause'un nesnesiyse ardından özne gelir.",
      questions: [
        { type:"mc", stem:"The Brooklyn Bridge, ___, took thirteen years to complete.",
          options:["in New York","is in New York","it is in New York","which New York"], answer:0,
          explain:"Araya giren bir niteleme öbeği lazım. 'in New York' uygundur; diğerleri fazladan/yanlış fiil-özne yapısı kurar." },
        { type:"mc", stem:"A yacht is steered with a rudder, ___ the flow of water that passes the hull.",
          options:["which deflecting","deflects","it deflects","which deflects"], answer:3,
          explain:"'rudder'ı niteleyen adjective clause: 'which deflects' = bağlaç + fiil." },
        { type:"mc", stem:"The scientist ___ discovered the vaccine won a prize.",
          options:["who","which","whom","what"], answer:0,
          explain:"İnsan için ve clause'un öznesi olan bağlaç: 'who'." }
      ]
    },

    10: {
      title: "Adjective Clause Bağlacı = Özne",
      category: "Structure",
      rule: `<p>Adjective clause bağlacı (who, which, that) aynı zamanda clause'un <b>öznesi</b> olabilir.
        Bu durumda bağlaçtan hemen sonra <b>fiil</b> gelir.</p>
        <div class="ex"><p>The man <b>who</b> is talking is my uncle. → 'who' özne, 'is talking' fiil</p></div>
        <p>Tuzak: 'who he is talking' gibi fazladan özne koymak yanlıştır.</p>`,
      chart: "İsim + (who/which/that) + FİİL. Bağlaç özne olunca araya başka özne girmez.",
      questions: [
        { type:"mc", stem:"Eugene Debs ran for the presidency of the United States five times, ___ was never elected.",
          options:["he","but he","who he","but he was"], answer:1,
          explain:"İki clause arası: bağlaç + özne lazım: 'but he'. ('who he' fazladan özne olur.)" },
        { type:"mc", stem:"Indigo can be extracted from a plant ___ grows in warm climates.",
          options:["it","which it","that","what"], answer:2,
          explain:"'plant'ı niteleyen, clause'un öznesi olan bağlaç: 'that' (ardından fiil 'grows')." },
        { type:"err", segments:[
            {plain:"The students "},{choice:"A",text:"who"},{plain:" "},{choice:"B",text:"they"},{plain:" "},
            {choice:"C",text:"completed"},{plain:" the course received a "},{choice:"D",text:"certificate"},{plain:"."}],
          answer:"B", correction:"'who' zaten özne; fazladan 'they' yanlış. 'who completed' yeterli." }
      ]
    },

    11: {
      title: "Araya Giren Öbeklerle Uyum",
      category: "Written Expression",
      rule: `<p>Özne ile fiil arasına edat öbeği veya bir başka öbek girince, fiil <b>asıl özneyle</b> uyumlu olmalı —
        araya giren öbekteki isimle değil.</p>
        <div class="ex"><p>The <b>box</b> of chocolates <b>is</b> on the table. (box → is, chocolates değil)</p>
        <p>The <b>students</b> in the class <b>are</b> ready. (students → are)</p></div>`,
      chart: "Araya giren edat öbeğini parantezle. Fiil ASIL özneyle uyumlu olmalı, araya gireni yok say.",
      questions: [
        { type:"err", segments:[
            {plain:"The "},{choice:"A",text:"quality"},{plain:" of the "},{choice:"B",text:"products"},
            {plain:" "},{choice:"C",text:"have"},{plain:" "},{choice:"D",text:"improved"},{plain:"."}],
          answer:"C", correction:"'have' → 'has'. Asıl özne 'quality' (tekil); 'products' edatın nesnesi." },
        { type:"err", segments:[
            {plain:"The "},{choice:"A",text:"boxes"},{plain:" in the "},{choice:"B",text:"warehouse"},
            {plain:" "},{choice:"C",text:"was"},{plain:" "},{choice:"D",text:"damaged"},{plain:"."}],
          answer:"C", correction:"'was' → 'were'. Asıl özne 'boxes' (çoğul)." },
        { type:"mc", stem:"The list of students who passed the exam ___ posted on the board.",
          options:["are","were","is","have been"], answer:2,
          explain:"Asıl özne 'list' (tekil) → 'is'. 'students' araya giren öbeğin parçası." }
      ]
    },

    12: {
      title: "Miktar İfadelerinden Sonra Uyum",
      category: "Written Expression",
      rule: `<p>Özne bir miktar ifadesiyse, fiilin tekil/çoğulluğu <b>'of'tan sonraki isme</b> göre belirlenir.</p>
        <div class="ex"><p><b>All of the book</b> is… (book tekil → is) · <b>All of the books</b> are… (books çoğul → are)</p>
        <p>Aynı kural: most of, some of, half of, a part of, percent of…</p></div>`,
      chart: "all/most/some/half of + isim → fiil, 'of'tan sonraki isme göre tekil/çoğul olur.",
      questions: [
        { type:"err", segments:[
            {plain:"Most "},{choice:"A",text:"of"},{plain:" the "},{choice:"B",text:"information"},
            {plain:" "},{choice:"C",text:"were"},{plain:" "},{choice:"D",text:"accurate"},{plain:"."}],
          answer:"C", correction:"'were' → 'was'. 'of'tan sonraki isim 'information' sayılamaz/tekil." },
        { type:"mc", stem:"Half of the students ___ already submitted their projects.",
          options:["has","is","have","was"], answer:2,
          explain:"'of'tan sonra 'students' çoğul → 'have'." },
        { type:"mc", stem:"Twenty percent of the land ___ used for farming.",
          options:["are","were","is","have"], answer:2,
          explain:"'land' tekil/sayılamaz → 'is'." }
      ]
    },

    13: {
      title: "Belirli Kelimelerden Sonra Uyum",
      category: "Written Expression",
      rule: `<p>Bazı kelimeler dilbilgisel olarak <b>tekildir</b> ve tekil fiil alır:
        <i>each, every, anybody, everyone, nobody, something, either, neither…</i></p>
        <div class="ex"><p><b>Each</b> of the students <b>has</b> a book.</p>
        <p><b>Everybody</b> <b>is</b> here.</p></div>`,
      chart: "each, every, -body, -one, -thing, either, neither → TEKİL fiil alır.",
      questions: [
        { type:"err", segments:[
            {plain:"Each "},{choice:"A",text:"of"},{plain:" the "},{choice:"B",text:"countries"},
            {plain:" "},{choice:"C",text:"have"},{plain:" its own "},{choice:"D",text:"flag"},{plain:"."}],
          answer:"C", correction:"'have' → 'has'. 'Each' tekildir." },
        { type:"mc", stem:"Every student in the advanced classes ___ required to write a thesis.",
          options:["are","were","is","have been"], answer:2,
          explain:"'Every' tekil → 'is'." },
        { type:"mc", stem:"Neither of the proposals ___ approved by the committee.",
          options:["were","are","was","have been"], answer:2,
          explain:"'Neither' tekil → 'was'." }
      ]
    },

    14: {
      title: "Paralel Yapı: and / but / or",
      category: "Written Expression",
      rule: `<p>and, but, or ile bağlanan öğeler <b>aynı dilbilgisel biçimde</b> olmalıdır (paralellik).</p>
        <div class="ex"><p>She likes <b>swimming, running, and cycling</b>. (hepsi -ing)</p>
        <p>The job is <b>interesting but difficult</b>. (sıfat + sıfat)</p></div>
        <p>Yanlış: She likes swimming, running, and to cycle.</p>`,
      chart: "and/but/or'un iki yanı aynı biçimde olmalı: isim+isim, sıfat+sıfat, -ing+-ing, mastar+mastar.",
      questions: [
        { type:"err", segments:[
            {plain:"The course teaches students to read, "},{choice:"A",text:"to write"},{plain:", and "},
            {choice:"B",text:"speaking"},{plain:" a "},{choice:"C",text:"foreign"},{plain:" "},{choice:"D",text:"language"},{plain:"."}],
          answer:"B", correction:"'speaking' → 'to speak'. Paralellik: to read, to write, to speak." },
        { type:"mc", stem:"The new policy is efficient, practical, and ___.",
          options:["it saves money","economical","saving money","to economize"], answer:1,
          explain:"Paralellik için sıfat lazım: 'economical' (efficient, practical ile aynı biçim)." },
        { type:"err", segments:[
            {plain:"He spent the weekend "},{choice:"A",text:"cleaning"},{plain:" the house, "},
            {choice:"B",text:"to do"},{plain:" the laundry, and "},{choice:"C",text:"cooking"},
            {plain:" "},{choice:"D",text:"meals"},{plain:"."}],
          answer:"B", correction:"'to do' → 'doing'. Paralellik: cleaning, doing, cooking." }
      ]
    },

    15: {
      title: "Paralel Yapı: both…and / either…or / not only…but also",
      category: "Written Expression",
      rule: `<p>İkili bağlaçların iki yanı da <b>paralel</b> olmalıdır:
        <b>both A and B · either A or B · neither A nor B · not only A but also B.</b></p>
        <div class="ex"><p>She is <b>both intelligent and hardworking</b>.</p>
        <p>You can <b>either stay or go</b>.</p></div>`,
      chart: "both…and / either…or / neither…nor / not only…but also → A ve B aynı biçimde olmalı.",
      questions: [
        { type:"err", segments:[
            {plain:"The festival attracts both "},{choice:"A",text:"tourists"},{plain:" "},{choice:"B",text:"and"},
            {plain:" people who "},{choice:"C",text:"living"},{plain:" "},{choice:"D",text:"locally"},{plain:"."}],
          answer:"C", correction:"'living' → 'live' (who live locally). 'both tourists and locals' paralelliği bozulmuş." },
        { type:"mc", stem:"The program is designed not only to educate ___.",
          options:["but entertaining also","but also to entertain","but also entertaining","also to entertain"], answer:1,
          explain:"'not only to educate but also to entertain' — iki yan da mastar (to + V1)." },
        { type:"mc", stem:"Neither the manager ___ the employees were satisfied with the decision.",
          options:["or","and","nor","but"], answer:2,
          explain:"'neither … nor' kalıbı: 'nor'." }
      ]
    },

    16: {
      title: "have + Past Participle",
      category: "Written Expression",
      rule: `<p>'have/has/had'tan sonra fiil mutlaka <b>past participle (V3)</b> biçiminde olmalıdır.</p>
        <div class="ex"><p>She has <b>written</b> the report. (write → written)</p>
        <p>They have <b>gone</b> home. (go → gone)</p></div>
        <p>Tuzak: 'have wrote', 'has went' yanlıştır. Düzensiz V3 biçimlerini ezberle.</p>`,
      chart: "have/has/had + V3 (past participle). 'have went/wrote/saw' YANLIŞ → gone/written/seen.",
      questions: [
        { type:"err", segments:[
            {plain:"The committee "},{choice:"A",text:"has"},{plain:" "},{choice:"B",text:"took"},
            {plain:" several "},{choice:"C",text:"important"},{plain:" "},{choice:"D",text:"decisions"},{plain:"."}],
          answer:"B", correction:"'took' → 'taken'. have/has + V3." },
        { type:"mc", stem:"By the end of the year, scientists had ___ a new species.",
          options:["discover","discovered","discovering","discovers"], answer:1,
          explain:"'had' + V3 → 'discovered'." },
        { type:"err", segments:[
            {plain:"Prices "},{choice:"A",text:"have"},{plain:" "},{choice:"B",text:"rose"},
            {plain:" "},{choice:"C",text:"steadily"},{plain:" over the past "},{choice:"D",text:"decade"},{plain:"."}],
          answer:"B", correction:"'rose' → 'risen'. have + V3 (rise-rose-risen)." }
      ]
    },

    17: {
      title: "be + Present/Past Participle",
      category: "Written Expression",
      rule: `<p>'be' (am/is/are/was/were/been) fiilinden sonra ya <b>present participle (-ing, etken sürerlik)</b>
        ya da <b>past participle (V3, edilgen)</b> gelir.</p>
        <div class="ex"><p>She <b>is studying</b>. (etken, sürüyor)</p>
        <p>The window <b>was broken</b>. (edilgen)</p></div>
        <p>Tuzak: 'is study', 'was break' yanlış; 'is studying' / 'was broken' doğru.</p>`,
      chart: "be + Ving (etken sürer) VEYA be + V3 (edilgen). 'be + V1' yanlıştır.",
      questions: [
        { type:"err", segments:[
            {plain:"The bridge "},{choice:"A",text:"is"},{plain:" currently "},{choice:"B",text:"repair"},
            {plain:" by a "},{choice:"C",text:"local"},{plain:" "},{choice:"D",text:"company"},{plain:"."}],
          answer:"B", correction:"'repair' → 'being repaired' (edilgen) ya da 'repaired'. be + V3 lazım." },
        { type:"mc", stem:"The sound produced by an object ___ in a periodic way involves a sine wave.",
          options:["it vibrates","vibrating","is vibrating","vibrates"], answer:1,
          explain:"Asıl fiil 'involves' var; 'object'i niteleyen participle: 'vibrating'." },
        { type:"mc", stem:"If calcium oxide remains exposed to air, ___ to calcium carbonate.",
          options:["turning","turns","it turns","the turn"], answer:2,
          explain:"İkinci clause'a özne + fiil lazım: 'it turns'." }
      ]
    },

    18: {
      title: "Modal + Yalın Fiil (V1)",
      category: "Written Expression",
      rule: `<p>Modal fiillerden (<b>will, would, can, could, may, might, shall, should, must</b>) sonra fiil
        her zaman <b>yalın biçimde (V1)</b> gelir — -s, -ed, -ing almaz.</p>
        <div class="ex"><p>She can <b>swim</b>. · He must <b>leave</b>. · They will <b>arrive</b> soon.</p></div>
        <p>Tuzak: 'can swims', 'must left', 'will arriving' yanlıştır.</p>`,
      chart: "modal + V1 (yalın fiil). 'will goes / must left / can swimming' YANLIŞ.",
      questions: [
        { type:"err", segments:[
            {plain:"Students "},{choice:"A",text:"must"},{plain:" "},{choice:"B",text:"submitted"},
            {plain:" their "},{choice:"C",text:"applications"},{plain:" before the "},{choice:"D",text:"deadline"},{plain:"."}],
          answer:"B", correction:"'submitted' → 'submit'. modal (must) + V1." },
        { type:"mc", stem:"Researchers believe the treatment could ___ the disease in early stages.",
          options:["cures","cured","cure","curing"], answer:2,
          explain:"modal (could) + V1 → 'cure'." },
        { type:"err", segments:[
            {plain:"The new law "},{choice:"A",text:"will"},{plain:" "},{choice:"B",text:"affects"},
            {plain:" "},{choice:"C",text:"thousands"},{plain:" of "},{choice:"D",text:"businesses"},{plain:"."}],
          answer:"B", correction:"'affects' → 'affect'. modal (will) + V1." }
      ]
    },

    19: {
      title: "Tekil ve Çoğul İsimler",
      category: "Written Expression",
      rule: `<p>Anahtar kelimeler ismin tekil mi çoğul mu olması gerektiğini söyler.</p>
        <div class="ex"><p>'each, every, a, one, a single' → <b>tekil</b> isim · 'many, several, both, two, various' → <b>çoğul</b> isim</p>
        <p>each <b>student</b> (✓) / each students (✗) · many <b>books</b> (✓) / many book (✗)</p></div>`,
      chart: "each/every/one/a → tekil isim. many/several/both/two/various → çoğul isim.",
      questions: [
        { type:"err", segments:[
            {plain:"Every "},{choice:"A",text:"passengers"},{plain:" must "},{choice:"B",text:"show"},
            {plain:" a "},{choice:"C",text:"valid"},{plain:" "},{choice:"D",text:"ticket"},{plain:"."}],
          answer:"A", correction:"'passengers' → 'passenger'. 'Every' tekil isim alır." },
        { type:"mc", stem:"The museum displays several ancient ___ from Egypt.",
          options:["artifact","artifacts","an artifact","artifact's"], answer:1,
          explain:"'several' çoğul isim alır: 'artifacts'." },
        { type:"err", segments:[
            {plain:"There are "},{choice:"A",text:"many"},{plain:" "},{choice:"B",text:"reason"},
            {plain:" to "},{choice:"C",text:"support"},{plain:" this "},{choice:"D",text:"proposal"},{plain:"."}],
          answer:"B", correction:"'reason' → 'reasons'. 'many' çoğul ister." }
      ]
    },

    20: {
      title: "Sayılabilen ve Sayılamayan İsimler",
      category: "Written Expression",
      rule: `<p>Sayılabilen ve sayılamayan isimler farklı belirteçler alır.</p>
        <div class="ex"><p>Sayılabilen: many, few, fewer, a number of → many <b>cars</b>, few <b>people</b></p>
        <p>Sayılamayan: much, little, less, a great deal of → much <b>water</b>, little <b>time</b></p></div>
        <p>Tuzak: 'much books' (✗) → many books · 'many money' (✗) → much money.</p>`,
      chart: "Sayılabilen: many/few/fewer/number of. Sayılamayan: much/little/less/amount of/great deal of.",
      questions: [
        { type:"err", segments:[
            {plain:"The project requires a great "},{choice:"A",text:"amount"},{plain:" of "},{choice:"B",text:"resources"},
            {plain:" and "},{choice:"C",text:"careful"},{plain:" "},{choice:"D",text:"planning"},{plain:"."}],
          answer:"A", correction:"'amount' → 'number'. 'resources' sayılabilir; 'a number of resources'." },
        { type:"mc", stem:"Fewer ___ visited the park this year than last year.",
          options:["traffic","people","water","information"], answer:1,
          explain:"'Fewer' sayılabilen çoğul ister: 'people'." },
        { type:"err", segments:[
            {plain:"There is "},{choice:"A",text:"much"},{plain:" "},{choice:"B",text:"evidences"},
            {plain:" to "},{choice:"C",text:"support"},{plain:" the "},{choice:"D",text:"theory"},{plain:"."}],
          answer:"B", correction:"'evidences' → 'evidence' (sayılamaz, çoğul olmaz)." }
      ]
    },

    21: {
      title: "Özne ve Nesne Zamirleri",
      category: "Written Expression",
      rule: `<p>Özne zamirleri (I, he, she, we, they) fiilin öznesi; nesne zamirleri (me, him, her, us, them)
        fiilin/edatın nesnesi olur.</p>
        <div class="ex"><p><b>She</b> gave the book to <b>him</b>. (özne / nesne)</p>
        <p>Between you and <b>me</b>… (edattan sonra nesne)</p></div>`,
      chart: "Özne konumu → I/he/she/we/they. Nesne (fiil/edat) konumu → me/him/her/us/them.",
      questions: [
        { type:"err", segments:[
            {plain:"The teacher gave "},{choice:"A",text:"the students"},{plain:" and "},{choice:"B",text:"I"},
            {plain:" extra "},{choice:"C",text:"time"},{plain:" to "},{choice:"D",text:"finish"},{plain:"."}],
          answer:"B", correction:"'I' → 'me' (fiilin nesnesi)." },
        { type:"mc", stem:"The committee asked my colleague and ___ to lead the project.",
          options:["I","me","myself","mine"], answer:1,
          explain:"'asked' fiilinin nesnesi → 'me'." },
        { type:"err", segments:[
            {plain:"Him "},{choice:"A",text:"and"},{plain:" his brother "},{choice:"B",text:"started"},
            {plain:" a "},{choice:"C",text:"successful"},{plain:" "},{choice:"D",text:"business"},{plain:"."}],
          answer:"A", correction:"Aslında hata baştaki 'Him' — özne lazım: 'He'. (İşaretlenecek hata: 'Him', A seçeneği 'and' ile birlikte özne öbeğini başlatır; doğru: He and his brother.)" }
      ]
    },

    22: {
      title: "İyelik (Possessives)",
      category: "Written Expression",
      rule: `<p>İyelik sıfatları (my, your, his, her, its, our, their) bir ismin önünde gelir.
        İyelik zamirleri (mine, yours, his, hers, ours, theirs) tek başına kullanılır.</p>
        <div class="ex"><p><b>Its</b> color is red. (iyelik sıfatı — 'it's' = it is değil!)</p>
        <p>This book is <b>hers</b>. (iyelik zamiri)</p></div>
        <p>Tuzak: <b>its</b> (iyelik) ≠ <b>it's</b> (it is); <b>their</b> ≠ there/they're.</p>`,
      chart: "İyelik sıfatı + isim: my/his/its/their book. Tek başına: mine/his/hers/theirs. 'its' ≠ 'it's'.",
      questions: [
        { type:"err", segments:[
            {plain:"The company "},{choice:"A",text:"increased"},{plain:" "},{choice:"B",text:"it's"},
            {plain:" "},{choice:"C",text:"profits"},{plain:" last "},{choice:"D",text:"quarter"},{plain:"."}],
          answer:"B", correction:"'it's' → 'its' (iyelik sıfatı; 'it is' değil)." },
        { type:"mc", stem:"Each bird builds ___ nest in a different way.",
          options:["it's","its","their","they're"], answer:1,
          explain:"Tekil iyelik sıfatı: 'its'." },
        { type:"err", segments:[
            {plain:"The "},{choice:"A",text:"researchers"},{plain:" presented "},{choice:"B",text:"theirs"},
            {plain:" "},{choice:"C",text:"findings"},{plain:" at the "},{choice:"D",text:"conference"},{plain:"."}],
          answer:"B", correction:"'theirs' → 'their' (ismin önünde iyelik sıfatı lazım)." }
      ]
    },

    23: {
      title: "Zamir Referansı",
      category: "Written Expression",
      rule: `<p>Bir zamir, gönderdiği isimle (antecedent) <b>tekil/çoğul ve cinsiyet</b> bakımından uyumlu olmalıdır.</p>
        <div class="ex"><p>The <b>students</b> finished <b>their</b> projects. (students → their)</p>
        <p>The <b>company</b> changed <b>its</b> policy. (company → its)</p></div>
        <p>Tuzak: tekil isme çoğul zamir (a person … they) ya da yanlış uyum.</p>`,
      chart: "Zamir, gönderdiği isimle tekil/çoğul olarak uyumlu olmalı: company→its, students→their.",
      questions: [
        { type:"err", segments:[
            {plain:"When a "},{choice:"A",text:"student"},{plain:" misses class, "},{choice:"B",text:"they"},
            {plain:" "},{choice:"C",text:"should"},{plain:" contact the "},{choice:"D",text:"professor"},{plain:"."}],
          answer:"B", correction:"'they' → 'he or she' (tekil 'student' ile uyum)." },
        { type:"mc", stem:"The corporation announced that ___ would expand into Asia.",
          options:["they","it","them","their"], answer:1,
          explain:"'corporation' tekil → 'it'." },
        { type:"err", segments:[
            {plain:"Each of the "},{choice:"A",text:"women"},{plain:" "},{choice:"B",text:"described"},
            {plain:" "},{choice:"C",text:"their"},{plain:" own "},{choice:"D",text:"experience"},{plain:"."}],
          answer:"C", correction:"'their' → 'her'. 'Each' tekildir." }
      ]
    },

    24: {
      title: "Sıfatlar ve Zarflar",
      category: "Written Expression",
      rule: `<p>Sıfatlar (adjective) <b>isimleri</b> niteler; zarflar (adverb, genelde -ly) <b>fiil, sıfat veya başka zarfı</b> niteler.</p>
        <div class="ex"><p>a <b>careful</b> driver (sıfat → isim) · drives <b>carefully</b> (zarf → fiil)</p>
        <p>an <b>extremely</b> difficult test (zarf → sıfat)</p></div>
        <p>Tuzak: 'drives careful' (✗) → carefully; 'a quickly decision' (✗) → quick.</p>`,
      chart: "Sıfat → isim niteler. Zarf (-ly) → fiil/sıfat/zarf niteler. 'works careful' YANLIŞ → carefully.",
      questions: [
        { type:"err", segments:[
            {plain:"The engineers "},{choice:"A",text:"completed"},{plain:" the "},{choice:"B",text:"complex"},
            {plain:" project "},{choice:"C",text:"successful"},{plain:" and on "},{choice:"D",text:"time"},{plain:"."}],
          answer:"C", correction:"'successful' → 'successfully' (fiili niteler, zarf olmalı)." },
        { type:"mc", stem:"The new device operates ___ even under extreme conditions.",
          options:["efficient","efficiency","efficiently","more efficient"], answer:2,
          explain:"Fiili (operates) niteleyen zarf: 'efficiently'." },
        { type:"err", segments:[
            {plain:"She gave a "},{choice:"A",text:"remarkable"},{plain:" "},{choice:"B",text:"clearly"},
            {plain:" "},{choice:"C",text:"explanation"},{plain:" of the "},{choice:"D",text:"problem"},{plain:"."}],
          answer:"B", correction:"'clearly' → 'clear' (ismi 'explanation' niteler, sıfat olmalı)." }
      ]
    },

    25: {
      title: "Linking Verb'lerden Sonra Sıfat",
      category: "Written Expression",
      rule: `<p>Linking (bağlayıcı) fiillerden sonra zarf değil <b>sıfat</b> gelir; çünkü sıfat özneyi niteler.
        Linking fiiller: <b>be, become, seem, appear, feel, look, smell, sound, taste, remain, stay.</b></p>
        <div class="ex"><p>The soup tastes <b>good</b>. (✓ — 'tastes well' değil)</p>
        <p>She seems <b>happy</b>. · The plan looks <b>promising</b>.</p></div>`,
      chart: "Linking verb (be/become/seem/feel/look/taste/remain…) + SIFAT (zarf değil). 'tastes good' (✓).",
      questions: [
        { type:"err", segments:[
            {plain:"After the long "},{choice:"A",text:"hike"},{plain:", the travelers "},{choice:"B",text:"felt"},
            {plain:" "},{choice:"C",text:"exhaustedly"},{plain:" but "},{choice:"D",text:"happy"},{plain:"."}],
          answer:"C", correction:"'exhaustedly' → 'exhausted'. 'felt' linking verb, sıfat alır." },
        { type:"mc", stem:"The proposal sounds ___ to most of the board members.",
          options:["reasonably","reasonable","reason","reasoning"], answer:1,
          explain:"'sounds' linking verb → sıfat: 'reasonable'." },
        { type:"err", segments:[
            {plain:"The fresh "},{choice:"A",text:"flowers"},{plain:" in the vase "},{choice:"B",text:"smell"},
            {plain:" "},{choice:"C",text:"wonderfully"},{plain:" this "},{choice:"D",text:"morning"},{plain:"."}],
          answer:"C", correction:"'wonderfully' → 'wonderful'. 'smell' burada linking verb, sıfat alır." }
      ]
    },

    26: {
      title: "Karşılaştırma (Comparative & Superlative)",
      category: "Structure",
      rule: `<p>İki şeyi karşılaştırırken <b>comparative</b>, üç+ arasında en üstünü belirtirken <b>superlative</b> kullanılır.</p>
        <div class="ex"><p><b>Kısa sıfat:</b> tall → tall<b>er</b> than · the tall<b>est</b></p>
        <p><b>Uzun sıfat:</b> expensive → <b>more</b> expensive than · the <b>most</b> expensive</p>
        <p>This bridge is <b>longer than</b> the old one. · It is the <b>most important</b> test.</p></div>
        <p>Tuzak: 'more bigger' (çift), 'expensiver' (yanlış), 'as ... than' (yanlış).</p>`,
      chart: "Kısa sıfat: -er/-est. Uzun sıfat: more/most. 'than' ile comparative, 'the ... in' ile superlative. Çift karşılaştırma (more -er) YANLIŞ.",
      questions: [
        { type:"mc", stem:"The new bridge is ___ than the old one.", options:["longer","more long","longest","as long"], answer:0, explain:"Kısa sıfat + -er + than → 'longer'." },
        { type:"mc", stem:"This is the ___ building in the city.", options:["taller","tallest","most tall","more tall"], answer:1, explain:"'the ... in' → superlatif: 'tallest'." },
        { type:"mc", stem:"Gold is ___ than silver.", options:["expensiver","more expensive","most expensive","as expensive"], answer:1, explain:"Uzun sıfat + 'more' + than → 'more expensive'." }
      ]
    },

    27: {
      title: "Devrik Yapı (Inversion)",
      category: "Structure",
      rule: `<p>Cümle <b>olumsuz/sınırlayıcı bir zarfla</b> başlarsa (Never, Rarely, Seldom, Hardly, Not only, Only…),
        özne ile yardımcı fiil <b>yer değiştirir</b> (soru sıralaması gibi).</p>
        <div class="ex"><p><b>Rarely do</b> the students arrive late. (Rarely + do + özne)</p>
        <p><b>Never have I</b> seen such a thing. · <b>Not only did</b> she win, but she also broke a record.</p></div>
        <p>Tuzak: olumsuz zarftan sonra normal sıra ('Rarely the students arrive') yanlıştır.</p>`,
      chart: "Olumsuz zarf (Never/Rarely/Seldom/Hardly/Not only…) başta → yardımcı fiil + özne (devrik). 'Rarely do they …'.",
      questions: [
        { type:"mc", stem:"Rarely ___ on weekends.", options:["the workers travel","do the workers travel","the workers do travel","travel the workers"], answer:1, explain:"Olumsuz zarf + devrik: 'do the workers travel'." },
        { type:"mc", stem:"Never ___ such a beautiful view.", options:["I have seen","have I seen","I saw","seen I have"], answer:1, explain:"Never + yardımcı fiil + özne: 'have I seen'." },
        { type:"mc", stem:"Seldom ___ late to class.", options:["does she arrive","she arrives","she does arrive","arrives she"], answer:0, explain:"Seldom + 'does' + özne + yalın fiil." }
      ]
    },

    28: {
      title: "Koşul Cümleleri (Conditionals)",
      category: "Structure",
      rule: `<p><b>Type 2 (gerçek-dışı şimdi):</b> If + geçmiş (be → <b>were</b>), sonuç: would + V1.<br>
        <b>Type 3 (geçmişe pişmanlık):</b> If + <b>had</b> + V3, sonuç: would have + V3.</p>
        <div class="ex"><p>If I <b>were</b> rich, I would travel. (her özneyle 'were')</p>
        <p>If they <b>had</b> left earlier, they would have caught the train.</p></div>
        <p>Tuzak: 'if' clause'unda 'would' KULLANILMAZ; 'was' yerine resmi dilde 'were'.</p>`,
      chart: "Type 2: If + were + … , would + V1. Type 3: If + had + V3, would have + V3. 'if' clause'unda would olmaz.",
      questions: [
        { type:"mc", stem:"If she ___ the manager, she would change the rules.", options:["was","were","is","be"], answer:1, explain:"Gerçek-dışı koşul → 'were' (her özneyle)." },
        { type:"mc", stem:"If they ___ studied harder, they would have passed.", options:["have","had","has","would have"], answer:1, explain:"Type 3: If + had + V3 → 'had studied'." },
        { type:"mc", stem:"If I ___ you, I would accept the offer.", options:["am","was","were","be"], answer:2, explain:"'If I were you' kalıbı." }
      ]
    },

    29: {
      title: "Gerund vs Infinitive",
      category: "Structure",
      rule: `<p>Bazı fiillerden sonra <b>gerund (-ing)</b>, bazılarından sonra <b>infinitive (to + fiil)</b> gelir.</p>
        <div class="ex"><p><b>-ing alanlar:</b> enjoy, avoid, finish, consider, suggest, practice, deny, recommend, miss, quit</p>
        <p><b>to + fiil alanlar:</b> want, decide, hope, plan, agree, refuse, promise, learn, manage, offer, expect</p>
        <p>She <b>enjoys reading</b>. · He <b>decided to leave</b>.</p></div>`,
      chart: "enjoy/avoid/finish/consider/suggest… + -ing. want/decide/hope/plan/agree… + to+fiil.",
      questions: [
        { type:"mc", stem:"She enjoys ___ to classical music.", options:["to listen","listening","listen","listened"], answer:1, explain:"'enjoy' + gerund → 'listening'." },
        { type:"mc", stem:"They decided ___ the project early.", options:["finishing","to finish","finish","finished"], answer:1, explain:"'decide' + mastar → 'to finish'." },
        { type:"mc", stem:"He avoided ___ about the problem.", options:["to talk","talking","talk","talks"], answer:1, explain:"'avoid' + gerund → 'talking'." }
      ]
    }
  }
};

// Tanı testi (Diagnostic Pre-Test) — kitabın pre-test'inden derlenmiş örnek karışım
const DIAGNOSTIC = [
  { skill:1,  type:"mc", stem:"In the early 1900s, Eastman ___ inexpensive Brownie box cameras.",
    options:["it developed","it was developed","developed","developing"], answer:2,
    explain:"Özne (Eastman) var, fiil lazım → 'developed'." },
  { skill:8,  type:"mc", stem:"___ the discovery of the fossilized remnants of tides in ancient rocks.",
    options:["Geological reports","Geologists report","The reports of geologists","Geologists' reports"], answer:1,
    explain:"Cümlenin öznesi+fiili lazım: 'Geologists report' (S + V)." },
  { skill:9,  type:"mc", stem:"The Brooklyn Bridge ___ took thirteen years to complete.",
    options:["in New York","is in New York","it is in New York","which New York"], answer:0,
    explain:"Araya giren niteleme öbeği: 'in New York'." },
  { skill:4,  type:"mc", stem:"Genes control all of the physical ___ we inherit.",
    options:["that traits","that are traits","traits that","traits are that"], answer:2,
    explain:"'traits that we inherit' — isim + adjective clause." },
  { skill:5,  type:"mc", stem:"Indigo can be extracted from a plant, and then ___ to dye cloth blue.",
    options:["it","using","using it","it can be used"], answer:3,
    explain:"İkinci clause'a özne + fiil lazım: 'it can be used'." },
  { skill:2,  type:"mc", stem:"___ in the United States spends 900 hours per year in class.",
    options:["The average third-grader","The third grade is average","There are three grades","Three average grades"], answer:0,
    explain:"Tekil özne + tekil fiil (spends): 'The average third-grader'." },
  { skill:7,  type:"mc", stem:"Researchers have begun studying what ___ is on human circadian rhythms.",
    options:["it is the effect of light","the light affects","in affecting the light","the effect of light"], answer:3,
    explain:"'what … is' yapısının öznesi: 'the effect of light'." },
  { skill:6,  type:"mc", stem:"Surgery was done ___ was still conscious.",
    options:["while the patient","the patient felt","during the patient's","while patiently"], answer:0,
    explain:"Bağlaç + özne: 'while the patient'." },
  { skill:5,  type:"mc", stem:"Some early batteries used nitric acid, ___ gave off poisonous fumes.",
    options:["they","then they","but they","but they had"], answer:2,
    explain:"Bağlaç + özne: 'but they'." },
  { skill:17, type:"mc", stem:"The sound produced by an object ___ in a periodic way involves a sine wave.",
    options:["it vibrates","vibrating","is vibrating","vibrates"], answer:1,
    explain:"Asıl fiil 'involves' var; participle sıfat: 'vibrating'." },
  { skill:6,  type:"mc", stem:"Surgery improved greatly ___ anesthetics were discovered in 1846.",
    options:["during","after","despite","because of"], answer:1,
    explain:"İki clause'u bağlayan zaman bağlacı: 'after'." },
  { skill:8,  type:"mc", stem:"The decline of the beaver illustrates what ___ to the ecosystems.",
    options:["happening","the happening","has happened","about happening"], answer:2,
    explain:"'what' özne; ardından fiil: 'has happened'." },
  { skill:11, type:"err", segments:[
      {plain:"The "},{choice:"A",text:"quality"},{plain:" of the "},{choice:"B",text:"products"},
      {plain:" "},{choice:"C",text:"have"},{plain:" "},{choice:"D",text:"improved"},{plain:"."}],
    answer:"C", correction:"'have' → 'has'. Asıl özne 'quality' tekil." },
  { skill:24, type:"err", segments:[
      {plain:"The engineers "},{choice:"A",text:"completed"},{plain:" the project "},{choice:"B",text:"successful"},
      {plain:" and "},{choice:"C",text:"ahead"},{plain:" of "},{choice:"D",text:"schedule"},{plain:"."}],
    answer:"B", correction:"'successful' → 'successfully' (zarf)." },
  { skill:16, type:"err", segments:[
      {plain:"Prices "},{choice:"A",text:"have"},{plain:" "},{choice:"B",text:"rose"},
      {plain:" "},{choice:"C",text:"steadily"},{plain:" this "},{choice:"D",text:"year"},{plain:"."}],
    answer:"B", correction:"'rose' → 'risen'. have + V3." },
  { skill:13, type:"err", segments:[
      {plain:"Each "},{choice:"A",text:"of"},{plain:" the "},{choice:"B",text:"countries"},
      {plain:" "},{choice:"C",text:"have"},{plain:" its own "},{choice:"D",text:"flag"},{plain:"."}],
    answer:"C", correction:"'have' → 'has'. 'Each' tekil." },
  { skill:18, type:"err", segments:[
      {plain:"Students "},{choice:"A",text:"must"},{plain:" "},{choice:"B",text:"submitted"},
      {plain:" their "},{choice:"C",text:"work"},{plain:" before the "},{choice:"D",text:"deadline"},{plain:"."}],
    answer:"B", correction:"'submitted' → 'submit'. modal + V1." },
  { skill:20, type:"err", segments:[
      {plain:"The project requires a great "},{choice:"A",text:"amount"},{plain:" of "},{choice:"B",text:"resources"},
      {plain:" and "},{choice:"C",text:"careful"},{plain:" "},{choice:"D",text:"planning"},{plain:"."}],
    answer:"A", correction:"'amount' → 'number' (resources sayılabilir)." },
  { skill:22, type:"err", segments:[
      {plain:"The company "},{choice:"A",text:"increased"},{plain:" "},{choice:"B",text:"it's"},
      {plain:" "},{choice:"C",text:"profits"},{plain:" last "},{choice:"D",text:"quarter"},{plain:"."}],
    answer:"B", correction:"'it's' → 'its' (iyelik)." },
  { skill:14, type:"err", segments:[
      {plain:"The course teaches students to read, "},{choice:"A",text:"to write"},{plain:", and "},
      {choice:"B",text:"speaking"},{plain:" a "},{choice:"C",text:"new"},{plain:" "},{choice:"D",text:"language"},{plain:"."}],
    answer:"B", correction:"'speaking' → 'to speak' (paralellik)." }
];

if (typeof module !== "undefined") { module.exports = { CURRICULUM, DIAGNOSTIC }; }
