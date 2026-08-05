from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


# --- auth ---

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str


class MeResponse(BaseModel):
    id: str
    email: str
    name: str | None
    has_resume: bool
    resume_uploaded_at: datetime | None
    created_at: datetime


# --- resume ---

class ResumePasteRequest(BaseModel):
    context_text: str = Field(min_length=1)


class ResumeResponse(BaseModel):
    resume_parsed: dict[str, Any]


# --- attempts ---

class CreateAttemptRequest(BaseModel):
    question_id: str
    answer_text: str = Field(min_length=1)
    input_mode: Literal["typed", "spoken"] = "typed"


class ScoreDimension(BaseModel):
    evidence: str
    score: int


class AttemptScoreResponse(BaseModel):
    attempt_id: str
    structure: int
    technical_depth: int
    specificity: int
    evidence: dict[str, Any]
    feedback: str
    model: str


# --- sessions ---

class CreateSessionRequest(BaseModel):
    role: str
    interview_type: Literal["technical", "behavioural", "mixed"] = "mixed"
    question_count: Literal[3, 5, 10] = 5
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class QuestionOut(BaseModel):
    id: str
    text: str
    type: str
    targets: str | None
    order_index: int
    attempt: AttemptScoreResponse | None = None


class SessionOut(BaseModel):
    id: str
    role: str
    difficulty: str
    interview_type: str
    question_count: int
    created_at: datetime
    questions: list[QuestionOut] = []


class SessionListItem(BaseModel):
    id: str
    role: str
    difficulty: str
    interview_type: str
    question_count: int
    created_at: datetime


# --- history ---

class HistoryItem(BaseModel):
    attempt_id: str
    session_id: str
    question_text: str
    question_type: str
    answer_text: str
    input_mode: str
    structure: int
    technical_depth: int
    specificity: int
    feedback: str | None
    scored_at: datetime