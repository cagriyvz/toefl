import uuid
import random
import string
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Numeric, JSON, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

def generate_join_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Classroom(Base):
    __tablename__ = "classrooms"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name         = Column(String, nullable=False)
    grade        = Column(String, nullable=True)   # "9","10","11","12"
    level        = Column(String, nullable=False)
    join_code    = Column(String(6), unique=True, nullable=False, default=generate_join_code)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    teacher      = relationship("User", back_populates="taught_classes", foreign_keys=[teacher_id])
    enrollments  = relationship("Enrollment", back_populates="classroom", cascade="all, delete")
    assignments  = relationship("Assignment", back_populates="classroom", cascade="all, delete")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    joined_at    = Column(DateTime(timezone=True), server_default=func.now())

    student      = relationship("User", back_populates="enrollments")
    classroom    = relationship("Classroom", back_populates="enrollments")


class Assignment(Base):
    __tablename__ = "assignments"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id    = Column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    title           = Column(String, nullable=False)
    assignment_type = Column(Enum("grammar","reading", name="assignment_type"), default="grammar")
    topic           = Column(String, nullable=False)
    grade           = Column(String, nullable=True)   # "9","10","11","12"
    level           = Column(String, nullable=False)
    question_count  = Column(Integer, default=5)
    questions       = Column(JSON, nullable=True)
    passage         = Column(JSON, nullable=True)     # {"title":..., "text":...} reading için
    custom_text     = Column(Text, nullable=True)     # öğretmenin kendi metni
    # draft = Claude üretti, öğretmen henüz onaylamadı
    # approved = öğretmen onayladı, öğrenciler görebilir
    status          = Column(Enum("draft","approved", name="assignment_status"), default="draft")
    due_date        = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    classroom       = relationship("Classroom", back_populates="assignments")
    submissions     = relationship("Submission", back_populates="assignment", cascade="all, delete")


class Submission(Base):
    __tablename__ = "submissions"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    student_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    answers       = Column(JSON, nullable=True)
    feedback      = Column(JSON, nullable=True)
    score         = Column(Numeric(5, 2), nullable=True)
    submitted_at  = Column(DateTime(timezone=True), server_default=func.now())

    assignment    = relationship("Assignment", back_populates="submissions")
    student       = relationship("User", back_populates="submissions")
