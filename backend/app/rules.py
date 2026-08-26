"""Recommendation rules — maps fired conditions to persona-specific actions.

These are deliberately kept separate from the regression, so a business user
can audit exactly why a recommendation was (or wasn't) made.
"""
from __future__ import annotations
from typing import Any
from sqlalchemy.orm import Session

# Default declarative rules registry
DEFAULT_RULES = [
    {
        "id": "R101",
        "description": "Stockout / Supply constraint recommendation",
        "persona": "operations",
        "condition": lambda ins: "SUPPLY_CONSTRAINT" in {f["code"] for f in ins["rules"]["fired"]},
        "action_template": "Prioritize replenishment of the top affected SKUs in {target_region}",
        "driver_template": "Stockout rate {stockout_rate:.1f}%",
        "lever": "Inventory replenishment",
        "impact_template": "Potential recovery of supply flow",
        "owner": "Operations Manager",
        "approval_type": "inventory",
        "monitoring": "Stockout rate and fill rate for 7 days"
    },
    {
        "id": "R102",
        "description": "Competitor pricing pressure recommendation",
        "persona": "operations",
        "condition": lambda ins: "PRICING_PRESSURE" in {f["code"] for f in ins["rules"]["fired"]},
        "action_template": "Initiate dynamic pricing match or promotional bundle for {target_category} in {target_region}",
        "driver_template": "Competitor price index {comp_index:.3f} < 0.95",
        "lever": "Inventory allocation / Pricing alignment",
        "impact_template": "Protect market share in price-sensitive channels",
        "owner": "Operations Manager",
        "approval_type": "inventory",
        "monitoring": "Competitor index and category margin over 7 days"
    },
    {
        "id": "R103",
        "description": "Paid Search Campaign spend decline recovery recommendation",
        "persona": "marketing",
        "condition": lambda ins: ins["target"]["pct"] < 0 and ins["rules"]["spend_drop"] < -0.15,
        "action_template": "Restore spend on the previously highest-converting Paid Search campaigns in {target_region}",
        "driver_template": "Paid Search spend drop of {spend_drop_pct:.1f}%",
        "lever": "Marketing budget allocation",
        "impact_template": "Potential recovery of 4-6% of lost conversions",
        "owner": "Marketing Manager",
        "approval_type": "campaign",
        "monitoring": "Conversion rate and CAC over the next 7 days"
    },
    {
        "id": "R104",
        "description": "Paid Search Campaign spend expansion recommendation",
        "persona": "marketing",
        "condition": lambda ins: ins["target"]["pct"] >= 0 and ins["rules"]["spend_drop"] >= 0,
        "action_template": "Sustain the winning campaigns and cap spend at efficient CAC in {target_region}",
        "driver_template": "Sustain campaign growth",
        "lever": "Marketing budget allocation",
        "impact_template": "Protect current conversion gains",
        "owner": "Marketing Manager",
        "approval_type": "campaign",
        "monitoring": "Conversion rate and CAC over the next 7 days"
    },
    {
        "id": "R105",
        "description": "Executive/Finance recovery recommendation on marketing drop",
        "persona": "executive",
        "condition": lambda ins: ins["target"]["pct"] < 0,
        "action_template": "Restore budget to the highest-performing paid campaigns, prioritizing {target_region}",
        "driver_template": "Marketing spend drop of {spend_drop_pct:.1f}%",
        "lever": "Budget reallocation",
        "impact_template": "Potential recovery of 4-6% of lost conversions",
        "owner": "Marketing Manager",
        "approval_type": "budget",
        "monitoring": "Conversion, CAC, orders and revenue over 7 days"
    },
    {
        "id": "R106",
        "description": "Executive/Finance growth protection recommendation",
        "persona": "executive",
        "condition": lambda ins: ins["target"]["pct"] >= 0,
        "action_template": "Sustain and scale the winning campaigns within efficient CAC limits",
        "driver_template": "Sustain growth",
        "lever": "Budget reallocation",
        "impact_template": "Protect the current revenue trajectory",
        "owner": "Marketing Manager",
        "approval_type": "budget",
        "monitoring": "Conversion, CAC, orders and revenue over 7 days"
    }
]

def get_recommendation(ins: dict[str, Any], persona: str, db: Session | None = None) -> dict[str, Any] | None:
    # check past feedback — if users consistently say a lever is irrelevant,
    # skip it this time so we don't keep suggesting the same thing
    unhelpful_levers = set()
    if db is not None:
        try:
            from .db import Feedback
            scenario = ins.get("scenario")
            fb_rows = db.query(Feedback.comment, Feedback.category).filter(
                Feedback.scenario == scenario,
                Feedback.helpful == False
            ).all()
            for r in fb_rows:
                if r.category == "Irrelevant recommendation" and r.comment:
                    unhelpful_levers.add(r.comment.strip())
        except Exception:
            pass

    # Find first rule matching the persona and condition
    matched_rule = None
    for rule in DEFAULT_RULES:
        if rule["persona"] == persona:
            try:
                if rule["condition"](ins):
                    if rule["lever"] in unhelpful_levers:
                        continue
                    matched_rule = rule
                    break
            except Exception:
                continue

    # Fallback to the persona's first matching rule if no condition met or if penalized
    if not matched_rule:
        for rule in DEFAULT_RULES:
            if rule["persona"] == persona:
                matched_rule = rule
                break
                
    if not matched_rule:
        return None

    # Variable injection
    target_region = ins["filter"].get("region", "top affected regions")
    target_category = ins["filter"].get("category", "lead categories")
    
    stockout_val = ins["rules"].get("stockout") or 0.0
    comp_index_val = ins["rules"].get("comp") or 1.0
    spend_drop_val = ins["rules"].get("spend_drop") or 0.0

    action = matched_rule["action_template"].format(
        target_region=target_region,
        target_category=target_category
    )
    driver = matched_rule["driver_template"].format(
        stockout_rate=stockout_val * 100,
        comp_index=comp_index_val,
        spend_drop_pct=abs(spend_drop_val) * 100,
        target_region=target_region,
        target_category=target_category
    )
    impact = matched_rule["impact_template"]

    return {
        "rule_id": matched_rule["id"],
        "driver": driver,
        "lever": matched_rule["lever"],
        "action": action,
        "impact": impact,
        "owner": matched_rule["owner"],
        "approval_type": matched_rule["approval_type"],
        "monitoring": matched_rule["monitoring"]
    }
