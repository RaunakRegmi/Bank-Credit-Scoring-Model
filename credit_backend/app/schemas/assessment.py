"""Credit assessment request and response models.

Field names match what the dashboard already reads, so the HTTP contract is
unchanged. Declaring them explicitly also keeps SQLAlchemy internals such as
`_sa_instance_state` out of the serialised response.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class LoanRequest(BaseModel):
    account_no: str
    transaction_amount: float
    loan_amount: float
    type_of_good: str


class EvaluationResult(BaseModel):
    assessment_id: int
    account_no: str
    status: str
    risk_category: str
    total_score: int
    breakdown: dict[str, Any]


class LedgerEntry(BaseModel):
    """One row of the transaction requests table."""

    assessment_id: int
    account_no: Optional[str] = None
    status: Optional[str] = None
    date: Optional[datetime] = None
    points_given: Optional[int] = None


class AssessmentDetail(BaseModel):
    """A stored assessment joined with the customer it was scored against."""

    assessment_id: int
    account_no: Optional[str] = None
    transaction_amount: Optional[float] = None
    loan_amount: Optional[float] = None
    type_of_good: Optional[str] = None
    total_score: Optional[int] = None
    risk_category: Optional[str] = None
    status: Optional[str] = None
    score_breakdown: Optional[dict[str, Any]] = None
    assessed_at: Optional[datetime] = None

    # Pulled from the CBS record; null if that customer row no longer exists.
    name: Optional[str] = None
    age: Optional[int] = None
    salary: Optional[float] = None
    marital_status: Optional[str] = None
