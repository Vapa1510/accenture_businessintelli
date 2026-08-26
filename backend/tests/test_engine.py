"""Engine verification.

These assertions check that the analytical layer RECOVERS the drivers that were
injected into each scenario - the dataset has known ground truth, so the engine
can be graded rather than trusted. Run with: pytest -q
"""
from __future__ import annotations

import math

import pytest

from app.engine.generator import SCENARIOS, generate
from app.engine.insight import compute_insight
from app.engine.narrative import allowed_numbers, narrate, validate_narrative


@pytest.fixture(scope="module")
def scenarios():
    return {k: generate(k) for k in SCENARIOS}


def _ins(ds, product=None):
    flt = {"product_id": product} if product else {}
    return compute_insight(ds, "revenue", flt)


# ---------------------------------------------------------------- scenario A
def test_a_decline_magnitude(scenarios):
    ins = _ins(scenarios["revenue_decline"])
    assert -0.20 < ins["target"]["pct"] < -0.09


def test_a_is_high_priority(scenarios):
    assert _ins(scenarios["revenue_decline"])["target"]["priority"] == "HIGH"


def test_a_marketing_is_top_driver(scenarios):
    ins = _ins(scenarios["revenue_decline"])
    assert any(a["raw"] == "ad_spend" for a in ins["driver_res"]["attrib"][:2])


def test_a_explains_rather_than_abstains(scenarios):
    assert _ins(scenarios["revenue_decline"])["confidence"]["band"] != "low"


def test_a_lmdi_is_exact(scenarios):
    lmdi = _ins(scenarios["revenue_decline"])["lmdi"]
    assert abs(lmdi["d_r"] - lmdi["check"]) < 1.0


# ---------------------------------------------------------------- scenario B
def test_b_growth_magnitude(scenarios):
    ins = _ins(scenarios["revenue_growth"])
    assert 0.12 < ins["target"]["pct"] < 0.24


# ---------------------------------------------------------------- scenario C
def test_c_abstains_on_contradiction(scenarios):
    ins = _ins(scenarios["contradictory"])
    assert ins["abstain"] is True
    assert ins["abstain_kind"] == "contradictory"


def test_c_flags_stale_marketing(scenarios):
    ins = _ins(scenarios["contradictory"])
    assert any("stale" in r for r in ins["reasons"])


# ---------------------------------------------------------------- scenario D
def test_d_sparse_history(scenarios):
    ins = _ins(scenarios["new_product"], product="EL-3")
    assert ins["confidence"]["history_days"] < 30


def test_d_abstains_on_sparse(scenarios):
    ins = _ins(scenarios["new_product"], product="EL-3")
    assert ins["abstain"] is True
    assert ins["abstain_kind"] == "sparse_history"


# ---------------------------------------------------------------- invariants
@pytest.mark.parametrize("key", list(SCENARIOS))
def test_no_nan_anywhere(scenarios, key):
    ins = _ins(scenarios[key], product="EL-3" if key == "new_product" else None)

    def walk(o, path="root"):
        if isinstance(o, float):
            assert math.isfinite(o), f"non-finite at {path}"
        elif isinstance(o, dict):
            for k, v in o.items():
                walk(v, f"{path}.{k}")
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, f"{path}[{i}]")

    walk(ins)


@pytest.mark.parametrize("key", list(SCENARIOS))
def test_narrative_numbers_all_trace_to_evidence(scenarios, key):
    """The core guarantee: prose may not contain an unverifiable figure."""
    ds = scenarios[key]
    ins = _ins(ds, product="EL-3" if key == "new_product" else None)
    for persona in ("executive", "marketing", "operations"):
        nar = narrate(ds, ins, persona)
        text = " ".join([nar["headline"], *nar["paragraphs"]])
        v = validate_narrative(text, allowed_numbers(ins), True)
        assert v["numeric"], f"{key}/{persona} unverified: {v['unmatched']}"
        assert v["causal"], f"{key}/{persona} used causal language"


def test_abstained_insight_has_no_recommendation(scenarios):
    ds = scenarios["contradictory"]
    ins = _ins(ds)
    assert narrate(ds, ins, "executive")["recommendation"] is None
