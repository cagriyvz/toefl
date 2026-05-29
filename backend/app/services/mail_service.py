"""
Lexi — Haftalık Rapor Mail Servisi
------------------------------------
Her Pazar 09:00'da çalışır.
Her öğretmene sınıflarının haftalık özetini gönderir.

Kurulum:
    pip install resend schedule

Çalıştırma:
    python -m app.services.mail_service

Production'da bir process manager ile çalıştır:
    pm2 start "python -m app.services.mail_service" --name lexi-mailer
"""

import schedule
import time
import logging
from datetime import datetime, timedelta
from typing import Optional
import resend
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.classroom import Classroom, Assignment, Submission, Enrollment

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


# ── Veri Toplama ──────────────────────────────────────────────────────

def get_weekly_stats(db: Session, classroom_id, since: datetime) -> dict:
    """Bir sınıfın son 7 günlük istatistiklerini hesaplar."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        return {}

    # Bu haftaki submission'lar
    weekly_subs = (
        db.query(Submission)
        .join(Assignment)
        .filter(
            Assignment.classroom_id == classroom_id,
            Submission.submitted_at >= since,
        )
        .all()
    )

    # Tüm öğrenciler
    enrolled = db.query(Enrollment).filter(Enrollment.classroom_id == classroom_id).all()
    total_students = len(enrolled)

    if not weekly_subs:
        return {
            "classroom_name": classroom.name,
            "level": classroom.level,
            "total_students": total_students,
            "submissions_this_week": 0,
            "avg_score": None,
            "top_student": None,
            "struggling_students": [],
            "weakest_topic": None,
            "completion_rate": 0,
        }

    scores = [float(s.score) for s in weekly_subs if s.score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    # En iyi öğrenci
    best_sub = max(weekly_subs, key=lambda s: float(s.score or 0))
    top_student = best_sub.student.full_name if best_sub.score else None

    # Zorluk çeken öğrenciler (< 60)
    struggling = [
        s.student.full_name
        for s in weekly_subs
        if s.score is not None and float(s.score) < 60
    ]

    # En çok hata yapılan konu
    topic_errors = {}
    for sub in weekly_subs:
        if not sub.feedback:
            continue
        topic = sub.assignment.topic
        wrongs = sum(1 for f in sub.feedback if not f.get("is_correct"))
        topic_errors[topic] = topic_errors.get(topic, 0) + wrongs

    weakest_topic = max(topic_errors, key=topic_errors.get) if topic_errors else None

    # Tamamlanma oranı
    completion_rate = round((len(weekly_subs) / max(total_students, 1)) * 100)

    return {
        "classroom_name": classroom.name,
        "level": classroom.level,
        "total_students": total_students,
        "submissions_this_week": len(weekly_subs),
        "avg_score": avg_score,
        "top_student": top_student,
        "struggling_students": list(set(struggling)),
        "weakest_topic": weakest_topic,
        "completion_rate": completion_rate,
    }


# ── HTML Mail Şablonu ─────────────────────────────────────────────────

def build_email_html(teacher_name: str, classrooms_stats: list[dict]) -> str:
    week_str = datetime.now().strftime("%d %B %Y")

    def score_color(score):
        if score is None: return "#6b7280"
        if score >= 80: return "#16a34a"
        if score >= 60: return "#ca8a04"
        return "#dc2626"

    def score_emoji(score):
        if score is None: return "📊"
        if score >= 80: return "🌟"
        if score >= 60: return "💪"
        return "📚"

    classroom_blocks = ""
    for stats in classrooms_stats:
        if not stats:
            continue

        avg    = stats.get("avg_score")
        color  = score_color(avg)
        emoji  = score_emoji(avg)
        avg_str = f"%{avg}" if avg is not None else "Veri yok"

        struggling_html = ""
        if stats.get("struggling_students"):
            names = ", ".join(stats["struggling_students"][:3])
            more  = len(stats["struggling_students"]) - 3
            struggling_html = f"""
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">⚠️ Destek gereken öğrenciler</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#dc2626;font-size:14px;">
                {names}{"..." if more > 0 else ""}
              </td>
            </tr>"""

        classroom_blocks += f"""
        <div style="background:#ffffff;border-radius:16px;padding:28px;margin-bottom:20px;border:1px solid #e5e7eb;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:800;color:#111827;">{stats['classroom_name']}</h2>
              <span style="font-size:13px;color:#6b7280;">{stats['level']} · {stats['total_students']} öğrenci</span>
            </div>
            <div style="text-align:center;background:{color}15;border-radius:12px;padding:12px 20px;">
              <div style="font-size:28px;font-weight:900;color:{color};">{avg_str}</div>
              <div style="font-size:12px;color:{color};font-weight:600;">Haftalık Ort.</div>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">📝 Bu hafta teslim edilen</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#111827;font-size:14px;">
                {stats['submissions_this_week']} ödev
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">✅ Tamamlanma oranı</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#111827;font-size:14px;">
                %{stats['completion_rate']}
              </td>
            </tr>
            {"<tr><td style='padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;'>🌟 Bu haftanın yıldızı</td><td style='padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#16a34a;font-size:14px;'>" + stats['top_student'] + "</td></tr>" if stats.get('top_student') else ""}
            {"<tr><td style='padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;'>🎯 En çok hata yapılan konu</td><td style='padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#dc2626;font-size:14px;'>" + stats['weakest_topic'] + "</td></tr>" if stats.get('weakest_topic') else ""}
            {struggling_html}
          </table>
        </div>
        """

    if not classroom_blocks:
        classroom_blocks = """
        <div style="background:#f9fafb;border-radius:16px;padding:32px;text-align:center;color:#6b7280;">
          Bu hafta henüz ödev teslim edilmedi.
        </div>"""

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;color:#2563eb;letter-spacing:-1px;">lexi</span>
      <div style="font-size:12px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Haftalık Rapor</div>
    </div>

    <!-- Başlık kartı -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);border-radius:20px;padding:32px;margin-bottom:24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">📊</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
        Merhaba, {teacher_name.split()[0]}!
      </h1>
      <p style="margin:0;font-size:15px;color:#bfdbfe;line-height:1.6;">
        {week_str} haftasına ait sınıf özetlerin hazır.<br>
        Bu haftaki performansa bir göz atalım.
      </p>
    </div>

    <!-- Sınıf kartları -->
    {classroom_blocks}

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="http://localhost:3000/teacher" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:14px;font-weight:800;font-size:15px;">
        Paneli Aç →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Bu mail Lexi tarafından otomatik gönderilmiştir.<br>
        Mail almak istemiyorsan <a href="#" style="color:#6b7280;">buradan</a> ayarlarını değiştirebilirsin.
      </p>
      <p style="font-size:11px;color:#d1d5db;margin:8px 0 0;">© 2026 Lexi · AI destekli İngilizce öğrenim platformu</p>
    </div>

  </div>
</body>
</html>
"""


# ── Mail Gönderici ─────────────────────────────────────────────────────

def send_weekly_report(teacher: User, classrooms_stats: list[dict]):
    """Bir öğretmene haftalık rapor maili gönderir."""
    resend.api_key = settings.RESEND_API_KEY

    html = build_email_html(teacher.full_name, classrooms_stats)

    try:
        resend.Emails.send({
            "from": "Lexi <rapor@lexi.app>",
            "to": teacher.email,
            "subject": f"📊 Haftalık Rapor — {datetime.now().strftime('%d %B')}",
            "html": html,
        })
        log.info(f"✓ Mail gönderildi → {teacher.email}")
    except Exception as e:
        log.error(f"✗ Mail hatası ({teacher.email}): {e}")


def run_weekly_reports():
    """Tüm öğretmenlere haftalık rapor gönderir."""
    log.info("═══ Haftalık rapor gönderimi başlıyor ═══")
    db = SessionLocal()
    since = datetime.utcnow() - timedelta(days=7)

    try:
        teachers = db.query(User).filter(User.role == "teacher").all()
        log.info(f"{len(teachers)} öğretmen bulundu")

        for teacher in teachers:
            classrooms = db.query(Classroom).filter(
                Classroom.teacher_id == teacher.id
            ).all()

            if not classrooms:
                log.info(f"↷ {teacher.email} — sınıf yok, atlandı")
                continue

            stats = [get_weekly_stats(db, c.id, since) for c in classrooms]
            send_weekly_report(teacher, stats)

    finally:
        db.close()

    log.info("═══ Haftalık rapor gönderimi tamamlandı ═══")


# ── Zamanlayıcı ───────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("Lexi Mail Servisi başlatıldı")
    log.info("Her Pazar 09:00'da rapor gönderilecek")

    # Her Pazar 09:00'da çalıştır
    schedule.every().sunday.at("09:00").do(run_weekly_reports)

    # Geliştirme için: hemen bir kez çalıştır
    # run_weekly_reports()

    while True:
        schedule.run_pending()
        time.sleep(60)
