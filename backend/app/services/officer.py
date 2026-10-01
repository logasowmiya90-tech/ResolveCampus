from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.grievance import (
    CaseEvent,
    ConfidentialityLevel,
    Grievance,
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
)
from app.models.user import User
from app.schemas.officer import (
    OfficerCaseDetailsResponse,
    OfficerCaseEventResponse,
    OfficerDashboardCounts,
    OfficerDashboardResponse,
    OfficerGrievanceListItem,
)


ALLOWED_STATUS_TRANSITIONS = {
    GrievanceStatus.SUBMITTED: {GrievanceStatus.ASSIGNED},
    GrievanceStatus.ASSIGNED: {GrievanceStatus.IN_PROGRESS},
    GrievanceStatus.IN_PROGRESS: {GrievanceStatus.RESOLVED},
    GrievanceStatus.RESOLVED: {GrievanceStatus.CLOSED},
    GrievanceStatus.CLOSED: set(),
}

FINAL_STATUSES = {GrievanceStatus.RESOLVED, GrievanceStatus.CLOSED}
IN_PROGRESS_STATUSES = {GrievanceStatus.ASSIGNED, GrievanceStatus.IN_PROGRESS}


class InvalidStatusTransition(Exception):
    pass


def _office_cases(
    db: Session,
    office_name: str,
    can_access_confidential: bool,
) -> list[Grievance]:
    filters = [Grievance.assigned_office == office_name]
    if not can_access_confidential:
        filters.append(Grievance.confidentiality != ConfidentialityLevel.CONFIDENTIAL)
    statement = select(Grievance).where(*filters).order_by(
        Grievance.created_at.desc(), Grievance.id.desc()
    )
    return list(db.scalars(statement).all())


def _is_overdue(grievance: Grievance, now: datetime) -> bool:
    if grievance.status in FINAL_STATUSES:
        return False
    deadline = grievance.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return deadline < now


def get_officer_dashboard(
    db: Session,
    office_name: str,
    status: GrievanceStatus | None = None,
    priority: GrievancePriority | None = None,
    category: GrievanceCategory | None = None,
    search: str | None = None,
    can_access_confidential: bool = False,
) -> OfficerDashboardResponse:
    cases = _office_cases(db, office_name, can_access_confidential)
    now = datetime.now(timezone.utc)
    counts = OfficerDashboardCounts(
        total_assigned_cases=len(cases),
        submitted_cases=sum(case.status == GrievanceStatus.SUBMITTED for case in cases),
        in_progress_cases=sum(case.status in IN_PROGRESS_STATUSES for case in cases),
        resolved_cases=sum(case.status in FINAL_STATUSES for case in cases),
        overdue_cases=sum(_is_overdue(case, now) for case in cases),
    )

    search_text = search.strip().casefold() if search else ""
    filtered_cases = [
        case
        for case in cases
        if (status is None or case.status == status)
        and (priority is None or case.priority == priority)
        and (category is None or case.category == category)
        and (
            not search_text
            or search_text in case.case_id.casefold()
            or search_text in case.title.casefold()
        )
    ]

    items = [
        OfficerGrievanceListItem(
            case_id=case.case_id,
            category=case.category,
            title=case.title,
            priority=case.priority,
            status=case.status,
            assigned_office=case.assigned_office,
            created_at=case.created_at,
            deadline=case.deadline,
            is_overdue=_is_overdue(case, now),
        )
        for case in filtered_cases
    ]
    return OfficerDashboardResponse(office_name=office_name, counts=counts, grievances=items)


def _get_officer_case_row(
    db: Session,
    office_name: str,
    case_id: str,
    can_access_confidential: bool,
):
    filters = [
        Grievance.case_id == case_id,
        Grievance.assigned_office == office_name,
    ]
    if not can_access_confidential:
        filters.append(Grievance.confidentiality != ConfidentialityLevel.CONFIDENTIAL)
    statement = (
        select(Grievance, User.name)
        .join(User, User.id == Grievance.student_id)
        .where(*filters)
    )
    return db.execute(statement).first()


def get_officer_case(
    db: Session,
    office_name: str,
    case_id: str,
    can_access_confidential: bool,
) -> OfficerCaseDetailsResponse | None:
    row = _get_officer_case_row(db, office_name, case_id, can_access_confidential)
    if row is None:
        return None

    grievance, student_name = row
    events_statement = (
        select(CaseEvent)
        .where(CaseEvent.grievance_id == grievance.id)
        .order_by(CaseEvent.created_at.asc(), CaseEvent.id.asc())
    )
    events = [
        OfficerCaseEventResponse.model_validate(event)
        for event in db.scalars(events_statement).all()
    ]
    return OfficerCaseDetailsResponse(
        case_id=grievance.case_id,
        category=grievance.category,
        title=grievance.title,
        description=grievance.description,
        priority=grievance.priority,
        confidentiality=grievance.confidentiality,
        status=grievance.status,
        assigned_office=grievance.assigned_office,
        student_reference=student_name,
        created_at=grievance.created_at,
        updated_at=grievance.updated_at,
        deadline=grievance.deadline,
        resolved_at=grievance.resolved_at,
        timeline=events,
    )


def update_case_status(
    db: Session,
    office_name: str,
    case_id: str,
    actor_id: int,
    new_status: GrievanceStatus,
    can_access_confidential: bool,
) -> Grievance | None:
    row = _get_officer_case_row(db, office_name, case_id, can_access_confidential)
    if row is None:
        return None

    grievance = row[0]
    if new_status not in ALLOWED_STATUS_TRANSITIONS[grievance.status]:
        raise InvalidStatusTransition(
            f"Cannot change status from {grievance.status.value} to {new_status.value}"
        )

    now = datetime.now(timezone.utc)
    old_status = grievance.status
    grievance.status = new_status
    grievance.updated_at = now
    if new_status == GrievanceStatus.RESOLVED:
        grievance.resolved_at = now

    db.add(
        CaseEvent(
            grievance_id=grievance.id,
            actor_id=actor_id,
            event_type="STATUS_CHANGED",
            description=f"Status changed from {old_status.value} to {new_status.value}",
            created_at=now,
            is_student_visible=True,
        )
    )
    db.commit()
    db.refresh(grievance)
    return grievance


def add_officer_note(
    db: Session,
    office_name: str,
    case_id: str,
    actor_id: int,
    description: str,
    can_access_confidential: bool,
) -> CaseEvent | None:
    row = _get_officer_case_row(db, office_name, case_id, can_access_confidential)
    if row is None:
        return None

    grievance = row[0]
    now = datetime.now(timezone.utc)
    event = CaseEvent(
        grievance_id=grievance.id,
        actor_id=actor_id,
        event_type="OFFICER_NOTE",
        description=description.strip(),
        created_at=now,
        is_student_visible=False,
    )
    db.add(event)
    grievance.updated_at = now
    db.commit()
    db.refresh(event)
    return event