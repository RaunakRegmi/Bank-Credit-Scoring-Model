def calculate_score(customer, config: dict):
    # Extract Raw CBS Values
    salary = float(customer.salary)
    incoming = float(customer.monthly_incoming)
    outgoing = float(customer.monthly_outgoing)
    housing = float(customer.monthly_housing_cost)
    age = customer.age
    marital = customer.marital_status.lower()
    dependents = str(customer.dependents)
    spouse = customer.spouse
    spouse_working = customer.spouse_working
    occupation = customer.occupation_stability
    address = customer.residence_area
    income_months = str(customer.regular_income_months)

    expense_ratio = outgoing / incoming if incoming > 0 else 1.0
    housing_ratio = housing / incoming if incoming > 0 else 1.0

    # Max-value Helper Functions
    def get_max_arr(arr): return max([x.get("score", 0) for x in arr]) if arr else 0
    def get_max_obj(obj): return max([int(x) for x in obj.values()]) if obj else 0

    # Score Calculations
    sal_score = next((item["score"] for item in config.get("salary_brackets", []) if salary <= item["max"]), 0)
    inc_score = config.get("incoming_months_scores", {}).get(income_months, 0)
    out_score = next((item["score"] for item in config.get("outgoing_ratio_brackets", []) if expense_ratio <= item["max"]), 0)
    hou_score = next((item["score"] for item in config.get("housing_ratio_brackets", []) if housing_ratio <= item["max"]), 0)
    occ_score = config.get("occupation_scores", {}).get(occupation, 0)
    age_score = next((item["score"] for item in config.get("age_brackets", []) if age <= item["max"]), 0)
    mar_score = config.get("marital_status_scores", {}).get(marital, 0)
    dep_score = config.get("dependents_scores", {}).get(dependents, 0)
    spo_score = config.get("spouse_scores", {}).get(spouse, 0)
    spw_score = config.get("spouse_working_scores", {}).get(spouse_working, 0)
    add_score = config.get("address_scores", {}).get(address, 0)

    # In-Depth Explainer Breakdown
    breakdown = {
        "financial": {
            "salary": {
                "value": f"Rs. {salary:,.2f}",
                "score": sal_score, "max": get_max_arr(config.get("salary_brackets")),
                "reason": f"Applicant base salary falls into the {sal_score}-point configurable earning bracket."
            },
            "incoming_consistency": {
                "value": f"{income_months} months",
                "score": inc_score, "max": get_max_obj(config.get("incoming_months_scores")),
                "reason": f"Consistent incoming deposits were recorded for {income_months} out of the last 6 months."
            },
            "expense_ratio": {
                "value": f"{expense_ratio:.0%}",
                "score": out_score, "max": get_max_arr(config.get("outgoing_ratio_brackets")),
                "reason": f"Monthly outgoing expenses consume {expense_ratio:.0%} of the total incoming funds."
            },
            "housing_ratio": {
                "value": f"{housing_ratio:.0%}",
                "score": hou_score, "max": get_max_arr(config.get("housing_ratio_brackets")),
                "reason": f"Housing and rental costs represent {housing_ratio:.0%} of the applicant's monthly liquidity."
            }
        },
        "professional": {
            "occupation": {
                "value": occupation.replace('_', ' ').title(),
                "score": occ_score, "max": get_max_obj(config.get("occupation_scores")),
                "reason": f"Employment history and income source is verified as '{occupation.replace('_', ' ')}'."
            }
        },
        "behavioral": {
            "age_bracket": {
                "value": f"{age} yrs",
                "score": age_score, "max": get_max_arr(config.get("age_brackets")),
                "reason": f"Applicant age ({age}) matches the established demographic risk maturity curve."
            },
            "marital_status": {
                "value": marital.title(),
                "score": mar_score, "max": get_max_obj(config.get("marital_status_scores")),
                "reason": f"Legal marital status is registered and evaluated as '{marital}'."
            },
            "dependents": {
                "value": f"{dependents} dependent(s)",
                "score": dep_score, "max": get_max_obj(config.get("dependents_scores")),
                "reason": f"Applicant provides primary financial support for {dependents} dependent(s)."
            },
            "spouse_presence": {
                "value": spouse.title(),
                "score": spo_score, "max": get_max_obj(config.get("spouse_scores")),
                "reason": f"Spousal or co-borrower liability is categorized as '{spouse}'."
            },
            "spouse_employment": {
                "value": spouse_working.replace('_', ' ').title(),
                "score": spw_score, "max": get_max_obj(config.get("spouse_working_scores")),
                "reason": f"Secondary household income verification status is '{spouse_working.replace('_', ' ')}'."
            },
            "residence_area": {
                "value": address.title(),
                "score": add_score, "max": get_max_obj(config.get("address_scores")),
                "reason": f"Primary residential geographic zone is classified as '{address}'."
            }
        }
    }

    # Sum nested scores dynamically
    total_score = sum([v["score"] for v in breakdown["financial"].values()]) + \
                  sum([v["score"] for v in breakdown["professional"].values()]) + \
                  sum([v["score"] for v in breakdown["behavioral"].values()])

    default_bands = [
        {"action": "Approved", "min": 650, "max": 1000, "risk": "Low Risk"},
        {"action": "Third-Party Verification", "min": 500, "max": 649, "risk": "Moderate Risk"},
        {"action": "Declined", "min": 0, "max": 499, "risk": "High Risk"}
    ]
    
    threshold_bands = config.get("threshold_bands", default_bands)
    
    status = "Declined"
    risk_category = "Very High Risk"
    
    for band in threshold_bands:
        if band["min"] <= total_score <= band["max"]:
            status = band["action"]
            risk_category = band["risk"]
            break

    return total_score, status, risk_category, breakdown