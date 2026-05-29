"""
Lexi — AI Soru Üretici Servisi (v2)

Yenilikler:
- Grammar ve Reading ayrı prompt'ları
- JSON format hatası için 3x retry
- Cevap doğrulama — her sorunun answer alanı kontrol edilir
- Öğretmen onayı olmadan ödev öğrenciye gitmiyor (status: draft → approved)
- Reading: Claude hem pasaj hem soruları üretir
- Öğretmen kendi metnini yapıştırabilir (custom_text)
"""

import json
import re
import anthropic
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
MAX_RETRIES = 3

# ── Prompt şablonları ─────────────────────────────────────────────────

GRAMMAR_SYSTEM = """You are a senior EFL exam writer creating error-free grammar exercises.

ABSOLUTE RULES — never break these:
1. Return ONLY raw JSON. No markdown, no backticks, no explanation.
2. Every question MUST have exactly one correct "answer" field.
3. For multiple_choice: the "answer" must be one of the "options" exactly.
4. For fill_blank: the "answer" is the single correct form.
5. For rewrite: the "answer" is the complete rewritten sentence.
6. All hints must be in Turkish and explain the grammar rule briefly.
7. Match difficulty exactly to the CEFR level given.
8. Never repeat the same sentence structure twice.

OUTPUT FORMAT (strict):
{
  "questions": [
    {
      "id": 1,
      "type": "fill_blank",
      "instruction": "Fill in the blank with the correct form of the verb.",
      "sentence": "She ___ (live) in Istanbul for three years.",
      "answer": "has lived",
      "hint": "Present Perfect: have/has + V3 — geçmişte başlayıp devam eden eylemler."
    },
    {
      "id": 2,
      "type": "multiple_choice",
      "instruction": "Choose the correct option.",
      "sentence": "I ___ never ___ sushi before.",
      "options": ["have / eaten", "did / eat", "was / eating", "am / eat"],
      "answer": "have / eaten",
      "hint": "Have + never + past participle: hayat deneyimleri için kullanılır."
    },
    {
      "id": 3,
      "type": "rewrite",
      "instruction": "Rewrite the sentence using Present Perfect.",
      "sentence": "She started working here in 2020.",
      "prompt": "(She / work / since 2020)",
      "answer": "She has worked here since 2020.",
      "hint": "'Since' başlangıç noktası belirtir — Present Perfect gerektirir."
    }
  ]
}"""

READING_SYSTEM = """You are a senior EFL reading comprehension writer.

ABSOLUTE RULES:
1. Return ONLY raw JSON. No markdown, no backticks, no explanation.
2. First generate a reading passage, then generate comprehension questions about it.
3. Every question's "answer" must be directly supported by the passage text.
4. For multiple_choice: "answer" must be one of "options" exactly.
5. All hints must be in Turkish and point to which paragraph the answer is in.
6. Passage must be age-appropriate and factually accurate.
7. Match vocabulary and complexity to the CEFR level given.

OUTPUT FORMAT (strict):
{
  "passage": {
    "title": "The History of the Internet",
    "text": "Paragraph 1 text here...\n\nParagraph 2 text here...\n\nParagraph 3 text here..."
  },
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "instruction": "Choose the best answer according to the passage.",
      "sentence": "What is the main idea of the passage?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "hint": "1. paragrafta konunun ana fikri açıklanmaktadır."
    },
    {
      "id": 2,
      "type": "fill_blank",
      "instruction": "Complete the sentence according to the passage.",
      "sentence": "The internet was first developed in the ___.",
      "answer": "1960s",
      "hint": "Cevap 1. paragrafta bulunmaktadır."
    }
  ]
}"""

CUSTOM_TEXT_SYSTEM = """You are a senior EFL reading comprehension writer.
The teacher has provided their own reading passage. Generate comprehension questions ONLY from this passage.

ABSOLUTE RULES:
1. Return ONLY raw JSON. No markdown, no backticks, no explanation.
2. Every answer MUST come directly from the passage — no outside knowledge.
3. For multiple_choice: "answer" must be one of "options" exactly.
4. All hints must be in Turkish and reference which part of the text.
5. Do NOT invent facts not in the passage.

OUTPUT FORMAT (strict — no "passage" field, questions only):
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "instruction": "Choose the best answer according to the passage.",
      "sentence": "...",
      "options": ["A","B","C","D"],
      "answer": "A",
      "hint": "Cevap metinin ilk bölümünde geçmektedir."
    }
  ]
}"""

# ── Yardımcılar ───────────────────────────────────────────────────────

def _clean_json(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()

def _validate_questions(questions: list) -> tuple[bool, str]:
    required = {"id", "type", "instruction", "sentence", "answer", "hint"}
    for i, q in enumerate(questions):
        missing = required - set(q.keys())
        if missing:
            return False, f"Soru {i+1} eksik alan: {missing}"
        if q["type"] == "multiple_choice":
            if "options" not in q:
                return False, f"Soru {i+1}: multiple_choice için 'options' gerekli"
            if q["answer"] not in q["options"]:
                return False, f"Soru {i+1}: answer ({q['answer']!r}) options içinde değil: {q['options']}"
        if not str(q.get("answer","")).strip():
            return False, f"Soru {i+1}: boş 'answer'"
    return True, "ok"

def _call_claude(system: str, user_msg: str) -> dict:
    last_error = ""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            msg = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                system=system,
                messages=[{"role": "user", "content": user_msg}],
            )
            raw = msg.content[0].text
            data = json.loads(_clean_json(raw))
            return data
        except json.JSONDecodeError as e:
            last_error = f"JSON parse hatası (deneme {attempt}): {e}"
        except Exception as e:
            last_error = f"API hatası (deneme {attempt}): {e}"
    raise RuntimeError(f"Claude API başarısız: {last_error}")

# ── Ana üretim fonksiyonları ──────────────────────────────────────────

async def generate_grammar_questions(topic: str, level: str, count: int, grade: str) -> list:
    user_msg = (
        f"Generate exactly {count} grammar exercise questions.\n"
        f"Grammar topic: {topic}\n"
        f"CEFR Level: {level}\n"
        f"Grade: {grade}\n"
        f"Mix question types: fill_blank, multiple_choice, rewrite.\n"
        f"All hints must be in Turkish."
    )
    for attempt in range(1, MAX_RETRIES + 1):
        data = _call_claude(GRAMMAR_SYSTEM, user_msg)
        questions = data.get("questions", [])
        ok, msg = _validate_questions(questions)
        if ok and len(questions) >= count:
            return questions[:count]
        user_msg += f"\n\nPREVIOUS ATTEMPT FAILED: {msg}. Fix all issues and regenerate."
    raise RuntimeError(f"Grammar soruları doğrulanamadı ({MAX_RETRIES} deneme)")

async def generate_reading_questions(
    topic_title: str, topic_key: str, level: str,
    count: int, grade: str, text_length: str = "medium"
) -> dict:
    length_map = {"short": "150-200 words", "medium": "250-350 words", "long": "400-500 words"}
    user_msg = (
        f"Generate a reading passage and {count} comprehension questions.\n"
        f"Passage topic: {topic_title}\n"
        f"Topic category: {topic_key}\n"
        f"CEFR Level: {level}\n"
        f"Grade: {grade}\n"
        f"Passage length: {length_map.get(text_length,'250-350 words')}, 3-4 paragraphs.\n"
        f"Question types: mostly multiple_choice, 1-2 fill_blank.\n"
        f"All hints must be in Turkish."
    )
    for attempt in range(1, MAX_RETRIES + 1):
        data = _call_claude(READING_SYSTEM, user_msg)
        if "passage" not in data or "questions" not in data:
            user_msg += "\n\nFailed: Missing 'passage' or 'questions'. Regenerate."
            continue
        ok, msg = _validate_questions(data["questions"])
        if ok and len(data["questions"]) >= count:
            data["questions"] = data["questions"][:count]
            return data
        user_msg += f"\n\nFailed validation: {msg}. Fix and regenerate."
    raise RuntimeError(f"Reading soruları doğrulanamadı ({MAX_RETRIES} deneme)")

async def generate_from_custom_text(
    custom_text: str, level: str, count: int, grade: str
) -> list:
    user_msg = (
        f"Generate {count} comprehension questions based ONLY on the passage below.\n"
        f"CEFR Level: {level}, Grade: {grade}\n\n"
        f"PASSAGE:\n{custom_text}\n\nAll hints must be in Turkish."
    )
    for attempt in range(1, MAX_RETRIES + 1):
        data = _call_claude(CUSTOM_TEXT_SYSTEM, user_msg)
        questions = data.get("questions", [])
        ok, msg = _validate_questions(questions)
        if ok and len(questions) >= count:
            return questions[:count]
        user_msg += f"\n\nFailed: {msg}. Regenerate."
    raise RuntimeError(f"Custom text soruları doğrulanamadı ({MAX_RETRIES} deneme)")

# ── Değerlendirme ─────────────────────────────────────────────────────

def grade_submission(questions: list, answers: dict) -> tuple[float, list]:
    feedback = []
    correct_count = 0
    for q in questions:
        qid = str(q["id"])
        user_answer = str(answers.get(qid, "")).strip().lower()
        correct_answer = str(q.get("answer", "")).strip().lower()
        is_correct = user_answer == correct_answer
        if is_correct:
            correct_count += 1
        feedback.append({
            "id": q["id"],
            "type": q.get("type"),
            "is_correct": is_correct,
            "user_answer": answers.get(qid, ""),
            "correct_answer": q.get("answer", ""),
            "hint": q.get("hint", ""),
        })
    score = round((correct_count / len(questions)) * 100, 2) if questions else 0
    return score, feedback
