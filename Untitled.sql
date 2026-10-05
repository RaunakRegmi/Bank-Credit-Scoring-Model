UPDATE scoring_config 
SET rules = '{
    "approval_threshold": 650,
    "age_brackets": [
        {"max": 17, "score": 0}, {"max": 24, "score": 25}, 
        {"max": 34, "score": 35}, {"max": 44, "score": 45}, 
        {"max": 54, "score": 50}, {"max": 64, "score": 40}, {"max": 999, "score": 30}
    ],
    "marital_status_scores": {
        "married": 20, "unmarried": 16, "single": 16, "widowed": 16, "divorced": 14, "separated": 14
    },
    "salary_brackets": [
        {"max": 15000, "score": 30}, {"max": 25000, "score": 70}, 
        {"max": 40000, "score": 110}, {"max": 60000, "score": 150}, 
        {"max": 80000, "score": 180}, {"max": 100000, "score": 205}, 
        {"max": 150000, "score": 220}, {"max": 999999999, "score": 230}
    ],
    "dependents_scores": {
        "0": 80, "1": 70, "2": 60, "3": 45, "4": 30, "default": 15
    },
    "incoming_months_scores": {
        "0": 0, "1": 40, "2": 40, "3": 110, "4": 110, "5": 165, "default": 220
    },
    "outgoing_ratio_brackets": [
        {"max": 0.20, "score": 220}, {"max": 0.35, "score": 195}, 
        {"max": 0.50, "score": 165}, {"max": 0.60, "score": 130}, 
        {"max": 0.70, "score": 90},  {"max": 0.85, "score": 45}, {"max": 999.0, "score": 15}
    ],
    "spouse_scores": {
        "none": 16, "present": 18, "co_borrower": 20
    },
    "spouse_working_scores": {
        "no_spouse": 15, "not_working": 15, "unverified": 20, "verified": 30
    },
    "occupation_scores": {
        "no_verified_income": 0, "irregular": 25, "regular": 45, 
        "stable_6_11_months": 60, "stable_12_plus_months": 70
    },
    "address_scores": {
        "unverified": 0, "verified": 10, "established": 15, "approved_low_risk_area": 20
    },
    "housing_ratio_brackets": [
        {"max": 0.10, "score": 40}, {"max": 0.20, "score": 35}, 
        {"max": 0.30, "score": 30}, {"max": 0.40, "score": 20}, 
        {"max": 0.50, "score": 10}, {"max": 999.0, "score": 5}
    ]
}'::jsonb
WHERE is_active = TRUE;