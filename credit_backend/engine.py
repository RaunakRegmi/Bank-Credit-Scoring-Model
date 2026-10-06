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

    # --- NEW: Helper to safely extract "enabled" flag and data ---
    def parse_section(section_data, is_array=False):
        if isinstance(section_data, dict) and "enabled" in section_data:
            enabled = section_data.get("enabled", True)
            data = section_data.get("brackets", []) if is_array else section_data.get("scores", {})
        else:
            enabled = True
            data = section_data or ([] if is_array else {})
        return enabled, data

    # Max-value Helper Functions (Returns 0 if section is disabled)
    def get_max_arr(section_data): 
        enabled, arr = parse_section(section_data, True)
        return max([x.get("score", 0) for x in arr]) if enabled and arr else 0
        
    def get_max_obj(section_data): 
        enabled, obj = parse_section(section_data, False)
        return max([int(x) for x in obj.values()]) if enabled and obj else 0

    # 1. Parse all sections to check if they are ACTIVE or OFF
    sal_en, sal_data = parse_section(config.get("salary_brackets"), True)
    inc_en, inc_data = parse_section(config.get("incoming_months_scores"), False)
    out_en, out_data = parse_section(config.get("outgoing_ratio_brackets"), True)
    hou_en, hou_data = parse_section(config.get("housing_ratio_brackets"), True)
    occ_en, occ_data = parse_section(config.get("occupation_scores"), False)
    age_en, age_data = parse_section(config.get("age_brackets"), True)
    mar_en, mar_data = parse_section(config.get("marital_status_scores"), False)
    dep_en, dep_data = parse_section(config.get("dependents_scores"), False)
    spo_en, spo_data = parse_section(config.get("spouse_scores"), False)
    spw_en, spw_data = parse_section(config.get("spouse_working_scores"), False)
    add_en, add_data = parse_section(config.get("address_scores"), False)

    # 2. Score Calculations (Awards 0 points instantly if toggled OFF)
    sal_score = next((item["score"] for item in sal_data if salary <= item["max"]), 0) if sal_en else 0
    inc_score = inc_data.get(income_months, 0) if inc_en else 0
    out_score = next((item["score"] for item in out_data if expense_ratio <= item["max"]), 0) if out_en else 0
    hou_score = next((item["score"] for item in hou_data if housing_ratio <= item["max"]), 0) if hou_en else 0
    occ_score = occ_data.get(occupation, 0) if occ_en else 0
    age_score = next((item["score"] for item in age_data if age <= item["max"]), 0) if age_en else 0
    mar_score = mar_data.get(marital, 0) if mar_en else 0
    dep_score = dep_data.get(dependents, 0) if dep_en else 0
    spo_score = spo_data.get(spouse, 0) if spo_en else 0
    spw_score = spw_data.get(spouse_working, 0) if spw_en else 0
    add_score = add_data.get(address, 0) if add_en else 0

    # 3. In-Depth Explainer Breakdown
    breakdown = {
        "financial": {
            "salary": {
                "value": f"Rs. {salary:,.2f}" if sal_en else "N/A",
                "score": sal_score, "max": get_max_arr(config.get("salary_brackets")),
                "reason": f"Applicant base salary falls into the {sal_score}-point configurable earning bracket." if sal_en else "Metric Disabled by System Administrator."
            },
            "incoming_consistency": {
                "value": f"{income_months} months" if inc_en else "N/A",
                "score": inc_score, "max": get_max_obj(config.get("incoming_months_scores")),
                "reason": f"Consistent incoming deposits were recorded for {income_months} out of the last 6 months." if inc_en else "Metric Disabled by System Administrator."
            },
            "expense_ratio": {
                "value": f"{expense_ratio:.0%}" if out_en else "N/A",
                "score": out_score, "max": get_max_arr(config.get("outgoing_ratio_brackets")),
                "reason": f"Monthly outgoing expenses consume {expense_ratio:.0%} of the total incoming funds." if out_en else "Metric Disabled by System Administrator."
            },
            "housing_ratio": {
                "value": f"{housing_ratio:.0%}" if hou_en else "N/A",
                "score": hou_score, "max": get_max_arr(config.get("housing_ratio_brackets")),
                "reason": f"Housing and rental costs represent {housing_ratio:.0%} of the applicant's monthly liquidity." if hou_en else "Metric Disabled by System Administrator."
            }
        },
        "professional": {
            "occupation": {
                "value": occupation.replace('_', ' ').title() if occ_en else "N/A",
                "score": occ_score, "max": get_max_obj(config.get("occupation_scores")),
                "reason": f"Employment history and income source is verified as '{occupation.replace('_', ' ')}'." if occ_en else "Metric Disabled by System Administrator."
            }
        },
        "behavioral": {
            "age_bracket": {
                "value": f"{age} yrs" if age_en else "N/A",
                "score": age_score, "max": get_max_arr(config.get("age_brackets")),
                "reason": f"Applicant age ({age}) matches the established demographic risk maturity curve." if age_en else "Metric Disabled by System Administrator."
            },
            "marital_status": {
                "value": marital.title() if mar_en else "N/A",
                "score": mar_score, "max": get_max_obj(config.get("marital_status_scores")),
                "reason": f"Legal marital status is registered and evaluated as '{marital}'." if mar_en else "Metric Disabled by System Administrator."
            },
            "dependents": {
                "value": f"{dependents} dependent(s)" if dep_en else "N/A",
                "score": dep_score, "max": get_max_obj(config.get("dependents_scores")),
                "reason": f"Applicant provides primary financial support for {dependents} dependent(s)." if dep_en else "Metric Disabled by System Administrator."
            },
            "spouse_presence": {
                "value": spouse.title() if spo_en else "N/A",
                "score": spo_score, "max": get_max_obj(config.get("spouse_scores")),
                "reason": f"Spousal or co-borrower liability is categorized as '{spouse}'." if spo_en else "Metric Disabled by System Administrator."
            },
            "spouse_employment": {
                "value": spouse_working.replace('_', ' ').title() if spw_en else "N/A",
                "score": spw_score, "max": get_max_obj(config.get("spouse_working_scores")),
                "reason": f"Secondary household income verification status is '{spouse_working.replace('_', ' ')}'." if spw_en else "Metric Disabled by System Administrator."
            },
            "residence_area": {
                "value": address.title() if add_en else "N/A",
                "score": add_score, "max": get_max_obj(config.get("address_scores")),
                "reason": f"Primary residential geographic zone is classified as '{address}'." if add_en else "Metric Disabled by System Administrator."
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