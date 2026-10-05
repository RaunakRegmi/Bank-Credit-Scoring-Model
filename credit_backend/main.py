from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, get_db, Base
import models
import schemas
import engine as scoring_engine

# Creates tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Core Credit Scoring API (Enterprise Layer)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/evaluate")
def evaluate_credit(request: schemas.LoanRequest, db: Session = Depends(get_db)):
    # 1. Fetch Customer using ORM
    customer = db.query(models.CBSCustomer).filter(models.CBSCustomer.account_no == request.account_no).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Account not found in CBS")

    # 2. Fetch Config using ORM
    config_record = db.query(models.ScoringConfig).filter(models.ScoringConfig.is_active == True).order_by(desc(models.ScoringConfig.config_id)).first()
    if not config_record:
        raise HTTPException(status_code=500, detail="Configuration missing")

    # 3. Process via Engine
    total_score, status, risk_category, breakdown = scoring_engine.calculate_score(customer, config_record.rules)

    # 4. Save to Ledger using ORM
    new_assessment = models.CreditAssessment(
        account_no=request.account_no,
        transaction_amount=request.transaction_amount,
        loan_amount=request.loan_amount,
        type_of_good=request.type_of_good,
        total_score=total_score,
        risk_category=risk_category,
        status=status,
        score_breakdown=breakdown
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)

    return {
        "assessment_id": new_assessment.assessment_id,
        "account_no": request.account_no,
        "status": status,
        "risk_category": risk_category,
        "total_score": total_score,
        "breakdown": breakdown
    }

@app.get("/api/dashboard/main")
def get_main_dashboard(db: Session = Depends(get_db)):
    assessments = db.query(models.CreditAssessment).order_by(desc(models.CreditAssessment.assessed_at)).all()
    # Format for the UI
    return [{
        "assessment_id": a.assessment_id,
        "account_no": a.account_no,
        "status": a.status,
        "date": a.assessed_at,
        "points_given": a.total_score
    } for a in assessments]

@app.get("/api/dashboard/details/{assessment_id}")
def get_scoring_details(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(models.CreditAssessment).filter(models.CreditAssessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    customer = db.query(models.CBSCustomer).filter(models.CBSCustomer.account_no == assessment.account_no).first()
    
    return {
        **assessment.__dict__,
        "name": customer.name,
        "age": customer.age,
        "salary": customer.salary,
        "marital_status": customer.marital_status
    }

@app.get("/api/settings/config")
def get_config(db: Session = Depends(get_db)):
    config = db.query(models.ScoringConfig).filter(models.ScoringConfig.is_active == True).order_by(desc(models.ScoringConfig.config_id)).first()
    return config.rules

@app.put("/api/settings/config")
def update_config(new_rules: dict, db: Session = Depends(get_db)):
    config = db.query(models.ScoringConfig).filter(models.ScoringConfig.is_active == True).order_by(desc(models.ScoringConfig.config_id)).first()
    config.rules = new_rules
    
    # SQLAlchemy requires flagging JSONB columns as modified when updating deeply nested dicts
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(config, "rules")
    
    db.commit()
    return {"message": "Configuration updated successfully"}