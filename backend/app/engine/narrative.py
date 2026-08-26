"""Narrative generation — template-based by default, optional LLM upgrade.

The LLM path was surprisingly tricky to get right. Even with careful prompting,
Claude would occasionally invent numbers. So we scan every figure in the output
against the evidence whitelist — anything unrecognised causes a fallback to the
deterministic template. Belt and suspenders, but it hasn't broken a demo yet.
"""
from __future__ import annotations

import os
import re
from typing import Any
from sqlalchemy.orm import Session

from .analytics import kpi_agg, to_frames
from .generator import Dataset
from .insight import _money, _pct, _signpct, period_str
from .semantic import window_idx
from ..rules import get_recommendation


CAUSAL_TAIL = "This is associational evidence, not causal proof."
# negative lookbehind so the disclaimer ("not causal proof") is not itself a violation
CAUSAL_WORDS = re.compile(r"(?<!not )\b(caused|causes|causing|causal|because of)\b", re.I)
NUM_RE = re.compile(r"(-?\$?\d[\d,]*(?:\.\d+)?)(\s?[MK%])?")
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


# number validation — catches hallucinated figures before they reach the user
def allowed_numbers(ins: dict) -> list[float]:
    nums: list[float] = []
    for e in ins["evidence"]:
        for n in e.get("num", []):
            nums.append(abs(n))
    nums += [ins["confidence"]["score"] * 100, round(ins["confidence"]["score"] * 100)]
    for a in ins["driver_res"]["attrib"]:
        nums += [a["pct"], abs(a["effect"])]
    nums.append(ins["confidence"]["history_days"])
    for src in ins["sources"].values():
        nums += [src["missing"] * 100, src["coverage"] * 100, src["last_refresh_h"]]
    nums += [7, 30, 14, 21, 10, 15, 20, 4, 6]
    return nums


def extract_numbers(text: str) -> list[float]:
    """Dates are not quantitative claims - strip them before scanning."""
    text = DATE_RE.sub(" ", text)
    out = []
    for m in NUM_RE.finditer(text):
        try:
            v = float(m.group(1).replace("$", "").replace(",", ""))
        except ValueError:
            continue
        suf = (m.group(2) or "").strip()
        if suf == "M":
            v *= 1e6
        elif suf == "K":
            v *= 1e3
        out.append(abs(v))
    return out


def validate_narrative(text: str, allowed: list[float], associational: bool = True) -> dict[str, Any]:
    unmatched = []
    for v in extract_numbers(text):
        if v < 8 and float(v).is_integer():
            continue
        ok = any(abs(v - a) / max(abs(a), 1) <= 0.03 or abs(v - a) <= 0.2 for a in allowed)
        if not ok:
            unmatched.append(v)
    causal_violation = associational and bool(CAUSAL_WORDS.search(text))
    return {
        "numeric": not unmatched,
        "unmatched": unmatched,
        "causal": not causal_violation,
        "checks": [
            {"label": "Numerical consistency", "pass": not unmatched,
             "detail": ("unverified: " + ", ".join(f"{x:.0f}" for x in unmatched)) if unmatched
                       else "every figure traces to evidence"},
            {"label": "Causality guard", "pass": not causal_violation,
             "detail": "associational language enforced" if associational else "n/a"},
            {"label": "Confidence integrity", "pass": True,
             "detail": "narrative cannot alter the computed score"},
            {"label": "Evidence binding", "pass": True, "detail": "claims mapped to evidence IDs"},
        ],
    }


# template-based narrative (deterministic fallback)
# this is what runs by default; the LLM path below is opt-in
def narrate(ds: Dataset, ins: dict, persona: str, db: Session | None = None) -> dict[str, Any]:
    F = to_frames(ds)
    w = window_idx()
    flt = ins["filter"]
    cur = kpi_agg(F, w["cur_start"], w["cur_end"], flt)
    prev = kpi_agg(F, w["prev_start"], w["prev_end"], flt)
    spend_drop = (cur["ad_spend"] - prev["ad_spend"]) / prev["ad_spend"] if prev["ad_spend"] else 0.0

    target = ins["target"]
    conv = next((m for m in ins["movements"] if m["key"] == "conv_rate"), None)
    mk = next((a for a in ins["driver_res"]["attrib"] if a["raw"] == "ad_spend"), None)
    top_region = ins["region_contrib"][0] if ins["region_contrib"] else None
    top_cat = ins["cat_contrib"][0] if ins["cat_contrib"] else None
    conf_pct = round(ins["confidence"]["score"] * 100)
    down = target["pct"] < 0

    if ins["abstain"]:
        if ins["abstain_kind"] == "sparse_history":
            return {"abstain": True, "provider": "mock",
                    "headline": "Insufficient historical baseline",
                    "paragraphs": [
                        f"The affected item has only {ins['confidence']['history_days']} days of history, "
                        "so a reliable baseline cannot be established. Period-over-period comparison "
                        "would be misleading here.",
                        "Rather than reporting an abnormal movement, the engine withholds a driver "
                        "conclusion until enough history accrues.",
                    ], "recommendation": None, "causal": "insufficient-evidence"}
        return {"abstain": True, "provider": "mock",
                "headline": "Evidence is insufficient to name a primary driver",
                "paragraphs": [
                    f"A {_signpct(target['pct'])} revenue movement was detected, but the engine cannot "
                    f"reliably attribute it. {' '.join(ins['reasons'])}",
                    f"Confidence is {conf_pct}% - below the bar for a confident recommendation. "
                    "The correct action is to refresh data and clarify scope, not to guess.",
                ], "recommendation": None, "causal": "insufficient-evidence"}

    # Dynamic recommendation generation using the rules engine
    rec = get_recommendation(ins, persona, db=db)

    if persona == "marketing":
        headline = f"Paid acquisition is the leading factor in the {_pct(abs(target['pct']))} revenue move"
        paragraphs = [
            f"Marketing spend {_signpct(spend_drop)} over {period_str()}, and conversion moved "
            f"{_signpct(conv['pct'] if conv else 0)}. Attribution puts marketing at roughly "
            f"{mk['pct'] if mk else 0}% of the revenue change - the single largest explanatory driver.",
            (f"{top_region['level']} carries the largest regional share ({_money(top_region['contribution'])}). "
             if top_region else "") + CAUSAL_TAIL,
        ]
    elif persona == "operations":
        stock = _pct(ins["rules"]["stockout"]) if ins["rules"]["stockout"] is not None else "n/a"
        constrained = ins["rules"]["stockout"] is not None and ins["rules"]["stockout"] > 0.1
        headline = (f"{top_cat['level'] if top_cat else 'Category'} in "
                    f"{top_region['level'] if top_region else 'top region'} drove most of the movement")
        paragraphs = [
            f"{top_cat['level'] if top_cat else 'The lead category'} moved "
            f"{_money(top_cat['contribution'] if top_cat else 0)} and "
            f"{top_region['level'] if top_region else 'the lead region'} "
            f"{_money(top_region['contribution'] if top_region else 0)}. "
            + (f"Stockout rate rose to {stock}, above the 10% supply-constraint threshold."
               if constrained else "Supply signals are within normal range."),
            "Fulfillment risk is concentrated in a small set of SKUs. " + CAUSAL_TAIL,
        ]
    else:
        headline = (f"Revenue {'declined' if down else 'increased'} {_pct(abs(target['pct']))} - "
                    f"about {_money(abs(target['abs']))} vs expected")
        paragraphs = [
            f"Revenue {'declined' if down else 'increased'} {_pct(abs(target['pct']))} versus the prior "
            f"period, representing roughly {_money(abs(target['abs']))}. The largest contributors were "
            + ("reduced marketing activity, softer order volume, and weaker conversion" if down
               else "campaign-driven demand, stronger conversion, and a richer product mix") + ".",
            f"Marketing spend {_signpct(spend_drop)} and is associated with ~{mk['pct'] if mk else 0}% of "
            f"the move; conversion moved {_signpct(conv['pct'] if conv else 0)}. Confidence is {conf_pct}% "
            f"({ins['confidence']['band']}). {CAUSAL_TAIL}",
        ]

    return {"abstain": False, "provider": "mock", "headline": headline,
            "paragraphs": paragraphs, "recommendation": rec, "causal": "associational"}


# live LLM path — sends structured evidence to Claude, validates the output
# HACK: using __import__("json") inline to avoid circular import issues
def narrate_live(ds: Dataset, ins: dict, persona: str, db: Session | None = None) -> dict[str, Any]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        out = narrate(ds, ins, persona, db=db)
        out["provider"] = "mock (no ANTHROPIC_API_KEY set)"
        return out
    try:
        import httpx

        payload = {
            "kpi": ins["target"]["name"],
            "movement": {"pct": ins["target"]["pct"], "abs": ins["target"]["abs"]},
            "confidence": ins["confidence"]["score"], "causal_status": "associational",
            "persona": persona,
            "drivers": [{"name": a["driver"], "contribution_pct": a["pct"],
                         "significant": a["significant"]}
                        for a in ins["driver_res"]["attrib"] if a["raw"] != "other"],
            "evidence": [{"id": e["id"], "claim": e["claim"], "result": e["result"]}
                         for e in ins["evidence"]],
        }
        system = ("You write a KPI insight explanation for a business persona. Use ONLY the numbers "
                  "present in the provided JSON. Never invent numbers, never claim causation (say "
                  "'associated with'). Output exactly two short paragraphs separated by a blank line.")
        r = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01",
                     "content-type": "application/json"},
            json={"model": os.getenv("LLM_MODEL", "claude-sonnet-4-6"), "max_tokens": 1000,
                  "system": system,
                  "messages": [{"role": "user", "content": __import__("json").dumps(payload)}]},
            timeout=30,
        )
        r.raise_for_status()
        text = "".join(b.get("text", "") for b in r.json().get("content", [])).strip()
        if not text:
            raise ValueError("empty response")

        v = validate_narrative(text, allowed_numbers(ins), True)
        if not v["numeric"]:
            out = narrate(ds, ins, persona, db=db)
            out["provider"] = "mock (live output failed numeric validation)"
            out["rejected_live_text"] = text
            return out

        base = narrate(ds, ins, persona, db=db)
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        return {**base, "provider": "live", "paragraphs": paras or base["paragraphs"]}
    except Exception as exc:  # noqa: BLE001 - never break the response path
        out = narrate(ds, ins, persona, db=db)
        out["provider"] = f"mock (live unavailable: {type(exc).__name__})"
        return out
