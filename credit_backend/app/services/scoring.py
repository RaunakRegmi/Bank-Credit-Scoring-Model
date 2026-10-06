"""The credit scoring rule engine.

Pure computation: it takes a CBS customer record plus the active rule matrix and
returns the score, the routing decision, and a per-metric explanation of how
every point was awarded. No database or HTTP concerns live here.

Each rule section may be either a bare value (legacy shape) or a dict carrying
an `enabled` flag alongside its `brackets` / `scores`. A disabled section awards
zero points and contributes zero to the attainable maximum.
"""

from typing import Any, NamedTuple

DISABLED_REASON = "Metric Disabled by System Administrator."

DEFAULT_THRESHOLD_BANDS = [
    {"action": "Approved", "min": 650, "max": 1000, "risk": "Low Risk"},
    {"action": "Third-Party Verification", "min": 500, "max": 649, "risk": "Moderate Risk"},
    {"action": "Declined", "min": 0, "max": 499, "risk": "High Risk"},
]

# Returned when the total falls outside every configured band.
FALLBACK_STATUS = "Declined"
FALLBACK_RISK = "Very High Risk"


class ScoreResult(NamedTuple):
    total_score: int
    status: str
    risk_category: str
    breakdown: dict[str, Any]


def _parse_section(section_data, is_array: bool = False) -> tuple[bool, Any]:
    """Split a rule section into its enabled flag and its payload."""
    if isinstance(section_data, dict) and "enabled" in section_data:
        enabled = section_data.get("enabled", True)
        data = section_data.get("brackets", []) if is_array else section_data.get("scores", {})
    else:
        enabled = True
        data = section_data or ([] if is_array else {})
    return enabled, data


def _max_of_brackets(section_data) -> int:
    """Highest score attainable from a bracket list, or 0 when disabled."""
    enabled, brackets = _parse_section(section_data, True)
    return max([item.get("score", 0) for item in brackets]) if enabled and brackets else 0


def _max_of_scores(section_data) -> int:
    """Highest score attainable from a score map, or 0 when disabled."""
    enabled, scores = _parse_section(section_data, False)
    return max([int(value) for value in scores.values()]) if enabled and scores else 0


def _words(value) -> str:
    """Slug with underscores opened out, e.g. `no_verified_income` -> `no verified income`."""
    return value.replace("_", " ") if isinstance(value, str) else "N/A"


def _pretty(value) -> str:
    """Title-cased form of a slug, e.g. `stable_12_plus_months` -> `Stable 12 Plus Months`."""
    return _words(value).title()


def _titled(value) -> str:
    """Title-cased as-is, leaving any underscores in place (matches the legacy display)."""
    return value.title() if isinstance(value, str) else "N/A"


def _metric(enabled: bool, value: str, score: int, max_score: int, reason: str) -> dict[str, Any]:
    """One entry of the explainer breakdown."""
    return {
        "value": value if enabled else "N/A",
        "score": score,
        "max": max_score,
        "reason": reason if enabled else DISABLED_REASON,
    }


def calculate_score(customer, config: dict) -> ScoreResult:
    # Raw CBS values
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

    # A zero income denominator is treated as the worst case rather than an error.
    expense_ratio = outgoing / incoming if incoming > 0 else 1.0
    housing_ratio = housing / incoming if incoming > 0 else 1.0

    # Resolve every section's enabled flag and payload up front.
    sal_en, sal_data = _parse_section(config.get("salary_brackets"), True)
    inc_en, inc_data = _parse_section(config.get("incoming_months_scores"), False)
    out_en, out_data = _parse_section(config.get("outgoing_ratio_brackets"), True)
    hou_en, hou_data = _parse_section(config.get("housing_ratio_brackets"), True)
    occ_en, occ_data = _parse_section(config.get("occupation_scores"), False)
    age_en, age_data = _parse_section(config.get("age_brackets"), True)
    mar_en, mar_data = _parse_section(config.get("marital_status_scores"), False)
    dep_en, dep_data = _parse_section(config.get("dependents_scores"), False)
    spo_en, spo_data = _parse_section(config.get("spouse_scores"), False)
    spw_en, spw_data = _parse_section(config.get("spouse_working_scores"), False)
    add_en, add_data = _parse_section(config.get("address_scores"), False)

    # Bracket lookups take the first bracket the value fits into, so the rule
    # matrix must stay sorted ascending by `max`.
    sal_score = next((b["score"] for b in sal_data if salary <= b["max"]), 0) if sal_en else 0
    inc_score = inc_data.get(income_months, 0) if inc_en else 0
    out_score = next((b["score"] for b in out_data if expense_ratio <= b["max"]), 0) if out_en else 0
    hou_score = next((b["score"] for b in hou_data if housing_ratio <= b["max"]), 0) if hou_en else 0
    occ_score = occ_data.get(occupation, 0) if occ_en else 0
    age_score = next((b["score"] for b in age_data if age <= b["max"]), 0) if age_en else 0
    mar_score = mar_data.get(marital, 0) if mar_en else 0
    dep_score = dep_data.get(dependents, 0) if dep_en else 0
    spo_score = spo_data.get(spouse, 0) if spo_en else 0
    spw_score = spw_data.get(spouse_working, 0) if spw_en else 0
    add_score = add_data.get(address, 0) if add_en else 0

    breakdown = {
        "financial": {
            "salary": _metric(
                sal_en,
                f"Rs. {salary:,.2f}",
                sal_score,
                _max_of_brackets(config.get("salary_brackets")),
                f"Applicant base salary falls into the {sal_score}-point configurable earning bracket.",
            ),
            "incoming_consistency": _metric(
                inc_en,
                f"{income_months} months",
                inc_score,
                _max_of_scores(config.get("incoming_months_scores")),
                f"Consistent incoming deposits were recorded for {income_months} out of the last 6 months.",
            ),
            "expense_ratio": _metric(
                out_en,
                f"{expense_ratio:.0%}",
                out_score,
                _max_of_brackets(config.get("outgoing_ratio_brackets")),
                f"Monthly outgoing expenses consume {expense_ratio:.0%} of the total incoming funds.",
            ),
            "housing_ratio": _metric(
                hou_en,
                f"{housing_ratio:.0%}",
                hou_score,
                _max_of_brackets(config.get("housing_ratio_brackets")),
                f"Housing and rental costs represent {housing_ratio:.0%} of the applicant's monthly liquidity.",
            ),
        },
        "professional": {
            "occupation": _metric(
                occ_en,
                _pretty(occupation),
                occ_score,
                _max_of_scores(config.get("occupation_scores")),
                f"Employment history and income source is verified as '{_words(occupation)}'.",
            ),
        },
        "behavioral": {
            "age_bracket": _metric(
                age_en,
                f"{age} yrs",
                age_score,
                _max_of_brackets(config.get("age_brackets")),
                f"Applicant age ({age}) matches the established demographic risk maturity curve.",
            ),
            "marital_status": _metric(
                mar_en,
                _titled(marital),
                mar_score,
                _max_of_scores(config.get("marital_status_scores")),
                f"Legal marital status is registered and evaluated as '{marital}'.",
            ),
            "dependents": _metric(
                dep_en,
                f"{dependents} dependent(s)",
                dep_score,
                _max_of_scores(config.get("dependents_scores")),
                f"Applicant provides primary financial support for {dependents} dependent(s).",
            ),
            "spouse_presence": _metric(
                spo_en,
                _titled(spouse),
                spo_score,
                _max_of_scores(config.get("spouse_scores")),
                f"Spousal or co-borrower liability is categorized as '{spouse}'.",
            ),
            "spouse_employment": _metric(
                spw_en,
                _pretty(spouse_working),
                spw_score,
                _max_of_scores(config.get("spouse_working_scores")),
                f"Secondary household income verification status is '{_words(spouse_working)}'.",
            ),
            "residence_area": _metric(
                add_en,
                _titled(address),
                add_score,
                _max_of_scores(config.get("address_scores")),
                f"Primary residential geographic zone is classified as '{address}'.",
            ),
        },
    }

    total_score = sum(
        metric["score"] for group in breakdown.values() for metric in group.values()
    )

    status = FALLBACK_STATUS
    risk_category = FALLBACK_RISK
    for band in config.get("threshold_bands", DEFAULT_THRESHOLD_BANDS):
        if band["min"] <= total_score <= band["max"]:
            status = band["action"]
            risk_category = band["risk"]
            break

    return ScoreResult(total_score, status, risk_category, breakdown)
