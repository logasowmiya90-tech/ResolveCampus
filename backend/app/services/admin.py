from datetime import datetime, timezone

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.models.grievance import (
    CaseEvent,
    ConfidentialityLevel,
    Grievance,
    GrievanceCategory,
    GrievanceStatus,
)
from app.models.user import User
from app.schemas.admin import (
    AdminCaseDetailsResponse,
    AdminCaseEvent,
    AdminSummaryResponse,
    CategoryCount,
    OfficePerformance,
    OverdueCase,
    RecurringAnalysisResponse,
    StatusCount,
)
from app.services.grievances import OFFICE_BY_CATEGORY


FINAL_STATUSES = (GrievanceStatus.RESOLVED, GrievanceStatus.CLOSED)
OPEN_STATUS_VALUES = (
    GrievanceStatus.SUBMITTED,
    GrievanceStatus.ASSIGNED,
    GrievanceStatus.IN_PROGRESS,
)
ALL_OFFICES = tuple(dict.fromkeys(OFFICE_BY_CATEGORY.values()))


def _visible_filters(admin: User) -> list:
    if admin.can_access_confidential:
        return []
    return [Grievance.confidentiality != ConfidentialityLevel.CONFIDENTIAL]


def _count(db: Session, filters: list, *conditions) -> int:
    statement = select(func.count(Grievance.id)).where(*filters, *conditions)
    return db.scalar(statement) or 0


def _average_resolution_seconds(db: Session, filters: list, *conditions) -> float | None:
    duration_seconds = (
        func.julianday(Grievance.resolved_at) - func.julianday(Grievance.created_at)
    ) * 86400.0
    statement = select(func.avg(duration_seconds)).where(
        *filters,
        Grievance.resolved_at.is_not(None),
        *conditions,
    )
    result = db.scalar(statement)
    return float(result) if result is not None else None


def get_admin_summary(db: Session, admin: User) -> AdminSummaryResponse:
    filters = _visible_filters(admin)
    now = datetime.now(timezone.utc)
    open_condition = Grievance.status.not_in(FINAL_STATUSES)
    overdue_condition = and_(open_condition, Grievance.deadline < now)
    return AdminSummaryResponse(
        total_grievances=_count(db, filters),
        open_grievances=_count(db, filters, open_condition),
        in_progress=_count(db, filters, Grievance.status == GrievanceStatus.IN_PROGRESS),
        resolved=_count(db, filters, Grievance.status.in_(FINAL_STATUSES)),
        overdue=_count(db, filters, overdue_condition),
        average_resolution_seconds=_average_resolution_seconds(db, filters),
        resolved_within_deadline=_count(
            db,
            filters,
            Grievance.resolved_at.is_not(None),
            Grievance.resolved_at <= Grievance.deadline,
        ),
        resolved_after_deadline=_count(
            db,
            filters,
            Grievance.resolved_at.is_not(None),
            Grievance.resolved_at > Grievance.deadline,
        ),
    )


def get_category_counts(db: Session, admin: User) -> list[CategoryCount]:
    filters = _visible_filters(admin)
    statement = (
        select(Grievance.category, func.count(Grievance.id))
        .where(*filters)
        .group_by(Grievance.category)
    )
    counts = {category: total for category, total in db.execute(statement)}
    return [CategoryCount(category=category, total_cases=counts.get(category, 0)) for category in GrievanceCategory]


def get_status_counts(db: Session, admin: User) -> list[StatusCount]:
    filters = _visible_filters(admin)
    statement = (
        select(Grievance.status, func.count(Grievance.id))
        .where(*filters)
        .group_by(Grievance.status)
    )
    counts = {status: total for status, total in db.execute(statement)}
    return [StatusCount(status=status, total_cases=counts.get(status, 0)) for status in GrievanceStatus]


def get_office_performance(db: Session, admin: User) -> list[OfficePerformance]:
    filters = _visible_filters(admin)
    now = datetime.now(timezone.utc)
    resolved_case = Grievance.status.in_(FINAL_STATUSES)
    open_case = Grievance.status.not_in(FINAL_STATUSES)
    overdue_case = and_(open_case, Grievance.deadline < now)
    average_seconds = (
        func.avg(
            (func.julianday(Grievance.resolved_at) - func.julianday(Grievance.created_at))
            * 86400.0
        )
    )
    statement = (
        select(
            Grievance.assigned_office,
            func.count(Grievance.id),
            func.sum(case((open_case, 1), else_=0)),
            func.sum(case((resolved_case, 1), else_=0)),
            func.sum(case((overdue_case, 1), else_=0)),
            average_seconds,
        )
        .where(*filters)
        .group_by(Grievance.assigned_office)
    )
    metrics = {
        office: (total, opened or 0, resolved or 0, overdue or 0, float(average) if average is not None else None)
        for office, total, opened, resolved, overdue, average in db.execute(statement)
    }
    office_names = list(ALL_OFFICES)
    office_names.extend(sorted(set(metrics) - set(office_names)))
    return [
        OfficePerformance(
            office=office,
            total_cases=metrics.get(office, (0, 0, 0, 0, None))[0],
            open_cases=metrics.get(office, (0, 0, 0, 0, None))[1],
            resolved_cases=metrics.get(office, (0, 0, 0, 0, None))[2],
            overdue_cases=metrics.get(office, (0, 0, 0, 0, None))[3],
            average_resolution_seconds=metrics.get(office, (0, 0, 0, 0, None))[4],
        )
        for office in office_names
    ]


def get_overdue_cases(db: Session, admin: User) -> list[OverdueCase]:
    filters = _visible_filters(admin)
    now = datetime.now(timezone.utc)
    statement = (
        select(
            Grievance.case_id,
            Grievance.category,
            Grievance.assigned_office,
            Grievance.priority,
            Grievance.status,
            Grievance.deadline,
        )
        .where(
            *filters,
            Grievance.status.not_in(FINAL_STATUSES),
            Grievance.deadline < now,
        )
        .order_by(Grievance.deadline.asc())
    )
    results = []
    for case_id, category, office, priority, status, deadline in db.execute(statement):
        comparable_deadline = deadline
        if comparable_deadline.tzinfo is None:
            comparable_deadline = comparable_deadline.replace(tzinfo=timezone.utc)
        days_overdue = max(1, int((now - comparable_deadline).total_seconds() // 86400))
        results.append(
            OverdueCase(
                case_id=case_id,
                category=category,
                assigned_office=office,
                priority=priority,
                status=status,
                deadline=deadline,
                days_overdue=days_overdue,
            )
        )
    return results


def get_recurring_analysis(db: Session, admin: User) -> RecurringAnalysisResponse:
    filters = _visible_filters(admin)
    all_categories = get_category_counts(db, admin)
    overdue_statement = (
        select(Grievance.category, func.count(Grievance.id))
        .where(
            *filters,
            Grievance.status.not_in(FINAL_STATUSES),
            Grievance.deadline < datetime.now(timezone.utc),
        )
        .group_by(Grievance.category)
    )
    overdue_counts = {category: total for category, total in db.execute(overdue_statement)}
    overdue_by_category = [
        CategoryCount(category=category, total_cases=overdue_counts.get(category, 0))
        for category in GrievanceCategory
    ]
    return RecurringAnalysisResponse(
        most_frequent_categories=sorted(all_categories, key=lambda item: (-item.total_cases, item.category.value)),
        offices_by_case_count=sorted(
            get_office_performance(db, admin),
            key=lambda item: (-item.total_cases, item.office),
        ),
        categories_with_most_overdue=sorted(
            overdue_by_category,
            key=lambda item: (-item.total_cases, item.category.value),
        ),
    )


def get_admin_case(
    db: Session,
    admin: User,
    case_id: str,
) -> AdminCaseDetailsResponse | None:
    filters = [Grievance.case_id == case_id, *_visible_filters(admin)]
    row = db.execute(
        select(Grievance).where(*filters)
    ).scalar_one_or_none()
    if row is None:
        return None

    events_statement = (
        select(CaseEvent)
        .where(CaseEvent.grievance_id == row.id)
        .order_by(CaseEvent.created_at.asc(), CaseEvent.id.asc())
    )
    events = [AdminCaseEvent.model_validate(event) for event in db.scalars(events_statement).all()]
    return AdminCaseDetailsResponse(
        case_id=row.case_id,
        category=row.category,
        title=row.title,
        description=row.description,
        priority=row.priority,
        confidentiality=row.confidentiality,
        status=row.status,
        assigned_office=row.assigned_office,
        student_reference=f"Student #{row.student_id}",
        created_at=row.created_at,
        updated_at=row.updated_at,
        deadline=row.deadline,
        resolved_at=row.resolved_at,
        timeline=events,
    )