"""Scoring entry point used by the Core Banking System.

Deliberately left unauthenticated to preserve the existing integration contract.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.assessment import EvaluationResult, LoanRequest
from app.services import assessment_service

router = APIRouter(tags=["scoring"])


@router.post("/evaluate", response_model=EvaluationResult)
def evaluate_credit(
    request: LoanRequest,
    db: Session = Depends(get_db),
) -> EvaluationResult:
    return assessment_service.evaluate_request(db, request)
