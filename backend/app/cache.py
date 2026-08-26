"""Caching and cost routing.

Redis when REDIS_URL is set, otherwise a process-local dict so the service runs
standalone. The routing table records why a request did or did not need an LLM -
the engine never pays for a model call that deterministic logic can answer.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any

_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))
_local: dict[str, tuple[float, str]] = {}
_redis = None

if os.getenv("REDIS_URL"):
    try:
        import redis

        _redis = redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
        _redis.ping()
    except Exception:  # noqa: BLE001 - cache is best effort
        _redis = None


def get(key: str) -> Any | None:
    if _redis:
        try:
            raw = _redis.get(key)
            return json.loads(raw) if raw else None
        except Exception:  # noqa: BLE001
            return None
    hit = _local.get(key)
    if not hit:
        return None
    ts, raw = hit
    if time.time() - ts > _TTL:
        _local.pop(key, None)
        return None
    return json.loads(raw)


def set(key: str, value: Any) -> None:  # noqa: A001 - mirrors cache vocabulary
    raw = json.dumps(value, default=str)
    if _redis:
        try:
            _redis.setex(key, _TTL, raw)
            return
        except Exception:  # noqa: BLE001
            pass
    _local[key] = (time.time(), raw)


def backend() -> str:
    return "redis" if _redis else "in-memory"


# --------------------------------------------------------------------------
# Cost routing
# --------------------------------------------------------------------------
ROUTES = {
    "deterministic": {"tier": "Deterministic only", "model": "none",
                      "why": "Numeric asks, evidence, comparisons - no LLM"},
    "standard": {"tier": "Standard narrative", "model": "mock / small",
                 "why": "Persona explanation - templated or small model"},
    "complex": {"tier": "Complex reasoning", "model": "large",
                "why": "Multi-hypothesis synthesis - larger model"},
}


def route_for(intent: str, live: bool) -> dict:
    """Pick the cheapest tier that can answer this intent."""
    if intent in ("evidence", "comparison", "confidence", "metric_lookup"):
        return {**ROUTES["deterministic"], "llm": False}
    if not live:
        return {**ROUTES["standard"], "llm": False}
    return {**ROUTES["complex" if intent == "driver_analysis" else "standard"], "llm": True}
