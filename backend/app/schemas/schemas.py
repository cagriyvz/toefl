from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # "teacher" | "student"

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    user_id: str

# ── Classroom ─────────────────────────────────────────────────────────
class ClassroomCreate(BaseModel):
    name: str
    level: str

class ClassroomOut(BaseModel):
    id: UUID
    name: str
    level: str
    join_code: str
    student_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class JoinClassRequest(BaseModel):
    join_code: str

# ── Assignment ────────────────────────────────────────────────────────
class AssignmentCreate(BaseModel):
    classroom_id: UUID
    title: str
    topic: str
    level: str
    question_count: int = 5
    due_date: Optional[datetime] = None

class AssignmentOut(BaseModel):
    id: UUID
    classroom_id: UUID
    title: str
    topic: str
    level: str
    question_count: int
    questions: Optional[List[Any]] = None
    due_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Submission ────────────────────────────────────────────────────────
class SubmitAnswersRequest(BaseModel):
    answers: dict  # {"1": "has lived", "2": "have / eaten"}

class SubmissionOut(BaseModel):
    id: UUID
    score: Optional[float]
    feedback: Optional[List[Any]]
    submitted_at: datetime

    class Config:
        from_attributes = True

class StudentResultOut(BaseModel):
    student_id: UUID
    full_name: str
    score: Optional[float]
    submitted_at: Optional[datetime]

# ── Classroom Detail (öğretmen görünümü) ──────────────────────────────
class ClassroomDetailOut(BaseModel):
    id: UUID
    name: str
    level: str
    join_code: str
    students: List[dict]
    assignments: List[AssignmentOut]
