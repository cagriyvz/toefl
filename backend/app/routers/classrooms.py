from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import require_teacher, require_student, get_current_user
from app.models.user import User
from app.models.classroom import Classroom, Enrollment
from app.schemas.schemas import ClassroomCreate, ClassroomOut, JoinClassRequest

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None

router = APIRouter(prefix="/api/classrooms", tags=["classrooms"])


# ── ÖĞRETMEN: sınıf oluştur ───────────────────────────────────────────
@router.post("", status_code=201)
def create_classroom(
    data: ClassroomCreate,
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classroom = Classroom(
        teacher_id=teacher.id,
        name=data.name,
        level=data.level,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return {
        "id": str(classroom.id),
        "name": classroom.name,
        "level": classroom.level,
        "join_code": classroom.join_code,
        "student_count": 0,
    }


# ── ÖĞRETMEN: kendi sınıflarını listele ───────────────────────────────
@router.get("/my", response_model=List[dict])
def my_classrooms(
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classrooms = db.query(Classroom).filter(Classroom.teacher_id == teacher.id).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "level": c.level,
            "join_code": c.join_code,
            "student_count": len(c.enrollments),
        }
        for c in classrooms
    ]


# ── ÖĞRETMEN: sınıf detayı (öğrenciler + ödevler + notlar) ───────────
@router.get("/{classroom_id}/detail")
def classroom_detail(
    classroom_id: str,
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(
        Classroom.id == classroom_id,
        Classroom.teacher_id == teacher.id,
    ).first()
    if not classroom:
        raise HTTPException(404, "Sınıf bulunamadı")

    students = []
    for enrollment in classroom.enrollments:
        student = enrollment.student
        # Bu sınıftaki ödev submission'larını çek
        from app.models.classroom import Assignment, Submission
        subs = db.query(Submission).join(Assignment).filter(
            Assignment.classroom_id == classroom.id,
            Submission.student_id == student.id,
        ).all()
        avg_score = None
        if subs:
            scores = [float(s.score) for s in subs if s.score is not None]
            avg_score = round(sum(scores) / len(scores), 1) if scores else None

        students.append({
            "id": str(student.id),
            "full_name": student.full_name,
            "email": student.email,
            "submission_count": len(subs),
            "avg_score": avg_score,
        })

    assignments = []
    for a in classroom.assignments:
        from app.models.classroom import Submission
        subs = db.query(Submission).filter(Submission.assignment_id == a.id).all()
        scores = [float(s.score) for s in subs if s.score is not None]
        assignments.append({
            "id": str(a.id),
            "title": a.title,
            "topic": a.topic,
            "level": a.level,
            "question_count": a.question_count,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "created_at": a.created_at.isoformat(),
            "submission_count": len(subs),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else None,
        })

    return {
        "id": str(classroom.id),
        "name": classroom.name,
        "level": classroom.level,
        "join_code": classroom.join_code,
        "students": students,
        "assignments": assignments,
    }


# ── ÖĞRENCİ: join code ile sınıfa katıl ──────────────────────────────
@router.post("/join")
def join_classroom(
    data: JoinClassRequest,
    student: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(Classroom.join_code == data.join_code.upper()).first()
    if not classroom:
        raise HTTPException(404, "Geçersiz katılım kodu")

    already = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.classroom_id == classroom.id,
    ).first()
    if already:
        raise HTTPException(400, "Zaten bu sınıftasın")

    enrollment = Enrollment(student_id=student.id, classroom_id=classroom.id)
    db.add(enrollment)
    db.commit()
    return {"message": f"'{classroom.name}' sınıfına katıldın!", "classroom_id": str(classroom.id)}


# ── ÖĞRENCİ: kayıtlı olduğu sınıflar ────────────────────────────────
@router.get("/enrolled")
def enrolled_classrooms(
    student: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    return [
        {
            "id": str(e.classroom.id),
            "name": e.classroom.name,
            "level": e.classroom.level,
            "teacher_name": e.classroom.teacher.full_name,
        }
        for e in enrollments
    ]


# ── ÖĞRETMEN: join kodu ile sınıf ara ────────────────────────────────
@router.get("/search")
def search_by_code(
    code: str,
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(
        Classroom.join_code == code.upper(),
        Classroom.teacher_id == teacher.id,
    ).first()
    if not classroom:
        raise HTTPException(404, "Bu koda ait sınıf bulunamadı")
    return {
        "id": str(classroom.id),
        "name": classroom.name,
        "level": classroom.level,
        "join_code": classroom.join_code,
        "student_count": len(classroom.enrollments),
    }


# ── ÖĞRETMEN: sınıf seviyesi / adı güncelle ──────────────────────────
@router.patch("/{classroom_id}")
def update_classroom(
    classroom_id: str,
    data: ClassroomUpdate,
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(
        Classroom.id == classroom_id,
        Classroom.teacher_id == teacher.id,
    ).first()
    if not classroom:
        raise HTTPException(404, "Sınıf bulunamadı")

    if data.name  is not None: classroom.name  = data.name
    if data.level is not None: classroom.level = data.level
    db.commit()
    db.refresh(classroom)
    return {
        "id": str(classroom.id),
        "name": classroom.name,
        "level": classroom.level,
        "join_code": classroom.join_code,
        "student_count": len(classroom.enrollments),
    }


# ── ÖĞRETMEN: birden fazla sınıfa toplu ödev ata ─────────────────────
@router.post("/bulk-assign")
async def bulk_assign(
    data: dict,          # { classroom_ids: [...], title, topic, level, question_count }
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    from app.models.classroom import Assignment
    from app.services.ai_service import generate_questions

    classroom_ids = data.get("classroom_ids", [])
    if not classroom_ids:
        raise HTTPException(400, "En az bir sınıf seç")

    # Tüm sınıflar öğretmene ait mi?
    classrooms = db.query(Classroom).filter(
        Classroom.id.in_(classroom_ids),
        Classroom.teacher_id == teacher.id,
    ).all()
    if len(classrooms) != len(classroom_ids):
        raise HTTPException(403, "Bazı sınıflar sana ait değil")

    # Soruları bir kez üret — her sınıfa aynı set
    questions = await generate_questions(
        data.get("topic", ""),
        data.get("level", "B1"),
        int(data.get("question_count", 5)),
    )

    created = []
    for c in classrooms:
        a = Assignment(
            classroom_id=c.id,
            title=data.get("title", "Ödev"),
            topic=data.get("topic", ""),
            level=data.get("level", "B1"),
            question_count=len(questions),
            questions=questions,
        )
        db.add(a)
        created.append(c.name)

    db.commit()
    return {
        "message": f"Ödev {len(created)} sınıfa atandı: {', '.join(created)}",
        "question_count": len(questions),
        "classrooms": created,
    }
