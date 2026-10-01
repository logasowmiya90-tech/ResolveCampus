from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLAlchemyEnum, ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


def enum_values(enum_class):
    return [member.value for member in enum_class]


class GrievanceCategory(str, Enum):
    SCHOLARSHIP = "Scholarship"
    EXAMINATION = "Examination"
    CERTIFICATES_DOCUMENTS = "Certificates/Documents"
    FEES = "Fees"
    HOSTEL = "Hostel"
    OTHER = "Other"


class GrievancePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ConfidentialityLevel(str, Enum):
    NORMAL = "NORMAL"
    CONFIDENTIAL = "CONFIDENTIAL"


class GrievanceStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Grievance(Base):
    __tablename__ = "grievances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    category: Mapped[GrievanceCategory] = mapped_column(
        SQLAlchemyEnum(
            GrievanceCategory,
            native_enum=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[GrievancePriority] = mapped_column(
        SQLAlchemyEnum(
            GrievancePriority,
            native_enum=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    confidentiality: Mapped[ConfidentialityLevel] = mapped_column(
        SQLAlchemyEnum(
            ConfidentialityLevel,
            native_enum=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    status: Mapped[GrievanceStatus] = mapped_column(
        SQLAlchemyEnum(
            GrievanceStatus,
            native_enum=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    assigned_office: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CaseEvent(Base):
    __tablename__ = "case_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    grievance_id: Mapped[int] = mapped_column(
        ForeignKey("grievances.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    is_student_visible: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("1"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )