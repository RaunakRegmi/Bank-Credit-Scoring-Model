from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base

class CBSCustomer(Base):
    __tablename__ = "cbs_customers"
    
    account_no = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    marital_status = Column(String(20), nullable=False)
    salary = Column(Numeric(12, 2), nullable=False)
    dependents = Column(Integer, default=0)
    regular_income_months = Column(Integer, default=0)
    monthly_incoming = Column(Numeric(12, 2), default=0.00)
    monthly_outgoing = Column(Numeric(12, 2), default=0.00)
    spouse = Column(String(20), default='none')
    spouse_working = Column(String(20), default='no_spouse')
    occupation_stability = Column(String(50), nullable=False)
    residence_area = Column(String(50), nullable=False)
    monthly_housing_cost = Column(Numeric(12, 2), default=0.00)

class ScoringConfig(Base):
    __tablename__ = "scoring_config"
    
    config_id = Column(Integer, primary_key=True, index=True)
    version = Column(String(20), default="v1.0")
    is_active = Column(Boolean, default=True)
    rules = Column(JSONB, nullable=False)

class CreditAssessment(Base):
    __tablename__ = "credit_assessments"
    
    assessment_id = Column(Integer, primary_key=True, index=True)
    account_no = Column(String(50))
    transaction_amount = Column(Numeric(12, 2))
    loan_amount = Column(Numeric(12, 2))
    type_of_good = Column(String(100))
    total_score = Column(Integer)
    risk_category = Column(String(30))
    status = Column(String(20))
    score_breakdown = Column(JSONB)
    assessed_at = Column(DateTime(timezone=True), server_default=func.now())