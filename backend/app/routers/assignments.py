from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import require_teacher, require_student
from app.models.user import User
from app.models.classroom import Classroom, Assignment, Submission, Enrollment
from app.services.ai_service import (
    generate_grammar_questions, generate_reading_questions,
    generate_from_custom_text, grade_submission,
)
from app.services.curriculum import get_curriculum, get_level

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

class AssignmentCreate(BaseModel):
    classroom_id: str
    title: str
    assignment_type: str
    topic: str
    topic_key: Optional[str] = None
    text_length: Optional[str] = "medium"
    custom_text: Optional[str] = None
    level: Optional[str] = None
    grade: Optional[str] = None
    question_count: int = 5
    due_date: Optional[str] = None

class SubmitAnswers(BaseModel):
    answers: dict

def _adict(a, with_q=False, with_ans=False):
    d = {"id":str(a.id),"title":a.title,"assignment_type":a.assignment_type,"topic":a.topic,
         "grade":a.grade,"level":a.level,"question_count":a.question_count,"status":a.status,
         "passage":a.passage,"due_date":a.due_date.isoformat() if a.due_date else None,
         "created_at":a.created_at.isoformat()}
    if with_q:
        qs = a.questions or []
        if not with_ans:
            qs = [{k:v for k,v in q.items() if k!="answer"} for q in qs]
        d["questions"] = qs
    return d

@router.get("/curriculum/{grade}")
def curriculum(grade: str, _: User = Depends(require_teacher)):
    data = get_curriculum(grade)
    return {"grade":grade,"level":data["level"],"grammar":data["grammar"],"reading":data["reading"]}

@router.post("", status_code=201)
async def create_assignment(data: AssignmentCreate, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.id==data.classroom_id, Classroom.teacher_id==teacher.id).first()
    if not classroom: raise HTTPException(404,"Sınıf bulunamadı")
    grade = data.grade or classroom.grade or "10"
    level = data.level or get_level(grade)
    questions, passage = [], None
    if data.assignment_type == "grammar":
        questions = await generate_grammar_questions(data.topic, level, data.question_count, grade)
    elif data.assignment_type == "reading":
        if data.custom_text:
            questions = await generate_from_custom_text(data.custom_text, level, data.question_count, grade)
            passage = {"title":data.topic,"text":data.custom_text}
        else:
            result = await generate_reading_questions(data.topic, data.topic_key or "general", level, data.question_count, grade, data.text_length or "medium")
            questions, passage = result["questions"], result["passage"]
    else:
        raise HTTPException(400,"assignment_type grammar veya reading olmalı")
    a = Assignment(classroom_id=classroom.id, title=data.title, assignment_type=data.assignment_type,
                   topic=data.topic, grade=grade, level=level, question_count=len(questions),
                   questions=questions, passage=passage, custom_text=data.custom_text, status="draft")
    db.add(a); db.commit(); db.refresh(a)
    return _adict(a, with_q=True, with_ans=True)

@router.get("/preview/{assignment_id}")
def preview(assignment_id: str, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(Assignment.id==assignment_id).first()
    if not a: raise HTTPException(404,"Ödev bulunamadı")
    if not db.query(Classroom).filter(Classroom.id==a.classroom_id, Classroom.teacher_id==teacher.id).first():
        raise HTTPException(403,"Erişim izni yok")
    return _adict(a, with_q=True, with_ans=True)

@router.post("/{assignment_id}/approve")
def approve(assignment_id: str, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(Assignment.id==assignment_id).first()
    if not a: raise HTTPException(404,"Ödev bulunamadı")
    if not db.query(Classroom).filter(Classroom.id==a.classroom_id, Classroom.teacher_id==teacher.id).first():
        raise HTTPException(403,"Erişim izni yok")
    a.status = "approved"; db.commit()
    return {"message":"Ödev onaylandı. Öğrenciler artık görebilir.","id":str(a.id)}

@router.post("/{assignment_id}/regenerate")
async def regenerate(assignment_id: str, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(Assignment.id==assignment_id).first()
    if not a: raise HTTPException(404,"Ödev bulunamadı")
    if not db.query(Classroom).filter(Classroom.id==a.classroom_id, Classroom.teacher_id==teacher.id).first():
        raise HTTPException(403,"Erişim izni yok")
    if a.status == "approved": raise HTTPException(400,"Onaylanmış ödev yeniden üretilemez")
    questions, passage = [], None
    if a.assignment_type == "grammar":
        questions = await generate_grammar_questions(a.topic, a.level, a.question_count, a.grade or "10")
    else:
        if a.custom_text:
            questions = await generate_from_custom_text(a.custom_text, a.level, a.question_count, a.grade or "10")
            passage = {"title":a.topic,"text":a.custom_text}
        else:
            result = await generate_reading_questions(a.topic,"general",a.level,a.question_count,a.grade or "10")
            questions, passage = result["questions"], result["passage"]
    a.questions, a.passage, a.status = questions, passage, "draft"; db.commit()
    return _adict(a, with_q=True, with_ans=True)

@router.get("/{assignment_id}/results")
def results(assignment_id: str, teacher: User = Depends(require_teacher), db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(Assignment.id==assignment_id).first()
    if not a: raise HTTPException(404,"Ödev bulunamadı")
    classroom = db.query(Classroom).filter(Classroom.id==a.classroom_id, Classroom.teacher_id==teacher.id).first()
    if not classroom: raise HTTPException(403,"Erişim izni yok")
    subs = db.query(Submission).filter(Submission.assignment_id==a.id).all()
    enrolled = db.query(Enrollment).filter(Enrollment.classroom_id==classroom.id).all()
    scores = [float(s.score) for s in subs if s.score is not None]
    return {
        "assignment_title":a.title,"assignment_type":a.assignment_type,
        "total_students":len(enrolled),"submitted_count":len(subs),
        "avg_score":round(sum(scores)/len(scores),1) if scores else None,
        "results":[{
            "student_id":str(e.student_id),"full_name":e.student.full_name,
            "submitted":any(s.student_id==e.student_id for s in subs),
            "score":next((float(s.score) for s in subs if s.student_id==e.student_id and s.score is not None),None),
            "submitted_at":next((s.submitted_at.isoformat() for s in subs if s.student_id==e.student_id),None),
        } for e in enrolled],
    }

@router.get("/my")
def my_assignments(student: User = Depends(require_student), db: Session = Depends(get_db)):
    cids = [e.classroom_id for e in db.query(Enrollment).filter(Enrollment.student_id==student.id).all()]
    assignments = db.query(Assignment).filter(Assignment.classroom_id.in_(cids), Assignment.status=="approved").order_by(Assignment.created_at.desc()).all()
    result = []
    for a in assignments:
        sub = db.query(Submission).filter(Submission.assignment_id==a.id, Submission.student_id==student.id).first()
        result.append({"id":str(a.id),"title":a.title,"assignment_type":a.assignment_type,"topic":a.topic,
                        "level":a.level,"grade":a.grade,"question_count":a.question_count,
                        "classroom_name":a.classroom.name,"due_date":a.due_date.isoformat() if a.due_date else None,
                        "status":"completed" if sub else "pending",
                        "score":float(sub.score) if sub and sub.score is not None else None})
    return result

@router.get("/{assignment_id}")
def get_assignment(assignment_id: str, student: User = Depends(require_student), db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(Assignment.id==assignment_id).first()
    if not a: raise HTTPException(404,"Ödev bulunamadı")
    if a.status != "approved": raise HTTPException(403,"Bu ödev henüz yayınlanmadı")
    if not db.query(Enrollment).filter(Enrollment.student_id==student.id, Enrollment.classroom_id==a.classroom_id).first():
        raise HTTPException(403,"Erişim izni yok")
    sub = db.query(Submission).filter(Submission.assignment_id==a.id, Submission.student_id==student.id).first()
    safe_q = [{k:v for k,v in q.items() if k!="answer"} for q in (a.questions or [])]
    return {"id":str(a.id),"title":a.title,"assignment_type":a.assignment_type,"topic":a.topic,
            "level":a.level,"passage":a.passage,"questions":safe_q,
            "already_submitted":sub is not None,
            "score":float(sub.score) if sub and sub.score is not None else None,
            "feedback":sub.feedback if sub else None}

@router.post("/{assignment_id}/submit")
def submit(assignment_id: str, data: SubmitAnswers, student: User = Depends(require_student), db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(Assignment.id==assignment_id).first()
    if not a: raise HTTPException(404,"Ödev bulunamadı")
    if a.status != "approved": raise HTTPException(403,"Bu ödev henüz yayınlanmadı")
    if not db.query(Enrollment).filter(Enrollment.student_id==student.id, Enrollment.classroom_id==a.classroom_id).first():
        raise HTTPException(403,"Erişim izni yok")
    if db.query(Submission).filter(Submission.assignment_id==a.id, Submission.student_id==student.id).first():
        raise HTTPException(400,"Bu ödevi zaten teslim ettiniz")
    score, feedback = grade_submission(a.questions or [], data.answers)
    db.add(Submission(assignment_id=a.id, student_id=student.id, answers=data.answers, feedback=feedback, score=score))
    db.commit()
    return {"score":score,"feedback":feedback}
