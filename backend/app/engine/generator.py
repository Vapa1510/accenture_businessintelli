"""Seeded synthetic data generator for NovaMart.

This is an exact port of the verified JavaScript generator: mulberry32 PRNG,
same seed, same iteration order. Given a scenario it produces three
heterogeneous sources at different grains, plus source freshness metadata.

Nothing here is random at runtime - the same scenario always yields the same
dataset, which is what makes every downstream number auditable.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Callable

MASK = 0xFFFFFFFF


def _imul(x: int, y: int) -> int:
    return (x * y) & MASK


def make_rng(seed: int) -> Callable[[], float]:
    """mulberry32 - identical output to the JS implementation."""
    state = seed & MASK

    def rnd() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & MASK
        t = _imul(state ^ (state >> 15), 1 | state)
        t = ((t + _imul(t ^ (t >> 7), 61 | t)) & MASK) ^ t
        return ((t ^ (t >> 14)) & MASK) / 4294967296.0

    return rnd


def gauss(rnd: Callable[[], float], mean: float = 0.0, sd: float = 1.0) -> float:
    u1 = max(rnd(), 1e-9)
    u2 = rnd()
    return mean + sd * math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)


REGIONS = ["North", "South", "East", "West"]
CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty"]
CHANNELS = ["Paid Search", "Social", "Email", "Display", "Affiliate"]

PRODUCTS: dict[str, list[dict]] = {
    "Electronics": [
        {"id": "EL-1", "name": "AuroraBook 14", "price": 1180, "margin": 0.22, "premium": 1.0},
        {"id": "EL-2", "name": "PulsePhone X", "price": 720, "margin": 0.30, "premium": 0.9},
        {"id": "EL-3", "name": "NovaBud Air", "price": 190, "margin": 0.34, "premium": 0.6, "new_launch": True},
    ],
    "Fashion": [
        {"id": "FA-1", "name": "Meridian Coat", "price": 240, "margin": 0.55, "premium": 0.9},
        {"id": "FA-2", "name": "Drift Sneaker", "price": 130, "margin": 0.48, "premium": 0.7},
        {"id": "FA-3", "name": "Everyday Tee", "price": 35, "margin": 0.62, "premium": 0.4},
    ],
    "Home": [
        {"id": "HO-1", "name": "Loft Blender", "price": 160, "margin": 0.40, "premium": 0.7},
        {"id": "HO-2", "name": "Calm Diffuser", "price": 60, "margin": 0.52, "premium": 0.5},
        {"id": "HO-3", "name": "Linen Set", "price": 95, "margin": 0.45, "premium": 0.6},
    ],
    "Beauty": [
        {"id": "BE-1", "name": "Lumen Serum", "price": 78, "margin": 0.68, "premium": 0.8},
        {"id": "BE-2", "name": "Velvet Balm", "price": 26, "margin": 0.60, "premium": 0.4},
        {"id": "BE-3", "name": "Dawn Palette", "price": 44, "margin": 0.58, "premium": 0.6},
    ],
}

REGION_W = {"North": 1.15, "South": 0.95, "East": 1.05, "West": 0.85}
CAT_W = {"Electronics": 1.25, "Fashion": 1.05, "Home": 0.85, "Beauty": 0.95}
CHANNEL_W = {"Paid Search": 1.3, "Social": 1.0, "Email": 0.5, "Display": 0.8, "Affiliate": 0.6}

DAYS = 365
WIN = 21
SEED = 20260821
ORGANIC_BASE = 15000
TODAY = date(2026, 8, 21)


def date_of(i: int) -> date:
    return TODAY - timedelta(days=(DAYS - 1 - i))


def iso(d: date) -> str:
    return d.isoformat()


def _seasonal(d: date) -> float:
    doy = (d - date(d.year, 1, 1)).days + 1
    annual = 1 + 0.16 * math.sin((2 * math.pi * (doy - 300)) / 365)
    dow = (d.weekday() + 1) % 7  # JS getUTCDay(): Sunday = 0
    weekly = 1.12 if dow in (0, 6) else 1.05 if dow == 5 else 0.97
    return annual * weekly


def _trend(i: int) -> float:
    return 1 + 0.12 * (i / DAYS)


@dataclass
class Scenario:
    key: str
    label: str
    mult: dict
    intent: str
    stale: bool = False
    drop_external_frac: float = 0.0
    focus_product: str | None = None


SCENARIOS: dict[str, Scenario] = {
    "revenue_decline": Scenario(
        key="revenue_decline", label="Revenue Decline",
        mult={"spend": 0.83, "conv": 0.99, "orders": 1.0, "price": 0.975, "mix": 1.0},
        intent="Revenue down ~14% - marketing pullback drives orders & conversion down",
    ),
    "revenue_growth": Scenario(
        key="revenue_growth", label="Revenue Growth",
        mult={"spend": 1.11, "conv": 1.03, "orders": 1.0, "price": 1.0, "mix": 1.10},
        intent="Revenue up ~18% - campaign lift, higher conversion, premium-mix shift",
    ),
    "contradictory": Scenario(
        key="contradictory", label="Contradictory Evidence",
        mult={"spend": 0.99, "conv": 0.95, "orders": 0.90, "price": 0.99, "mix": 1.0},
        intent="Demand appears down, but marketing is stale & inventory partly missing",
        stale=True, drop_external_frac=0.18,
    ),
    "new_product": Scenario(
        key="new_product", label="New Product / Sparse History",
        mult={"spend": 1.0, "conv": 1.0, "orders": 1.0, "price": 1.0, "mix": 1.0},
        intent="Recently launched SKU (NovaBud Air) - no reliable baseline",
        focus_product="EL-3",
    ),
}


@dataclass
class Dataset:
    scenario_key: str
    scenario: Scenario
    transactions: list[dict] = field(default_factory=list)
    marketing: list[dict] = field(default_factory=list)
    external: list[dict] = field(default_factory=list)
    sources: dict = field(default_factory=dict)


def generate_day(
    scenario_key: str,
    i: int,
    marketing_mult: float = 1.0,
    stockout_override: float | None = None,
    competitor_price_override: float | None = None,
) -> tuple[list[dict], list[dict], list[dict]]:
    sc = SCENARIOS[scenario_key]
    rnd = make_rng(SEED + i * 17)
    launch_index = DAYS - 18
    in_curr = i >= DAYS - WIN

    def m(key: str) -> float:
        return sc.mult[key] if in_curr else 1.0

    d = date_of(i)
    s = _seasonal(d)
    t = _trend(i)
    holiday = 1 if rnd() < 0.03 else 0

    tx_out: list[dict] = []
    mk_out: list[dict] = []
    ex_out: list[dict] = []

    for region in REGIONS:
        if competitor_price_override is not None:
            comp_idx = competitor_price_override + gauss(rnd, 0, 0.01)
        else:
            comp_idx = 1.0 + gauss(rnd, 0, 0.02) + (-0.06 if (scenario_key == "contradictory" and in_curr) else 0.0)

        if stockout_override is not None:
            stockout = max(0.0, stockout_override + gauss(rnd, 0, 0.005))
        else:
            stock_base = 0.04 + max(0.0, gauss(rnd, 0, 0.01))
            stockout = stock_base + (0.09 if (scenario_key == "revenue_decline" and in_curr and region == "North") else 0.0)

        supply = min(1.0, 0.97 - max(0.0, stockout - 0.04) * 2 + gauss(rnd, 0, 0.01))
        dropped = sc.drop_external_frac > 0 and in_curr and rnd() < sc.drop_external_frac
        if not dropped:
            ex_out.append({
                "date": iso(d), "region": region,
                "competitor_price_index": round(comp_idx, 4),
                "holiday_flag": holiday,
                "weather_index": round(0.5 + gauss(rnd, 0, 0.15), 3),
                "supply_availability": round(supply, 3),
                "stockout_rate": round(max(0.0, stockout), 3),
            })

        paid_clicks = 0.0
        for ch in CHANNELS:
            base_spend = 2600 * REGION_W[region] * CHANNEL_W[ch] * s * t * (0.9 + rnd() * 0.2)
            spend = base_spend * m("spend") * marketing_mult
            stale_omit = sc.stale and i >= DAYS - 2
            ctr = 0.03 + gauss(rnd, 0, 0.004)
            impressions = round(spend / (0.9 + rnd() * 0.4) * 30)
            clicks = round(impressions * max(0.005, ctr))
            cvr_base = 0.05 * m("conv")
            conversions = round(clicks * max(0.005, cvr_base + gauss(rnd, 0, 0.003)))
            paid_clicks += clicks
            if not stale_omit:
                mk_out.append({
                    "date": iso(d),
                    "campaign_id": f"{ch[:2].upper()}-{region[0]}",
                    "channel": ch, "region": region,
                    "impressions": impressions, "clicks": clicks,
                    "ad_spend": round(spend, 2), "conversions": conversions,
                })

        organic = ORGANIC_BASE * REGION_W[region] * s * t * (0.9 + rnd() * 0.2)
        sessions = max(50.0, organic + paid_clicks)

        conv_rate = 0.032 * m("conv") * supply * (0.95 + rnd() * 0.1)
        total_orders = sessions * conv_rate * m("orders")

        for cat in CATEGORIES:
            cat_share = CAT_W[cat] / sum(CAT_W.values())
            cat_orders = total_orders * cat_share * (0.9 + rnd() * 0.2)
            prods = PRODUCTS[cat]
            mix_tilt = m("mix")
            weights = [pow(p["premium"], 2.2 if mix_tilt > 1 else 1.0) * (0.9 + rnd() * 0.2) for p in prods]
            wsum = sum(weights)
            for pi, p in enumerate(prods):
                if p.get("new_launch") and scenario_key == "new_product" and i < launch_index:
                    continue
                orders = max(0.0, (cat_orders * weights[pi]) / wsum)
                if orders < 0.01:
                    continue
                price_mult = m("price")
                discount = min(0.5, max(0.0, 0.08 + gauss(rnd, 0, 0.03) +
                                        (0.02 if (scenario_key == "revenue_decline" and in_curr) else 0.0)))
                unit_price = p["price"] * price_mult * (1 - discount)
                units = orders * (1 + rnd() * 0.3)
                revenue = units * unit_price
                cost = revenue * (1 - p["margin"]) * (0.98 + rnd() * 0.04)
                tx_out.append({
                    "date": iso(d), "region": region, "category": cat,
                    "product_id": p["id"], "product": p["name"],
                    "orders": round(orders, 2), "units": round(units, 2),
                    "avg_selling_price": round(unit_price, 2), "discount": round(discount, 3),
                    "revenue": round(revenue, 2), "cost": round(cost, 2),
                    "gross_margin": round(revenue - cost, 2),
                })

    return tx_out, mk_out, ex_out


def generate(scenario_key: str) -> Dataset:
    sc = SCENARIOS[scenario_key]
    transactions: list[dict] = []
    marketing: list[dict] = []
    external: list[dict] = []

    for i in range(DAYS):
        tx_day, mk_day, ex_day = generate_day(scenario_key, i)
        transactions.extend(tx_day)
        marketing.extend(mk_day)
        external.extend(ex_day)

    sources = {
        "transactions": {"name": "Transaction Database", "grain": "order x product x day",
                         "expected": "Hourly", "last_refresh_h": 0.3, "coverage": 0.998, "missing": 0.002},
        "marketing": {"name": "Marketing Platform", "grain": "date x campaign x region",
                      "expected": "Daily", "last_refresh_h": 29 if sc.stale else 4,
                      "coverage": 0.91 if sc.stale else 0.972, "missing": 0.09 if sc.stale else 0.028},
        "external": {"name": "External / Context", "grain": "date x region", "expected": "Daily",
                     "last_refresh_h": 6,
                     "coverage": 1 - sc.drop_external_frac * (WIN / DAYS) - 0.086,
                     "missing": 0.18 if sc.drop_external_frac > 0 else 0.02},
    }

    return Dataset(scenario_key=scenario_key, scenario=sc, transactions=transactions,
                   marketing=marketing, external=external, sources=sources)
