from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminCaseDetailsResponse,
    AdminSummaryResponse,
    CategoryCount,
    OfficePerformance,
    OverdueCase,
    RecurringAnalysisResponse,
    StatusCount,
)
from app.services.admin import (
    get_admin_case,
    get_admin_summary,
    get_category_counts,
    get_office_performance,
    get_overdue_cases,
    get_recurring_analysis,
    get_status_counts,
)


router = APIRouter(prefix="/api/admin", tags=["admin"])


def database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Admin reporting is temporarily unavailable",
    )


@router.get("/summary", response_model=AdminSummaryResponse)
def admin_summary(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_admin_summary(db, admin)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/categories", response_model=list[CategoryCount])
def admin_categories(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_category_counts(db, admin)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/status", response_model=list[StatusCount])
def admin_status(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_status_counts(db, admin)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/offices", response_model=list[OfficePerformance])
def admin_offices(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_office_performance(db, admin)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/overdue", response_model=list[OverdueCase])
def admin_overdue(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_overdue_cases(db, admin)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/recurring", response_model=RecurringAnalysisResponse)
def admin_recurring(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return get_recurring_analysis(db, admin)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/grievances/{case_id}", response_model=AdminCaseDetailsResponse)
def admin_case_details(
    case_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        case = get_admin_case(db, admin, case_id)
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc

    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    return case