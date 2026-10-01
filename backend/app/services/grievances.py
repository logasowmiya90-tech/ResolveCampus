from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.grievance import (
    CaseEvent,
    Grievance,
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
)
from app.schemas.grievance import GrievanceCreate


OFFICE_BY_CATEGORY = {
    GrievanceCategory.SCHOLARSHIP: "Scholarship Office",
    GrievanceCategory.EXAMINATION: "Examination Office",
    GrievanceCategory.CERTIFICATES_DOCUMENTS: "Academic/Records Office",
    GrievanceCategory.FEES: "Accounts Office",
    GrievanceCategory.HOSTEL: "Hostel Administration",
    GrievanceCategory.OTHER: "General Administration",
}

DEADLINE_DAYS_BY_PRIORITY = {
    GrievancePriority.LOW: 7,
    GrievancePriority.MEDIUM: 5,
    GrievancePriority.HIGH: 3,
}


def create_grievance(db: Session, student_id: int, request: GrievanceCreate) -> Grievance:
    now = datetime.now(timezone.utc)
    grievance = Grievance(
        case_id=f"PENDING-{uuid4().hex}",
        student_id=student_id,
        category=request.category,
        title=request.title.strip(),
        description=request.description.strip(),
        priority=request.priority,
        confidentiality=request.confidentiality,
        status=GrievanceStatus.SUBMITTED,
        assigned_office=OFFICE_BY_CATEGORY[request.category],
        created_at=now,
        updated_at=now,
        deadline=now + timedelta(days=DEADLINE_DAYS_BY_PRIORITY[request.priority]),
    )

    try:
        db.add(grievance)
        db.flush()
        grievance.case_id = f"RC-{now.year}-{grievance.id:04d}"
        db.add(
            CaseEvent(
                grievance_id=grievance.id,
                actor_id=student_id,
                event_type="SUBMITTED",
                description="Grievance submitted",
                created_at=now,
            )
        )
        db.commit()
        db.refresh(grievance)
    except Exception:
        db.rollback()
        raise

    return grievance


def list_student_grievances(db: Session, student_id: int) -> list[Grievance]:
    statement = (
        select(Grievance)
        .where(Grievance.student_id == student_id)
        .order_by(Grievance.created_at.desc(), Grievance.id.desc())
    )
    return list(db.scalars(statement).all())


def get_student_grievance(db: Session, student_id: int, case_id: str) -> Grievance | None:
    statement = select(Grievance).where(
        Grievance.case_id == case_id,
        Grievance.student_id == student_id,
    )
    return db.scalar(statement)


def list_grievance_events(db: Session, grievance_id: int) -> list[CaseEvent]:
    statement = (
        select(CaseEvent)
        .where(
            CaseEvent.grievance_id == grievance_id,
            CaseEvent.is_student_visible.is_(True),
        )
        .order_by(CaseEvent.created_at.asc(), CaseEvent.id.asc())
    )
    return list(db.scalars(statement).all())