"""End-to-end API tests.

Exercises every route, including the RBAC redaction path and the abstention
path, using an isolated SQLite database.
"""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_api.db")

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _auth(client, role: str) -> dict:
    r = client.post("/api/auth/token", data={"username": role, "password": role})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_scenarios_and_roles(client):
    d = client.get("/api/scenarios").json()
    assert {s["key"] for s in d["scenarios"]} == {
        "revenue_decline", "revenue_growth", "contradictory", "new_product"}
    assert {r["key"] for r in d["roles"]} == {"executive", "marketing", "operations", "analyst"}


def test_login_issues_role_token(client):
    r = client.post("/api/auth/token", data={"username": "marketing", "password": "marketing"})
    assert r.status_code == 200
    assert r.json()["role"] == "marketing"


def test_login_rejects_bad_password(client):
    r = client.post("/api/auth/token", data={"username": "marketing", "password": "wrong"})
    assert r.status_code == 401


def test_insight_decline_is_confident_and_validated(client):
    d = client.get("/api/insight", params={"scenario": "revenue_decline"},
                   headers=_auth(client, "executive")).json()
    assert d["abstain"] is False
    assert d["target"]["priority"] == "HIGH"
    assert -0.20 < d["target"]["pct"] < -0.09
    assert d["validation"]["numeric"] is True
    assert d["validation"]["causal"] is True
    assert d["narrative"]["causal"] == "associational"
    assert d["narrative"]["recommendation"]["can_approve"] is True


def test_rbac_hides_restricted_kpis(client):
    d = client.get("/api/insight", params={"scenario": "revenue_decline"},
                   headers=_auth(client, "marketing")).json()
    visible = {m["key"] for m in d["movements"]}
    assert "margin_pct" not in visible
    assert "margin_pct" in {r["key"] for r in d["restricted_kpis"]}
    assert d["customer_data_allowed"] is False


def test_rbac_blocks_approval_outside_rights(client):
    d = client.get("/api/insight", params={"scenario": "revenue_decline"},
                   headers=_auth(client, "operations")).json()
    rec = d["narrative"]["recommendation"]
    assert rec["approval_type"] == "inventory"
    assert rec["can_approve"] is True

    d2 = client.get("/api/insight", params={"scenario": "revenue_decline"},
                    headers=_auth(client, "analyst")).json()
    assert d2["narrative"]["recommendation"]["can_approve"] is False


def test_contradictory_scenario_abstains(client):
    d = client.get("/api/insight", params={"scenario": "contradictory"},
                   headers=_auth(client, "executive")).json()
    assert d["abstain"] is True
    assert d["abstain_kind"] == "contradictory"
    assert d["narrative"]["recommendation"] is None
    assert d["clarifications"]


def test_new_product_abstains_on_sparse_history(client):
    d = client.get("/api/insight",
                   params={"scenario": "new_product", "product_id": "EL-3"},
                   headers=_auth(client, "executive")).json()
    assert d["abstain"] is True
    assert d["abstain_kind"] == "sparse_history"
    assert d["confidence"]["history_days"] < 30


def test_cache_hit_on_second_call(client):
    h = _auth(client, "executive")
    client.get("/api/insight", params={"scenario": "revenue_growth"}, headers=h)
    d = client.get("/api/insight", params={"scenario": "revenue_growth"}, headers=h).json()
    assert d["telemetry"]["cache_hit"] is True


def test_drivers_endpoint(client):
    d = client.get("/api/drivers", params={"scenario": "revenue_decline"},
                   headers=_auth(client, "analyst")).json()
    assert d["regression"]["r2"] > 0.5
    assert len(d["correlations"]) == 5
    assert "not causal" in d["regression"]["note"].lower()
    assert d["drilldown"]["rows"]


def test_sources_endpoint_flags_stale_marketing(client):
    d = client.get("/api/sources", params={"scenario": "contradictory"}).json()
    assert d["sources"]["marketing"]["status"] == "Stale"
    assert d["sources"]["transactions"]["rows"] > 0


def test_semantic_contract(client):
    d = client.get("/api/semantic").json()
    assert set(d["kpis"]) == {"revenue", "orders", "aov", "conv_rate", "margin_pct"}
    assert d["kpis"]["revenue"]["formula"] == "SUM(revenue)"


@pytest.mark.parametrize("q,intent,llm", [
    ("Show me evidence", "evidence", False),
    ("Why are you not confident?", "confidence", False),
    ("Compare to previous period", "comparison", False),
    ("Why is revenue down in North?", "driver_analysis", False),
    ("What should I do?", "recommendation", False),
])
def test_chat_routes_intents(client, q, intent, llm):
    d = client.post("/api/chat", json={"question": q, "scenario": "revenue_decline"},
                    headers=_auth(client, "executive")).json()
    assert d["intent"] == intent
    assert d["route"]["llm"] is llm
    assert d["answer"]


def test_chat_extracts_region_filter(client):
    d = client.post("/api/chat", json={"question": "why is revenue down in North?",
                                       "scenario": "revenue_decline"},
                    headers=_auth(client, "executive")).json()
    assert d["filters"].get("region") == "North"


def test_feedback_roundtrip(client):
    h = _auth(client, "analyst")
    r = client.post("/api/feedback", json={"scenario": "revenue_decline", "helpful": False,
                                           "category": "Incorrect driver",
                                           "actual_driver": "Inventory shortage",
                                           "comment": "Supplier delay"}, headers=h)
    assert r.json()["status"] == "recorded"
    d = client.get("/api/feedback").json()
    assert d["total"] >= 1
    assert any(c["actual_driver"] == "Inventory shortage" for c in d["corrections"])


def test_health_reports_telemetry(client):
    d = client.get("/api/health").json()
    assert d["status"] == "ok"
    assert d["requests_logged"] > 0
    assert d["llm_avoided_pct"] == 100  # nothing ran in live mode
    assert len(d["routing"]) == 3
