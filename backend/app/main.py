"""FastAPI application.

Route map:
  POST /api/auth/token      - obtain a JWT for a demo role
  GET  /api/scenarios       - available scenarios + role catalogue
  GET  /api/insight         - full deterministic insight + validated narrative
  GET  /api/drivers         - regression, correlations, anomalies, drill-down
  GET  /api/sources         - source freshness, coverage, schemas
  GET  /api/semantic        - KPI contracts
  POST /api/chat            - natural language -> structured query -> engine
  POST /api/feedback        - capture analyst feedback
  GET  /api/feedback        - feedback dashboard aggregates
  GET  /api/health          - telemetry, cache backend, cost routing
"""
from __future__ import annotations

import os
import time
from datetime import date, timedelta
from functools import lru_cache

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import cache
from .auth import (ROLES, authenticate, can_approve, create_token, current_role,
                   redact_for_role)
from .db import External, Feedback, InsightLog, Marketing, Transaction, get_db, init_db
from .engine.analytics import (anomaly_days, correlations, dim_contribution,
                               kpi_agg, to_frames)
from .engine.generator import DAYS, SCENARIOS, TODAY, date_of, generate, generate_day
from .engine.insight import compute_insight
from .engine.narrative import (allowed_numbers, narrate, narrate_live,
                               validate_narrative)
from .engine.semantic import KPI_META, window_idx
from .schemas import (ChatIn, ChatOut, FeedbackIn, InsightResponse, SimulateIn,
                      TokenResponse)

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="KPI Intelligence-to-Action Engine", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@lru_cache(maxsize=8)
def dataset(scenario: str):
    """Datasets are deterministic, so they are safe to memoize."""
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'")
    return generate(scenario)


SCHEMAS = {
    "transactions": ["order_id", "date", "product_id", "category", "region", "units",
                     "selling_price", "discount", "revenue", "cost", "gross_margin"],
    "marketing": ["date", "campaign_id", "channel", "region", "impressions", "clicks",
                  "ad_spend", "conversions"],
    "external": ["date", "region", "competitor_price_index", "holiday_flag",
                 "weather_index", "supply_availability", "stockout_rate"],
}


# --------------------------------------------------------------------------
@app.post("/api/auth/token", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate(form.username, form.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    role = user["role"]
    return TokenResponse(access_token=create_token(user["username"], role),
                         role=role, label=ROLES[role]["label"])


@app.get("/api/scenarios")
def scenarios():
    return {
        "scenarios": [{"key": k, "label": v.label, "intent": v.intent} for k, v in SCENARIOS.items()],
        "roles": [{"key": k, **{kk: vv for kk, vv in v.items() if kk != "approve"},
                   "approve": v["approve"]} for k, v in ROLES.items()],
    }


@app.get("/api/semantic")
def semantic():
    return {"kpis": KPI_META, "window": window_idx()}


@app.get("/api/sources")
def sources(scenario: str = "revenue_decline"):
    ds = dataset(scenario)
    out = {}
    for key, meta in ds.sources.items():
        expected_h = 1 if key == "transactions" else 24
        out[key] = {**meta, "schema": SCHEMAS[key],
                    "status": "Fresh" if meta["last_refresh_h"] <= expected_h * 1.2 else "Stale",
                    "rows": len(getattr(ds, key))}
    return {"scenario": scenario, "sources": out}


# --------------------------------------------------------------------------
@app.get("/api/insight", response_model=InsightResponse)
def insight(scenario: str = "revenue_decline", kpi: str = "revenue",
            region: str | None = None, category: str | None = None,
            product_id: str | None = None, live: bool = False,
            role: dict = Depends(current_role), db: Session = Depends(get_db)):
    t0 = time.perf_counter()
    ds = dataset(scenario)
    flt = {k: v for k, v in
           {"region": region, "category": category, "product_id": product_id}.items() if v}

    ck = f"insight:{scenario}:{kpi}:{sorted(flt.items())}"
    cached = cache.get(ck)
    if cached:
        ins, cache_hit = cached, True
    else:
        ins = compute_insight(ds, kpi, flt, db=db)
        cache.set(ck, ins)
        cache_hit = False

    nar = (narrate_live if live else narrate)(ds, ins, role["persona"], db=db)
    text = " ".join([nar["headline"], *nar["paragraphs"]])
    validation = validate_narrative(text, allowed_numbers(ins),
                                    nar["causal"] == "associational")

    if nar.get("recommendation"):
        nar["recommendation"]["can_approve"] = can_approve(role, nar["recommendation"]["approval_type"])

    visible = redact_for_role(ins, role)
    latency = (time.perf_counter() - t0) * 1000

    try:
        db.add(InsightLog(scenario=scenario, kpi=kpi, role=role["key"], latency_ms=latency,
                          cache_hit=cache_hit, llm_used=bool(live), provider=nar["provider"],
                          abstained=ins["abstain"], confidence=ins["confidence"]["score"]))
        db.commit()
    except Exception:
        pass

    return {
        **visible,
        "narrative": nar,
        "validation": validation,
        "role": {"key": role["key"], "label": role["label"], "note": role["note"],
                 "customer_data": role["customer_data"]},
        "telemetry": {"latency_ms": round(latency, 1), "cache_hit": cache_hit,
                      "cache_backend": cache.backend(), "llm_used": bool(live),
                      "provider": nar["provider"]},
    }


@app.get("/api/drivers")
def drivers(scenario: str = "revenue_decline", region: str | None = None,
            category: str | None = None, dim: str = "region",
            role: dict = Depends(current_role), db: Session = Depends(get_db)):
    ds = dataset(scenario)
    F = to_frames(ds)
    flt = {k: v for k, v in {"region": region, "category": category}.items() if v}
    ins = compute_insight(ds, "revenue", flt, db=db)
    return {
        "regression": {"attrib": ins["driver_res"]["attrib"], "r2": ins["driver_res"]["r2"],
                       "n": ins["driver_res"]["n"], "note": "Associational - not causal proof"},
        "correlations": correlations(F, flt, db=db, scenario=scenario),
        "anomalies": anomaly_days(F, flt, db=db, scenario=scenario),
        "rules": ins["rules"],
        "drilldown": {"dim": dim, "rows": dim_contribution(F, dim, flt, db=db, scenario=scenario)},
        "hypotheses": ins["hypotheses"],
        "customer_data_allowed": role["customer_data"],
    }


# --------------------------------------------------------------------------
INTENT_PATTERNS = [
    ("evidence", ("evidence", "proof", "show me")),
    ("recommendation", ("what should", "recommend", "action", "do next", "do about")),
    ("confidence", ("confiden", "why are you not", "uncertain", "sure")),
    ("comparison", ("compare", "last month", " vs ", "versus", "previous")),
    ("driver_analysis", ("why", "caused", "driver", "responsible", "reason")),
]


def parse_intent(text: str) -> tuple[str, dict]:
    t = f" {text.lower()} "
    filters = {}
    for r in ("north", "south", "east", "west"):
        if r in t:
            filters["region"] = r.capitalize()
    for c in ("electronics", "fashion", "home", "beauty"):
        if c in t:
            filters["category"] = c.capitalize()
    for intent, keys in INTENT_PATTERNS:
        if any(k in t for k in keys):
            return intent, filters
    return "driver_analysis", filters


@app.post("/api/chat", response_model=ChatOut)
def chat(body: ChatIn, role: dict = Depends(current_role), db: Session = Depends(get_db)):
    t0 = time.perf_counter()
    ds = dataset(body.scenario)
    intent, filters = parse_intent(body.question)
    route = cache.route_for(intent, body.live)
    ins = compute_insight(ds, "revenue", filters)
    scope = f" ({' / '.join(filters.values())})" if filters else ""

    if ins["abstain"]:
        answer = (f"I can't confidently answer for{scope or ' this scope'} yet. "
                  f"{' '.join(ins['reasons'])} Confidence is {round(ins['confidence']['score']*100)}%, "
                  "so I'd refresh data or narrow scope before concluding.")
    elif intent == "evidence":
        answer = f"Evidence{scope}:\n" + "\n".join(
            f"- {e['id']}: {e['claim']} ({e['result']}; via {e['method']})"
            for e in ins["evidence"][:4])
    elif intent == "confidence":
        weak = min(ins["confidence"]["parts"].items(), key=lambda kv: kv[1]["v"])
        answer = (f"Confidence is {round(ins['confidence']['score']*100)}% "
                  f"({ins['confidence']['band']}){scope}. Strongest limiter: {weak[0]} at "
                  f"{round(weak[1]['v']*100)}%. The narrative cannot override this score.")
    elif intent == "comparison":
        F = to_frames(ds)
        w = window_idx()
        cur = kpi_agg(F, w["cur_start"], w["cur_end"], filters)
        prev = kpi_agg(F, w["prev_start"], w["prev_end"], filters)
        chg = (cur["revenue"] - prev["revenue"]) / prev["revenue"] if prev["revenue"] else 0
        answer = (f"This period vs last{scope}: revenue ${cur['revenue']:,.0f} vs "
                  f"${prev['revenue']:,.0f} ({chg*100:+.1f}%); orders {cur['orders']:,.0f} vs "
                  f"{prev['orders']:,.0f}; AOV ${cur['aov']:.0f} vs ${prev['aov']:.0f}.")
    else:
        nar = (narrate_live if body.live else narrate)(ds, ins, role["persona"])
        if intent == "recommendation" and nar["recommendation"]:
            r = nar["recommendation"]
            answer = (f"{r['action']}{scope}. Expected impact: {r['impact'].lower()}. "
                      f"Owner: {r['owner']}. Monitor {r['monitoring'].lower()}.")
        else:
            answer = f"{nar['headline']}{scope}. {nar['paragraphs'][0]}"

    latency = (time.perf_counter() - t0) * 1000
    try:
        db.add(InsightLog(scenario=body.scenario, kpi="revenue", role=role["key"],
                          latency_ms=latency, cache_hit=False, llm_used=route["llm"],
                          provider=route["model"], abstained=ins["abstain"],
                          confidence=ins["confidence"]["score"]))
        db.commit()
    except Exception:
        pass
    return ChatOut(answer=answer, intent=intent, filters=filters, route=route,
                   latency_ms=round(latency, 1))


# --------------------------------------------------------------------------
@app.post("/api/feedback")
def add_feedback(body: FeedbackIn, role: dict = Depends(current_role),
                 db: Session = Depends(get_db)):
    row = Feedback(scenario=body.scenario, kpi=body.kpi, role=role["key"],
                   helpful=body.helpful, category=body.category,
                   actual_driver=body.actual_driver, comment=body.comment)
    db.add(row)
    db.commit()
    return {"status": "recorded", "id": row.id}


@app.get("/api/feedback")
def feedback_dashboard(db: Session = Depends(get_db)):
    total = db.query(func.count(Feedback.id)).scalar() or 0
    helpful = db.query(func.count(Feedback.id)).filter(Feedback.helpful.is_(True)).scalar() or 0
    by_cat = db.query(Feedback.category, func.count(Feedback.id)).group_by(Feedback.category).all()
    recent = (db.query(Feedback).order_by(Feedback.id.desc()).limit(6).all())
    return {
        "total": total,
        "helpful_pct": round(100 * helpful / total) if total else None,
        "by_category": [{"category": c or "uncategorised", "count": n} for c, n in by_cat],
        "corrections": [{"category": r.category, "actual_driver": r.actual_driver,
                         "comment": r.comment, "helpful": r.helpful} for r in recent],
        "improves": [
            "Threshold tuning - materiality and anomaly cutoffs",
            "Driver ranking - reweight attribution when corrections recur",
            "Recommendation policies - retire actions marked not-actionable",
            "Evidence selection - choose what the narrative is given",
            "Model evaluation - track accuracy against analyst corrections",
        ],
        "note": "Feedback is stored and aggregated. No model is retrained live.",
    }


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    rows = db.query(InsightLog).order_by(InsightLog.id.desc()).limit(50).all()
    lat = sorted(r.latency_ms for r in rows) if rows else []
    p95 = lat[int(len(lat) * 0.95) - 1] if lat else 0
    llm_calls = sum(1 for r in rows if r.llm_used)
    return {
        "status": "ok",
        "cache_backend": cache.backend(),
        "requests_logged": len(rows),
        "latency_ms": {"last": round(rows[0].latency_ms, 1) if rows else 0,
                       "avg": round(sum(lat) / len(lat), 1) if lat else 0,
                       "p95": round(p95, 1)},
        "cache_hit_rate": round(100 * sum(1 for r in rows if r.cache_hit) / len(rows)) if rows else 0,
        "llm_avoided_pct": round(100 * (1 - llm_calls / len(rows))) if rows else 100,
        "abstention_rate": round(100 * sum(1 for r in rows if r.abstained) / len(rows)) if rows else 0,
        "routing": list(cache.ROUTES.values()),
        "recent": [{"scenario": r.scenario, "role": r.role, "latency_ms": round(r.latency_ms, 1),
                    "cache_hit": r.cache_hit, "provider": r.provider,
                    "abstained": r.abstained, "confidence": r.confidence} for r in rows[:12]],
    }


# --------------------------------------------------------------------------
@app.get("/api/scenarios/{scenario}/dates")
def scenario_dates(scenario: str, db: Session = Depends(get_db)):
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'")
    min_date = db.query(func.min(Transaction.date)).filter(Transaction.scenario == scenario).scalar()
    max_date = db.query(func.max(Transaction.date)).filter(Transaction.scenario == scenario).scalar()
    tx_count = db.query(func.count(Transaction.id)).filter(Transaction.scenario == scenario).scalar() or 0
    mk_count = db.query(func.count(Marketing.id)).filter(Marketing.scenario == scenario).scalar() or 0
    ex_count = db.query(func.count(External.id)).filter(External.scenario == scenario).scalar() or 0

    epoch = TODAY - timedelta(days=DAYS - 1)
    max_day_i = (max_date - epoch).days if max_date else DAYS - 1

    return {
        "scenario": scenario,
        "min_date": str(min_date) if min_date else None,
        "max_date": str(max_date) if max_date else None,
        "days_span": (max_date - min_date).days + 1 if (max_date and min_date) else DAYS,
        "max_day_index": max_day_i,
        "simulated_days": max(0, max_day_i - (DAYS - 1)),
        "tx_rows": tx_count,
        "mk_rows": mk_count,
        "ex_rows": ex_count,
    }


@app.post("/api/scenarios/{scenario}/simulate-day")
def simulate_day(scenario: str, body: SimulateIn, db: Session = Depends(get_db)):
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'")
    max_date = db.query(func.max(Transaction.date)).filter(Transaction.scenario == scenario).scalar()
    epoch = TODAY - timedelta(days=DAYS - 1)
    current_max_i = (max_date - epoch).days if max_date else DAYS - 1
    next_i = current_max_i + 1
    next_date = date_of(next_i)

    tx_list, mk_list, ex_list = generate_day(
        scenario, next_i,
        marketing_mult=body.marketing_multiplier,
        stockout_override=body.stockout_rate,
        competitor_price_override=body.competitor_price_index,
    )

    db.bulk_save_objects([Transaction(scenario=scenario, **{**r, "date": date.fromisoformat(r["date"])}) for r in tx_list])
    db.bulk_save_objects([Marketing(scenario=scenario, **{**r, "date": date.fromisoformat(r["date"])}) for r in mk_list])
    db.bulk_save_objects([External(scenario=scenario, **{**r, "date": date.fromisoformat(r["date"])}) for r in ex_list])
    db.commit()

    cache.clear()

    return {
        "status": "simulated",
        "scenario": scenario,
        "day_index": next_i,
        "date": str(next_date),
        "added_tx": len(tx_list),
        "added_mk": len(mk_list),
        "added_ex": len(ex_list),
    }


@app.post("/api/scenarios/{scenario}/reset")
def reset_scenario(scenario: str, db: Session = Depends(get_db)):
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'")
    db.query(Transaction).filter(Transaction.scenario == scenario).delete()
    db.query(Marketing).filter(Marketing.scenario == scenario).delete()
    db.query(External).filter(External.scenario == scenario).delete()
    db.commit()

    ds = generate(scenario)
    db.bulk_save_objects([Transaction(scenario=scenario, **{**r, "date": date.fromisoformat(r["date"])}) for r in ds.transactions])
    db.bulk_save_objects([Marketing(scenario=scenario, **{**r, "date": date.fromisoformat(r["date"])}) for r in ds.marketing])
    db.bulk_save_objects([External(scenario=scenario, **{**r, "date": date.fromisoformat(r["date"])}) for r in ds.external])
    db.commit()

    cache.clear()

    return {"status": "reset", "scenario": scenario}

