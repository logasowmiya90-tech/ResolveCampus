from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.grievance import (
    ConfidentialityLevel,
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
)


class OfficerGrievanceListItem(BaseModel):
    case_id: str
    category: GrievanceCategory
    title: str
    priority: GrievancePriority
    status: GrievanceStatus
    assigned_office: str
    created_at: datetime
    deadline: datetime
    is_overdue: bool


class OfficerDashboardCounts(BaseModel):
    total_assigned_cases: int
    submitted_cases: int
    in_progress_cases: int
    resolved_cases: int
    overdue_cases: int


class OfficerDashboardResponse(BaseModel):
    office_name: str
    counts: OfficerDashboardCounts
    grievances: list[OfficerGrievanceListItem]


class OfficerCaseEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_type: str
    description: str
    created_at: datetime
    is_student_visible: bool


class OfficerCaseDetailsResponse(BaseModel):
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
    timeline: list[OfficerCaseEventResponse]


class StatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: GrievanceStatus


class OfficerNoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(min_length=4, max_length=240)

    @field_validator("description", mode="before")
    @classmethod
    def strip_description(cls, value):
        return value.strip() if isinstance(value, str) else value