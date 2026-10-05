# uvicorn main:app --reload


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import traceback

app = FastAPI(title="Core Credit Scoring Engine")

# Allow Frontend Dashboards to connect seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "dbname": "credit_engine_db",
    "user": "postgres",
    "password": "samael",
    "host": "localhost",
    "port": "5433"
}

class LoanRequest(BaseModel):
    account_no: str
    transaction_amount: float
    loan_amount: float
    type_of_good: str

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

# ======================================================
# 1. CORE API: EVALUATE CREDIT SCORE FROM POSTMAN
# ======================================================
@app.post("/evaluate")
def evaluate_credit_score(request: LoanRequest):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Fetch CBS Customer Data
        cur.execute("SELECT * FROM cbs_customers WHERE account_no = %s", (request.account_no,))
        customer = cur.fetchone()
        if not customer:
            raise HTTPException(status_code=404, detail=f"Account '{request.account_no}' not found in CBS Sandbox")

        # Fetch Active Dynamic Rules
        cur.execute("SELECT rules FROM scoring_config WHERE is_active = TRUE ORDER BY config_id DESC LIMIT 1")
        config_row = cur.fetchone()
        if not config_row:
            raise HTTPException(status_code=500, detail="No active scoring config found")

        config = config_row["rules"]
        if isinstance(config, str):
            config = json.loads(config)

        # Extracted CBS Variables
        salary = float(customer["salary"])
        incoming = float(customer["monthly_incoming"])
        outgoing = float(customer["monthly_outgoing"])
        housing = float(customer["monthly_housing_cost"])
        
        # --- FINANCIAL CALCULATIONS ---
        salary_score = next((item["score"] for item in config["salary_brackets"] if salary <= item["max"]), 0)
        
        income_months = str(customer["regular_income_months"])
        incoming_score = config.get("incoming_months_scores", {}).get(income_months, config.get("incoming_months_scores", {}).get("default", 220))
        
        expense_ratio = outgoing / incoming if incoming > 0 else 1.0
        outgoing_score = next((item["score"] for item in config["outgoing_ratio_brackets"] if expense_ratio <= item["max"]), 15)
        
        housing_ratio = housing / incoming if incoming > 0 else 1.0
        housing_score = next((item["score"] for item in config["housing_ratio_brackets"] if housing_ratio <= item["max"]), 5)

        # --- PROFESSIONAL CALCULATIONS ---
        occupation = customer["occupation_stability"]
        occupation_score = config.get("occupation_scores", {}).get(occupation, 0)

        # --- BEHAVIORAL CALCULATIONS ---
        age = customer["age"]
        age_score = next((item["score"] for item in config["age_brackets"] if age <= item["max"]), 0)
        
        marital = customer["marital_status"].lower()
        marital_score = config.get("marital_status_scores", {}).get(marital, 16)
        
        dependents = str(customer["dependents"])
        dependents_score = config.get("dependents_scores", {}).get(dependents, config.get("dependents_scores", {}).get("default", 15))
        
        spouse = customer["spouse"]
        spouse_score = config.get("spouse_scores", {}).get(spouse, 16)
        
        spouse_working = customer["spouse_working"]
        spouse_working_score = config.get("spouse_working_scores", {}).get(spouse_working, 15)
        
        address = customer["residence_area"]
        address_score = config.get("address_scores", {}).get(address, 0)

        # Grouped Breakdown
        breakdown = {
            "financial": {
                "salary_score": salary_score,
                "incoming_score": incoming_score,
                "outgoing_score": outgoing_score,
                "housing_score": housing_score
            },
            "professional": {
                "occupation_score": occupation_score
            },
            "behavioral": {
                "age_score": age_score,
                "marital_status_score": marital_score,
                "dependents_score": dependents_score,
                "spouse_score": spouse_score,
                "spouse_working_score": spouse_working_score,
                "address_score": address_score
            }
        }

        total_score = (
            salary_score + incoming_score + outgoing_score + housing_score +
            occupation_score +
            age_score + marital_score + dependents_score + spouse_score + spouse_working_score + address_score
        )

        approval_limit = config.get("approval_threshold", 650)
        status = "Approved" if total_score >= approval_limit else "Declined"

        risk_category = "Very Low Risk" if total_score >= 850 else "Low Risk" if total_score >= 750 else "Moderate Risk" if total_score >= 650 else "High Risk" if total_score >= 500 else "Very High Risk"

        # Save Record
        cur.execute("""
            INSERT INTO credit_assessments 
            (account_no, transaction_amount, loan_amount, type_of_good, total_score, risk_category, status, score_breakdown)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING assessment_id;
        """, (
            request.account_no, request.transaction_amount, request.loan_amount, 
            request.type_of_good, total_score, risk_category, status, json.dumps(breakdown)
        ))
        
        assessment_id = cur.fetchone()["assessment_id"]
        conn.commit()

        return {
            "assessment_id": assessment_id,
            "account_no": request.account_no,
            "status": status,
            "risk_category": risk_category,
            "total_score": total_score,
            "breakdown": breakdown
        }

    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: conn.close()


# ======================================================
# 2. DASHBOARD 1: MAIN LEDGER (TABLE VIEW)
# ======================================================
@app.get("/api/dashboard/main")
def get_main_dashboard():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT account_no, status, assessed_at AS date, total_score AS points_given, assessment_id
        FROM credit_assessments
        ORDER BY assessed_at DESC;
    """)
    records = cur.fetchall()
    cur.close()
    conn.close()
    return records


# ======================================================
# 3. DASHBOARD 2: SCORING DETAILS BREAKDOWN VIEW
# ======================================================
@app.get("/api/dashboard/details/{assessment_id}")
def get_scoring_details(assessment_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT a.*, c.name, c.age, c.salary, c.marital_status
        FROM credit_assessments a
        JOIN cbs_customers c ON a.account_no = c.account_no
        WHERE a.assessment_id = %s;
    """, (assessment_id,))
    record = cur.fetchone()
    cur.close()
    conn.close()
    
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return record


# ======================================================
# 4. DASHBOARD 3: SETTINGS CONFIGURATION (GET & UPDATE)
# ======================================================
@app.get("/api/settings/config")
def get_scoring_config():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT rules FROM scoring_config WHERE is_active = TRUE ORDER BY config_id DESC LIMIT 1")
    config = cur.fetchone()["rules"]
    cur.close()
    conn.close()
    return config

@app.put("/api/settings/config")
def update_scoring_config(new_config: dict):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE scoring_config SET rules = %s WHERE is_active = TRUE", (json.dumps(new_config),))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Scoring thresholds updated successfully!"}