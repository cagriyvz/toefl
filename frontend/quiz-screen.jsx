import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";
const getToken = () => localStorage.getItem("lexi_token");

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Hata");
  return data;
}

// Soru tipine göre bağlamsal görseller (Unsplash)
const TOPIC_IMAGES = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80",
];

// Mock veri — gerçekte API'den gelir
const MOCK_ASSIGNMENT = {
  id: "mock-1",
  title: "Present Perfect Tense",
  topic: "Present Perfect Tense",
  level: "A2",
  questions: [
    {
      id: 1, type: "multiple_choice",
      instruction: "Choose the correct answer to complete the sentence.",
      sentence: "I deeply regret my decision; if I had studied more for the test, I ___ a better grade.",
      options: ["would get", "got", "will get", "would have gotten"],
      answer: "would have gotten",
      hint: "Type 3 conditional: 'if + past perfect, would have + past participle' yapısı geçmişteki gerçekleşmeyen durumlar için kullanılır.",
    },
    {
      id: 2, type: "fill_blank",
      instruction: "Fill in the blank with the correct verb form.",
      sentence: "She ___ (live) in Istanbul for three years.",
      answer: "has lived",
      hint: "'Have/has + past participle' — geçmişte başlayıp hâlâ devam eden eylemler için kullanılır.",
    },
    {
      id: 3, type: "multiple_choice",
      instruction: "Choose the correct answer to complete the sentence.",
      sentence: "How long ___ you ___ English?",
      options: ["have / studied", "did / study", "are / studying", "do / study"],
      answer: "have / studied",
      hint: "'How long' sorusu + 'for/since' → Present Perfect kullanılır.",
    },
    {
      id: 4, type: "fill_blank",
      instruction: "Fill in the blank with the correct verb form.",
      sentence: "They ___ (not finish) the project yet.",
      answer: "haven't finished",
      hint: "Olumsuz yapı: 'have/has + not + past participle'. 'Yet' cümle sonunda gelir.",
    },
    {
      id: 5, type: "multiple_choice",
      instruction: "Select the best option.",
      sentence: "I ___ never ___ sushi before last night.",
      options: ["have / eaten", "had / eaten", "did / eat", "was / eating"],
      answer: "had / eaten",
      hint: "Geçmişteki bir olaydan önce gerçekleşen eylem için Past Perfect (had + V3) kullanılır.",
    },
  ],
};

function ProgressBar({ current, total }) {
  return (
    <div style={{ width: "100%", padding: "0 0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", fontFamily: "'Nunito', sans-serif" }}>
          Question {current} of {total}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", fontFamily: "'Nunito', sans-serif" }}>
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      {/* Segment progress wext tarzı */}
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i < current - 1 ? "#2563eb" : i === current - 1 ? "#60a5fa" : "#e5e7eb",
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

function MultipleChoice({ question, checked, selected, onSelect, imgSrc }) {
  const optionColors = ["#2563eb", "#6366f1", "#0ea5e9", "#10b981"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Görsel */}
      <div style={{
        width: "100%", height: 280, overflow: "hidden", borderRadius: "20px 20px 0 0",
        position: "relative", flexShrink: 0,
      }}>
        <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
        }} />
        {/* Soru tipi etiketi */}
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700,
          color: "#2563eb", letterSpacing: 0.5,
        }}>Multiple Choice</div>
      </div>

      {/* Soru metni */}
      <div style={{ padding: "20px 24px 16px", background: "#fff" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {question.instruction}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", lineHeight: 1.6, fontFamily: "'Nunito', sans-serif" }}>
          {(question.sentence || "").replace(/___+/g, (
            <span style={{ borderBottom: "2px solid #2563eb", paddingBottom: 1 }}>_____</span>
          ))}
        </div>
      </div>

      {/* Seçenekler */}
      <div style={{ padding: "0 24px 24px", background: "#fff", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {question.options.map((opt, i) => {
            const isSelected = selected === opt;
            const color = optionColors[i % optionColors.length];
            return (
              <button key={opt} onClick={() => !checked && onSelect(opt)} style={{
                padding: "13px 18px", borderRadius: 12, border: "none",
                background: isSelected ? color : "#f3f4f6",
                color: isSelected ? "#fff" : "#374151",
                fontSize: 14, fontWeight: 700, cursor: checked ? "default" : "pointer",
                fontFamily: "'Nunito', sans-serif", transition: "all 0.2s",
                textAlign: "center", lineHeight: 1.3,
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                boxShadow: isSelected ? `0 4px 16px ${color}50` : "none",
              }}
                onMouseEnter={e => { if (!checked && !isSelected) e.currentTarget.style.background = "#e5e7eb"; }}
                onMouseLeave={e => { if (!checked && !isSelected) e.currentTarget.style.background = "#f3f4f6"; }}
              >{opt}</button>
            );
          })}
        </div>

        {/* Feedback */}
        {checked && (
          <div style={{
            marginTop: 14, padding: "12px 16px", borderRadius: 12,
            background: selected === question.answer ? "#f0fdf4" : "#fff7ed",
            border: `1px solid ${selected === question.answer ? "#bbf7d0" : "#fed7aa"}`,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{selected === question.answer ? "✓" : "✗"}</span>
            <div>
              {selected !== question.answer && (
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c", marginBottom: 4, fontFamily: "'Nunito', sans-serif" }}>
                  Doğru: "{question.answer}"
                </div>
              )}
              <div style={{ fontSize: 13, color: selected === question.answer ? "#166534" : "#9a3412", lineHeight: 1.5, fontFamily: "'Nunito', sans-serif" }}>
                💡 {question.hint}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FillBlank({ question, checked, input, onChange, onSubmit, imgSrc }) {
  const parts = (question.sentence || "").split(/___+/);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Görsel */}
      <div style={{
        width: "100%", height: 280, overflow: "hidden", borderRadius: "20px 20px 0 0",
        position: "relative", flexShrink: 0,
      }}>
        <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
        }} />
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700,
          color: "#7c3aed", letterSpacing: 0.5,
        }}>Fill in the Blank</div>
      </div>

      {/* Soru */}
      <div style={{ padding: "20px 24px 16px", background: "#fff" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {question.instruction}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.8, fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          {parts[0]}
          <span style={{
            display: "inline-block", minWidth: 120, borderBottom: "3px solid #7c3aed",
            padding: "2px 8px", color: "#7c3aed", fontWeight: 800, textAlign: "center",
            fontFamily: "'Nunito', monospace",
          }}>{input || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}</span>
          {parts[1]}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "0 24px 24px", background: "#fff", flex: 1 }}>
        <input
          type="text" value={input} onChange={e => !checked && onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !checked && input.trim() && onSubmit()}
          disabled={checked} placeholder="Type your answer..."
          style={{
            width: "100%", padding: "14px 18px", fontSize: 16, fontFamily: "'Nunito', sans-serif",
            border: `2px solid ${checked ? (input.trim().toLowerCase() === question.answer.toLowerCase() ? "#86efac" : "#fca5a5") : "#e5e7eb"}`,
            borderRadius: 14, outline: "none", boxSizing: "border-box",
            background: checked ? (input.trim().toLowerCase() === question.answer.toLowerCase() ? "#f0fdf4" : "#fff1f2") : "#fff",
            color: "#111827", transition: "all 0.2s",
          }}
          onFocus={e => { if (!checked) e.target.style.borderColor = "#7c3aed"; }}
          onBlur={e => { if (!checked) e.target.style.borderColor = "#e5e7eb"; }}
        />

        {checked && (
          <div style={{
            marginTop: 12, padding: "12px 16px", borderRadius: 12,
            background: input.trim().toLowerCase() === question.answer.toLowerCase() ? "#f0fdf4" : "#fff7ed",
            border: `1px solid ${input.trim().toLowerCase() === question.answer.toLowerCase() ? "#bbf7d0" : "#fed7aa"}`,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{input.trim().toLowerCase() === question.answer.toLowerCase() ? "✓" : "✗"}</span>
            <div>
              {input.trim().toLowerCase() !== question.answer.toLowerCase() && (
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c", marginBottom: 4, fontFamily: "'Nunito', sans-serif" }}>
                  Doğru: "{question.answer}"
                </div>
              )}
              <div style={{ fontSize: 13, color: input.trim().toLowerCase() === question.answer.toLowerCase() ? "#166534" : "#9a3412", lineHeight: 1.5, fontFamily: "'Nunito', sans-serif" }}>
                💡 {question.hint}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultScreen({ questions, answers, onBack }) {
  const correct = questions.filter(q => answers[String(q.id)]?.trim().toLowerCase() === q.answer.toLowerCase()).length;
  const pct = Math.round((correct / questions.length) * 100);
  const [emoji, msg, color] = pct >= 80 ? ["🎉", "Excellent!", "#16a34a"] : pct >= 60 ? ["💪", "Good job!", "#ca8a04"] : ["📚", "Keep practicing!", "#dc2626"];

  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{
        width: 120, height: 120, borderRadius: "50%", margin: "0 auto 24px",
        background: `${color}15`, border: `4px solid ${color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: "'Nunito', sans-serif" }}>{pct}%</div>
      </div>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", fontFamily: "'Nunito', sans-serif", marginBottom: 8 }}>{msg}</div>
      <div style={{ fontSize: 15, color: "#6b7280", fontFamily: "'Nunito', sans-serif", marginBottom: 32 }}>
        {correct} out of {questions.length} correct
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, textAlign: "left" }}>
        {questions.map((q, i) => {
          const ua = answers[String(q.id)] || "";
          const ok = ua.trim().toLowerCase() === q.answer.toLowerCase();
          return (
            <div key={q.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
              background: ok ? "#f0fdf4" : "#fff1f2", borderRadius: 12,
              border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{ok ? "✓" : "✗"}</span>
              <div>
                <div style={{ fontSize: 13, color: "#374151", fontFamily: "'Nunito', sans-serif", marginBottom: ok ? 0 : 4 }}>
                  {q.sentence?.replace(/___+/g, "___")}
                </div>
                {!ok && <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>✓ {q.answer}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onBack} style={{
        padding: "14px 40px", background: "#2563eb", color: "#fff", border: "none",
        borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer",
        fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
      }}>Back to Assignments</button>
    </div>
  );
}

export default function QuizPage({
  assignmentId,
  onBack,
  // Gerçek kullanımda: assignmentId ile API'den çek
  // Şimdilik mock data ile çalışıyor
}) {
  const [assignment] = useState(MOCK_ASSIGNMENT);
  const [idx, setIdx]           = useState(0);
  const [answers, setAnswers]   = useState({});
  const [checked, setChecked]   = useState({});
  const [input, setInput]       = useState("");
  const [selected, setSelected] = useState(null);
  const [done, setDone]         = useState(false);
  const [animKey, setAnimKey]   = useState(0);

  const qs    = assignment.questions;
  const total = qs.length;
  const q     = qs[idx];
  const imgSrc = TOPIC_IMAGES[idx % TOPIC_IMAGES.length];
  const isChecked = !!checked[q?.id];

  const handleCheck = () => {
    const val = q.type === "multiple_choice" ? selected : input.trim();
    if (!val) return;
    setAnswers(prev => ({ ...prev, [String(q.id)]: val }));
    setChecked(prev => ({ ...prev, [q.id]: true }));
  };

  const handleNext = () => {
    if (idx + 1 >= total) { setDone(true); return; }
    setIdx(idx + 1);
    setInput("");
    setSelected(null);
    setAnimKey(k => k + 1);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito', sans-serif; background: #f1f5f9; min-height: 100vh; }
    @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  `;

  if (done) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", overflow: "hidden", animation: "fadeIn 0.4s ease" }}>
          <ResultScreen questions={qs} answers={answers} onBack={() => { setDone(false); setIdx(0); setAnswers({}); setChecked({}); }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "24px 16px 40px" }}>

        {/* Header */}
        <div style={{ width: "100%", maxWidth: 520, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack || (() => {})} style={{
            background: "#fff", border: "none", borderRadius: 12, width: 40, height: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 20, color: "#6b7280",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>✕</button>
          <div style={{ flex: 1, margin: "0 16px" }}>
            <ProgressBar current={idx + 1} total={total} />
          </div>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "8px 14px",
            fontSize: 13, fontWeight: 800, color: "#2563eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>{assignment.level}</div>
        </div>

        {/* Soru Kartı */}
        <div key={animKey} style={{
          width: "100%", maxWidth: 520, background: "#fff", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)", overflow: "hidden",
          animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2)",
          marginBottom: 16,
        }}>
          {q.type === "multiple_choice" ? (
            <MultipleChoice
              question={q} checked={isChecked}
              selected={selected} onSelect={setSelected}
              imgSrc={imgSrc}
            />
          ) : (
            <FillBlank
              question={q} checked={isChecked}
              input={input} onChange={setInput}
              onSubmit={handleCheck} imgSrc={imgSrc}
            />
          )}
        </div>

        {/* Alt Butonlar */}
        <div style={{ width: "100%", maxWidth: 520 }}>
          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={q.type === "multiple_choice" ? !selected : !input.trim()}
              style={{
                width: "100%", padding: "16px", background: "#2563eb", color: "#fff",
                border: "none", borderRadius: 16, fontSize: 16, fontWeight: 800,
                cursor: (q.type === "multiple_choice" ? !selected : !input.trim()) ? "not-allowed" : "pointer",
                fontFamily: "'Nunito', sans-serif",
                opacity: (q.type === "multiple_choice" ? !selected : !input.trim()) ? 0.45 : 1,
                boxShadow: "0 4px 20px rgba(37,99,235,0.30)",
                transition: "all 0.2s",
              }}
            >Check Answer</button>
          ) : (
            <button onClick={handleNext} style={{
              width: "100%", padding: "16px",
              background: idx + 1 >= total ? "#16a34a" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 16,
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: `0 4px 20px ${idx + 1 >= total ? "rgba(22,163,74,0.35)" : "rgba(37,99,235,0.35)"}`,
              transition: "all 0.2s",
            }}>
              {idx + 1 >= total ? "See Results 🎉" : "Next Question →"}
            </button>
          )}
        </div>

      </div>
    </>
  );
}
