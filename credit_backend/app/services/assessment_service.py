"""Scoring a loan request and reading back the assessment ledger."""

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.models import CBSCustomer, CreditAssessment
from app.schemas.assessment import (
    AssessmentDetail,
    EvaluationResult,
    LedgerEntry,
    LoanRequest,
)
from app.services import config_service
from app.services.scoring import calculate_score


def evaluate_request(db: Session, request: LoanRequest) -> EvaluationResult:
    """Score a request against the active rules and record it in the ledger."""
    customer = (
        db.query(CBSCustomer)
        .filter(CBSCustomer.account_no == request.account_no)
        .first()
    )
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found in CBS",
        )

    rules = config_service.require_active_config(db).rules
    result = calculate_score(customer, rules)

    assessment = CreditAssessment(
        account_no=request.account_no,
        transaction_amount=request.transaction_amount,
        loan_amount=request.loan_amount,
        type_of_good=request.type_of_good,
        total_score=result.total_score,
        risk_category=result.risk_category,
        status=result.status,
        score_breakdown=result.breakdown,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return EvaluationResult(
        assessment_id=assessment.assessment_id,
        account_no=request.account_no,
        status=result.status,
        risk_category=result.risk_category,
        total_score=result.total_score,
        breakdown=result.breakdown,
    )


def list_ledger(db: Session) -> list[LedgerEntry]:
    """Every assessment, newest first."""
    assessments = (
        db.query(CreditAssessment)
        .order_by(desc(CreditAssessment.assessed_at))
        .all()
    )
    return [
        LedgerEntry(
            assessment_id=a.assessment_id,
            account_no=a.account_no,
            status=a.status,
            date=a.assessed_at,
            points_given=a.total_score,
        )
        for a in assessments
    ]


def get_assessment_detail(db: Session, assessment_id: int) -> AssessmentDetail:
    assessment = (
        db.query(CreditAssessment)
        .filter(CreditAssessment.assessment_id == assessment_id)
        .first()
    )
    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    # Assessments are kept even if the CBS customer row is later removed, so the
    # stored score stays readable with the customer fields left null.
    customer = (
        db.query(CBSCustomer)
        .filter(CBSCustomer.account_no == assessment.account_no)
        .first()
    )

    return AssessmentDetail(
        assessment_id=assessment.assessment_id,
        account_no=assessment.account_no,
        transaction_amount=assessment.transaction_amount,
        loan_amount=assessment.loan_amount,
        type_of_good=assessment.type_of_good,
        total_score=assessment.total_score,
        risk_category=assessment.risk_category,
        status=assessment.status,
        score_breakdown=assessment.score_breakdown,
        assessed_at=assessment.assessed_at,
        name=customer.name if customer else None,
        age=customer.age if customer else None,
        salary=customer.salary if customer else None,
        marital_status=customer.marital_status if customer else None,
    )
