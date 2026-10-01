from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.grievance import (
    ConfidentialityLevel,
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
)


class AdminSummaryResponse(BaseModel):
    total_grievances: int
    open_grievances: int
    in_progress: int
    resolved: int
    overdue: int
    average_resolution_seconds: float | None
    resolved_within_deadline: int
    resolved_after_deadline: int


class CategoryCount(BaseModel):
    category: GrievanceCategory
    total_cases: int


class StatusCount(BaseModel):
    status: GrievanceStatus
    total_cases: int


class OfficePerformance(BaseModel):
    office: str
    total_cases: int
    open_cases: int
    resolved_cases: int
    overdue_cases: int
    average_resolution_seconds: float | None


class OverdueCase(BaseModel):
    case_id: str
    category: GrievanceCategory
    assigned_office: str
    priority: GrievancePriority
    status: GrievanceStatus
    deadline: datetime
    days_overdue: int


class RecurringAnalysisResponse(BaseModel):
    most_frequent_categories: list[CategoryCount]
    offices_by_case_count: list[OfficePerformance]
    categories_with_most_overdue: list[CategoryCount]


class AdminCaseEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_type: str
    description: str
    created_at: datetime
    is_student_visible: bool


class AdminCaseDetailsResponse(BaseModel):
    case_id: str
    category: GrievanceCategory
    title: str
    description: str
    priority: GrievancePriority
    confidentiality: ConfidentialityLevel
    status: GrievanceStatus
    assigned_office: str
    student_reference: str
    created_at: datetime
    updated_at: datetime
    deadline: datetime
    resolved_at: datetime | None
    timeline: list[AdminCaseEvent]