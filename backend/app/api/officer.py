from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import require_officer
from app.database import get_db
from app.models.grievance import GrievanceCategory, GrievancePriority, GrievanceStatus
from app.models.user import User
from app.schemas.officer import (
    OfficerCaseDetailsResponse,
    OfficerCaseEventResponse,
    OfficerDashboardResponse,
    OfficerNoteCreate,
    StatusUpdateRequest,
)
from app.services.officer import (
    InvalidStatusTransition,
    add_officer_note,
    get_officer_case,
    get_officer_dashboard,
    update_case_status,
)


router = APIRouter(prefix="/api/officer", tags=["officer"])


def require_office(current_user: User) -> str:
    office_name = (current_user.office_name or "").strip()
    if not office_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No office is assigned to this officer account",
        )
    return office_name


def database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Officer service is temporarily unavailable",
    )


@router.get("/grievances", response_model=OfficerDashboardResponse)
def officer_dashboard(
    case_status: GrievanceStatus | None = Query(default=None, alias="status"),
    priority: GrievancePriority | None = None,
    category: GrievanceCategory | None = None,
    search: str | None = Query(default=None, max_length=160),
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    office_name = require_office(current_user)
    try:
        return get_officer_dashboard(
            db,
            office_name,
            status=case_status,
            priority=priority,
            category=category,
            search=search,
            can_access_confidential=current_user.can_access_confidential,
        )
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc


@router.get("/grievances/{case_id}", response_model=OfficerCaseDetailsResponse)
def officer_case_details(
    case_id: str,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    office_name = require_office(current_user)
    try:
        case = get_officer_case(
            db,
            office_name,
            case_id,
            current_user.can_access_confidential,
        )
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc

    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    return case


@router.patch("/grievances/{case_id}/status")
def officer_update_status(
    case_id: str,
    request: StatusUpdateRequest,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    office_name = require_office(current_user)
    try:
        grievance = update_case_status(
            db,
            office_name,
            case_id,
            current_user.id,
            request.status,
            current_user.can_access_confidential,
        )
    except InvalidStatusTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc

    if grievance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    return {
        "case_id": grievance.case_id,
        "status": grievance.status,
        "updated_at": grievance.updated_at,
        "resolved_at": grievance.resolved_at,
    }


@router.post(
    "/grievances/{case_id}/events",
    response_model=OfficerCaseEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def officer_add_note(
    case_id: str,
    request: OfficerNoteCreate,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    office_name = require_office(current_user)
    try:
        event = add_officer_note(
            db,
            office_name,
            case_id,
            current_user.id,
            request.description,
            current_user.can_access_confidential,
        )
    except SQLAlchemyError as exc:
        db.rollback()
        raise database_unavailable() from exc

    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    return event