import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Note(Base):
    __tablename__ = "notes"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Kim yazdı
    author_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Kime yazıldı (öğretmen → öğrenci veya öğrenci → kendisi)
    target_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Hangi sınıf bağlamında (opsiyonel)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=True)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author     = relationship("User", foreign_keys=[author_id])
    target     = relationship("User", foreign_keys=[target_id])
    classroom  = relationship("Classroom")


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject    = Column(String, nullable=False)
    message    = Column(Text, nullable=False)
    status     = Column(Enum("open","answered","closed", name="ticket_status"), default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User", foreign_keys=[user_id])
