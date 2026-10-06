"""Assessment ledger and per-assessment explainer views."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.assessment import AssessmentDetail, LedgerEntry
from app.services import assessment_service

# Both routes require a valid token.
router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/main", response_model=list[LedgerEntry])
def get_dashboard(db: Session = Depends(get_db)) -> list[LedgerEntry]:
    return assessment_service.list_ledger(db)


@router.get("/details/{assessment_id}", response_model=AssessmentDetail)
def get_scoring_details(
    assessment_id: int,
    db: Session = Depends(get_db),
) -> AssessmentDetail:
    return assessment_service.get_assessment_detail(db, assessment_id)
