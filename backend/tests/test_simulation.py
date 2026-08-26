"""Simulation endpoints tests."""
from __future__ import annotations

import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sim.db")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.seed import seed


@pytest.fixture(scope="module")
def client():
    seed()
    with TestClient(app) as c:
        yield c


def test_simulation_workflow(client):
    # 1. Get initial dates
    r0 = client.get("/api/scenarios/revenue_decline/dates")
    assert r0.status_code == 200
    d0 = r0.json()
    assert d0["simulated_days"] == 0
    assert d0["max_day_index"] == 364

    # 2. Simulate next day with 1.5x marketing spend
    r1 = client.post("/api/scenarios/revenue_decline/simulate-day", json={
        "marketing_multiplier": 1.5,
        "stockout_rate": 0.02,
        "competitor_price_index": 1.05
    })
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["status"] == "simulated"
    assert d1["day_index"] == 365
    assert d1["added_tx"] > 0

    # 3. Verify date bounds incremented
    r2 = client.get("/api/scenarios/revenue_decline/dates")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["simulated_days"] == 1
    assert d2["max_day_index"] == 365

    # 4. Reset scenario
    r3 = client.post("/api/scenarios/revenue_decline/reset")
    assert r3.status_code == 200
    assert r3.json()["status"] == "reset"

    # 5. Verify restored
    r4 = client.get("/api/scenarios/revenue_decline/dates")
    assert r4.json()["simulated_days"] == 0
