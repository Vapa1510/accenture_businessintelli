"""Orchestrates the full analysis pipeline for a single KPI.

This is where movement detection, driver analysis, evidence, and the
abstention decision all come together. The abstention logic was one of the
trickier parts — we wanted it to be an explicit decision, not just "score < X".
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session

from .analytics import (
    anomaly_days, business_rules, confidence, detect_movements, dim_contribution,
    driver_attribution, history_days, hypotheses, kpi_agg, lmdi_revenue, to_frames,
)
from .generator import Dataset, date_of, iso
from .semantic import KPI_META, window_idx


def _money(x: float) -> str:
    return f"{'-' if x < 0 else ''}${abs(x):,.0f}"


def _pct(x: float) -> str:
    return f"{x * 100:.1f}%"


def _signpct(x: float) -> str:
    return f"{'+' if x >= 0 else ''}{x * 100:.1f}%"


def period_str(db: Session | None = None, scenario: str | None = None) -> str:
    w = window_idx(db, scenario)
    return f"{iso(date_of(w['cur_start']))} -> {iso(date_of(w['cur_end']))}"


def build_evidence(ds: Dataset, F, ins: dict, db: Session | None = None, scenario: str | None = None) -> list[dict]:
    """Each evidence object binds a claim to its source, method and result."""
    w = window_idx(db, scenario)
    flt = ins["filter"]
    cur = kpi_agg(F, w["cur_start"], w["cur_end"], flt, db=db, scenario=scenario)
    prev = kpi_agg(F, w["prev_start"], w["prev_end"], flt, db=db, scenario=scenario)
    spend_drop = (cur["ad_spend"] - prev["ad_spend"]) / prev["ad_spend"] if prev["ad_spend"] else 0.0

    target = ins["target"]
    conv = next((m for m in ins["movements"] if m["key"] == "conv_rate"), None)
    orders = next((m for m in ins["movements"] if m["key"] == "orders"), None)
    mk = next((a for a in ins["driver_res"]["attrib"] if a["raw"] == "ad_spend"), None)
    top_region = ins["region_contrib"][0] if ins["region_contrib"] else None
    top_cat = ins["cat_contrib"][0] if ins["cat_contrib"] else None
    ts = datetime.now(timezone.utc).isoformat(timespec="minutes")
    period = period_str(db, scenario)

    E: list[dict] = []

    def push(**kw):
        E.append({"ts": ts, "period": period, **kw})

    push(id="E101", claim=f"Revenue moved {_signpct(target['pct'])} vs prior period",
         source="Transaction Database", dataset="transactions",
         method="Period aggregation + z-score",
         result=f"{_money(target['abs'])} (z={target['z']:.2f})",
         num=[abs(target["pct"]) * 100, abs(target["abs"])], confidence=0.98)
    push(id="E102", claim=f"Marketing spend changed {_signpct(spend_drop)}",
         source="Marketing Platform", dataset="marketing", method="Period aggregation",
         result=_money(cur["ad_spend"] - prev["ad_spend"]),
         num=[abs(spend_drop) * 100], confidence=0.55 if ds.scenario.stale else 0.9)
    if mk:
        push(id="E103", claim=f"Marketing is associated with ~{mk['pct']}% of the movement",
             source="Transaction + Marketing", dataset="regression",
             method="OLS attribution (associational)",
             result=f"{_money(mk['effect'])} (beta std, p={mk['pval']:.3f})",
             num=[mk["pct"], abs(mk["effect"])], confidence=0.85 if mk["significant"] else 0.5)
    if conv:
        push(id="E104", claim=f"Conversion rate moved {_signpct(conv['pct'])}",
             source="Marketing Platform", dataset="marketing", method="Period aggregation",
             result=f"{_pct(conv['current'])} vs {_pct(conv['previous'])}",
             num=[abs(conv["pct"]) * 100], confidence=0.8)
    if orders:
         push(id="E105", claim=f"Orders moved {_signpct(orders['pct'])}",
              source="Transaction Database", dataset="transactions", method="Period aggregation",
              result=f"{orders['current']:,.0f} vs {orders['previous']:,.0f}",
              num=[abs(orders["pct"]) * 100], confidence=0.95)
    if top_region:
        push(id="E106", claim=f"{top_region['level']} region contributed most to the movement",
             source="Transaction Database", dataset="transactions",
             method="Dimensional contribution", result=_money(top_region["contribution"]),
             num=[abs(top_region["contribution"])], confidence=0.9)
    if top_cat:
        push(id="E107", claim=f"{top_cat['level']} category contributed most by category",
             source="Transaction Database", dataset="transactions",
             method="Dimensional contribution", result=_money(top_cat["contribution"]),
             num=[abs(top_cat["contribution"])], confidence=0.9)
    push(id="E108", claim="Orders vs price split of the revenue change",
         source="Transaction Database", dataset="transactions",
         method="LMDI factor decomposition (exact)",
         result=f"Orders {_money(ins['lmdi']['orders_effect'])} / AOV {_money(ins['lmdi']['aov_effect'])}",
         num=[abs(ins["lmdi"]["orders_effect"]), abs(ins["lmdi"]["aov_effect"])], confidence=0.97)
    push(id="E109", claim="Explanatory model fit", source="Transaction + Marketing + Context",
         dataset="regression", method=f"OLS, n={ins['driver_res']['n']}",
         result=f"R2={ins['driver_res']['r2']:.3f}",
         num=[ins["driver_res"]["r2"] * 100], confidence=0.7)
    if ins["rules"]["stockout"] is not None and ins["rules"]["stockout"] > 0.1:
        push(id="E110", claim="Stockout rate elevated", source="External / Context",
             dataset="external", method="Business rule threshold",
             result=f"{_pct(ins['rules']['stockout'])} > 10% threshold",
             num=[ins["rules"]["stockout"] * 100], confidence=0.75)
    return E


def compute_insight(ds: Dataset, kpi: str = "revenue", flt: dict | None = None,
                    with_anomalies: bool = False, db: Session | None = None) -> dict[str, Any]:
    flt = flt or {}
    F = to_frames(ds) if ds is not None else None
    scenario = ds.scenario_key if ds is not None else None

    movements = detect_movements(F, flt, db=db, scenario=scenario)
    target = next((m for m in movements if m["key"] == kpi), None)
    if target is None:
        # shouldn't happen with well-formed data, but guard against it
        target = movements[0] if movements else {
            "key": kpi, "name": kpi, "unit": "$", "current": 0, "previous": 0,
            "abs": 0, "pct": 0, "baseline": 0, "z": 0, "impact_dollars": 0,
            "strategic": 0, "significant": False, "materiality": 0, "priority": "LOW",
            "effective_threshold": 0.05,
        }
    lmdi = lmdi_revenue(F, flt, db=db, scenario=scenario)
    driver_res = driver_attribution(F, flt, db=db, scenario=scenario)
    rules = business_rules(F, flt, db=db, scenario=scenario)
    conf = confidence(ds, F, target, driver_res, flt, db=db)
    hyps = hypotheses(driver_res, rules)
    region_contrib = dim_contribution(F, "region", flt, db=db, scenario=scenario)
    cat_contrib = dim_contribution(F, "category", flt, db=db, scenario=scenario)

    # ---- explicit, auditable abstention rule ----
    marketing_stale = ds.sources["marketing"]["last_refresh_h"] > 26 if ds is not None else False
    external_missing = ds.sources["external"]["missing"] > 0.10 if ds is not None else False
    sparse = conf["history_days"] < 30
    contradictory = conf["parts"]["agreement"]["v"] < 0.5 and (marketing_stale or external_missing)
    low_composite = conf["score"] < 0.60
    abstain = sparse or contradictory or low_composite
    abstain_kind = ("sparse_history" if sparse else "contradictory" if contradictory
                    else "low_confidence" if low_composite else None)

    reasons: list[str] = []
    if sparse:
        reasons.append(f"Only {conf['history_days']} days of history for the affected slice - no reliable baseline.")
    if marketing_stale:
        reasons.append(f"Marketing data is {round(ds.sources['marketing']['last_refresh_h'])}h stale.")
    if external_missing:
        reasons.append(f"Inventory / external coverage incomplete ({round(ds.sources['external']['missing']*100)}% of records missing).")
    if conf["parts"]["agreement"]["v"] < 0.5:
        reasons.append("Signals conflict across sources - no single driver is corroborated.")

    ins = {
        "scenario": scenario, "kpi": kpi, "filter": flt,
        "movements": movements, "target": target, "lmdi": lmdi,
        "driver_res": driver_res, "rules": rules, "confidence": conf,
        "hypotheses": hyps, "region_contrib": region_contrib, "cat_contrib": cat_contrib,
        "abstain": abstain, "abstain_kind": abstain_kind, "sparse": sparse, "reasons": reasons,
        "clarifications": [
            "Which region should I prioritize?",
            "Should I optimize for revenue or margin?",
            "Do you want operational actions or strategic recommendations?",
        ],
        "period": period_str(db, scenario),
        "sources": ds.sources if ds is not None else {},
        "semantic": KPI_META,
    }
    if with_anomalies:
        ins["anomalies"] = anomaly_days(F, flt, db=db, scenario=scenario)
    ins["evidence"] = build_evidence(ds, F, ins, db=db, scenario=scenario)
    return ins
