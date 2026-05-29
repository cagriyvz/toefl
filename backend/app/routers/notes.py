from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user, require_teacher
from app.models.user import User
from app.models.notes import Note, SupportTicket

router = APIRouter(tags=["notes & support"])


# ════════════════════════════════════════════════════
# NOTLAR
# ════════════════════════════════════════════════════

class NoteCreate(BaseModel):
    content: str
    target_id: Optional[str] = None      # öğretmen → öğrenci için; yoksa kendine
    classroom_id: Optional[str] = None


@router.post("/api/notes", status_code=201)
def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_id = data.target_id or str(current_user.id)

    # Öğrenci sadece kendi notunu ekleyebilir
    if current_user.role == "student" and target_id != str(current_user.id):
        raise HTTPException(403, "Öğrenciler sadece kendilerine not ekleyebilir")

    note = Note(
        author_id=current_user.id,
        target_id=target_id,
        classroom_id=data.classroom_id or None,
        content=data.content,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id": str(note.id),
        "content": note.content,
        "author": current_user.full_name,
        "created_at": note.created_at.isoformat(),
    }


@router.get("/api/notes/my")
def my_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Öğrenci kendi notlarını görür. Öğretmen yazdıklarını görür."""
    if current_user.role == "student":
        notes = db.query(Note).filter(Note.target_id == current_user.id).order_by(Note.created_at.desc()).all()
    else:
        notes = db.query(Note).filter(Note.author_id == current_user.id).order_by(Note.created_at.desc()).all()

    return [
        {
            "id": str(n.id),
            "content": n.content,
            "author": n.author.full_name,
            "target": n.target.full_name,
            "classroom": n.classroom.name if n.classroom else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notes
    ]


@router.get("/api/notes/student/{student_id}")
def student_notes(
    student_id: str,
    teacher: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Öğretmen bir öğrencinin notlarını görür."""
    notes = db.query(Note).filter(
        Note.target_id == student_id,
        Note.author_id == teacher.id,
    ).order_by(Note.created_at.desc()).all()
    return [
        {
            "id": str(n.id),
            "content": n.content,
            "created_at": n.created_at.isoformat(),
            "classroom": n.classroom.name if n.classroom else None,
        }
        for n in notes
    ]


@router.delete("/api/notes/{note_id}")
def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id, Note.author_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "Not bulunamadı")
    db.delete(note)
    db.commit()
    return {"message": "Silindi"}


# ════════════════════════════════════════════════════
# DESTEK
# ════════════════════════════════════════════════════

class TicketCreate(BaseModel):
    subject: str
    message: str


@router.post("/api/support", status_code=201)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=data.subject,
        message=data.message,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {
        "id": str(ticket.id),
        "subject": ticket.subject,
        "status": ticket.status,
        "created_at": ticket.created_at.isoformat(),
        "message": "Talebiniz alındı. En kısa sürede yanıt vereceğiz.",
    }


@router.get("/api/support/my")
def my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tickets = db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id
    ).order_by(SupportTicket.created_at.desc()).all()
    return [
        {
            "id": str(t.id),
            "subject": t.subject,
            "message": t.message,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
        }
        for t in tickets
    ]
