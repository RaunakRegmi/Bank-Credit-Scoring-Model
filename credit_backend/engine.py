def calculate_score(customer, config: dict):
    salary = float(customer.salary)
    incoming = float(customer.monthly_incoming)
    outgoing = float(customer.monthly_outgoing)
    housing = float(customer.monthly_housing_cost)
    
    # Financial calculations
    salary_score = next((item["score"] for item in config["salary_brackets"] if salary <= item["max"]), 0)
    income_months = str(customer.regular_income_months)
    incoming_score = config.get("incoming_months_scores", {}).get(income_months, 220)
    
    expense_ratio = outgoing / incoming if incoming > 0 else 1.0
    outgoing_score = next((item["score"] for item in config["outgoing_ratio_brackets"] if expense_ratio <= item["max"]), 15)
    
    housing_ratio = housing / incoming if incoming > 0 else 1.0
    housing_score = next((item["score"] for item in config["housing_ratio_brackets"] if housing_ratio <= item["max"]), 5)

    # Professional calculations
    occupation = customer.occupation_stability
    occupation_score = config.get("occupation_scores", {}).get(occupation, 0)

    # Behavioral calculations
    age = customer.age
    age_score = next((item["score"] for item in config["age_brackets"] if age <= item["max"]), 0)
    
    marital = customer.marital_status.lower()
    marital_score = config.get("marital_status_scores", {}).get(marital, 16)
    
    dependents = str(customer.dependents)
    dependents_score = config.get("dependents_scores", {}).get(dependents, 15)
    
    spouse = customer.spouse
    spouse_score = config.get("spouse_scores", {}).get(spouse, 16)
    
    spouse_working = customer.spouse_working
    spouse_working_score = config.get("spouse_working_scores", {}).get(spouse_working, 15)
    
    address = customer.residence_area
    address_score = config.get("address_scores", {}).get(address, 0)

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

    # Calculate Total Score
    total_score = sum(breakdown["financial"].values()) + sum(breakdown["professional"].values()) + sum(breakdown["behavioral"].values())
    
    # NEW DYNAMIC THRESHOLD EVALUATION
    # Default fallback if bands aren't configured yet
    default_bands = [
        {"action": "Approved", "min": 650, "max": 1000, "risk": "Low Risk"},
        {"action": "Third-Party Verification", "min": 500, "max": 649, "risk": "Moderate Risk"},
        {"action": "Declined", "min": 0, "max": 499, "risk": "High Risk"}
    ]
    
    threshold_bands = config.get("threshold_bands", default_bands)
    
    status = "Declined" # Failsafe
    risk_category = "Very High Risk"
    
    for band in threshold_bands:
        if band["min"] <= total_score <= band["max"]:
            status = band["action"]
            risk_category = band["risk"]
            break

    return total_score, status, risk_category, breakdown