from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_student
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.grievance import CaseEventResponse, GrievanceCreate, GrievanceResponse
from app.services.grievances import (
    create_grievance,
    get_student_grievance,
    list_grievance_events,
    list_student_grievances,
)


router = APIRouter(prefix="/api/grievances", tags=["grievances"])


def database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Grievance service is temporarily unavailable",
    )


@router.post("", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
def submit_grievance(
    request: GrievanceCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    try:
        return create_grievance(db, current_user.id, request)
    except SQLAlchemyError as exc:
        raise database_unavailable() from exc


@router.get("", response_model=list[GrievanceResponse])
def get_my_grievances(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    try:
        return list_student_grievances(db, current_user.id)
    except SQLAlchemyError as exc:
        raise database_unavailable() from exc


@router.get("/{case_id}", response_model=GrievanceResponse)
def get_grievance_details(
    case_id: str,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    try:
        grievance = get_student_grievance(db, current_user.id, case_id)
    except SQLAlchemyError as exc:
        raise database_unavailable() from exc

    if grievance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    return grievance


@router.get("/{case_id}/timeline", response_model=list[CaseEventResponse])
def get_grievance_timeline(
    case_id: str,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    try:
        grievance = get_student_grievance(db, current_user.id, case_id)
        if grievance is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
        return list_grievance_events(db, grievance.id)
    except SQLAlchemyError as exc:
        raise database_unavailable() from exc


@router.patch("/{case_id}/status", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def update_grievance_status(
    case_id: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot change grievance status",
        )

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Status updates are not available yet",
    )