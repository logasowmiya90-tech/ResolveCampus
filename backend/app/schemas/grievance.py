from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.grievance import (
    ConfidentialityLevel,
    GrievanceCategory,
    GrievancePriority,
    GrievanceStatus,
)


class GrievanceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: GrievanceCategory
    title: str = Field(min_length=5, max_length=160)
    description: str = Field(min_length=10, max_length=10000)
    priority: GrievancePriority
    confidentiality: ConfidentialityLevel

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class GrievanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: str
    category: GrievanceCategory
    title: str
    description: str
    priority: GrievancePriority
    confidentiality: ConfidentialityLevel
    status: GrievanceStatus
    assigned_office: str
    created_at: datetime
    updated_at: datetime
    deadline: datetime
    resolved_at: datetime | None


class CaseEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_type: str
    description: str
    created_at: datetime