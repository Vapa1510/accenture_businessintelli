"""API contracts.

The narrative models exist to enforce structure on anything the LLM produces:
a recommendation must name a driver, a lever, an owner and a monitoring plan,
and the causal field may only ever be 'associational' or 'insufficient-evidence'.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    label: str


class Recommendation(BaseModel):
    driver: str
    lever: str
    action: str
    impact: str
    owner: str
    approval_type: str
    monitoring: str
    can_approve: bool = False


class ValidationCheck(BaseModel):
    label: str
    pass_: bool = Field(alias="pass")
    detail: str

    model_config = {"populate_by_name": True}


class Narrative(BaseModel):
    abstain: bool
    provider: str
    headline: str
    paragraphs: list[str]
    recommendation: Recommendation | None = None
    causal: Literal["associational", "insufficient-evidence"]


class InsightResponse(BaseModel):
    scenario: str
    kpi: str
    period: str
    movements: list[dict[str, Any]]
    restricted_kpis: list[dict[str, str]] = []
    customer_data_allowed: bool = True
    target: dict[str, Any]
    lmdi: dict[str, float]
    driver_res: dict[str, Any]
    rules: dict[str, Any]
    confidence: dict[str, Any]
    hypotheses: list[dict[str, Any]]
    region_contrib: list[dict[str, Any]]
    cat_contrib: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    abstain: bool
    abstain_kind: str | None
    reasons: list[str]
    clarifications: list[str]
    sources: dict[str, Any]
    narrative: Narrative
    validation: dict[str, Any]
    role: dict[str, Any]
    telemetry: dict[str, Any]


class FeedbackIn(BaseModel):
    scenario: str
    kpi: str = "revenue"
    helpful: bool | None = None
    category: str | None = None
    actual_driver: str | None = None
    comment: str | None = None


class ChatIn(BaseModel):
    question: str
    scenario: str = "revenue_decline"
    live: bool = False


class ChatOut(BaseModel):
    answer: str
    intent: str
    filters: dict[str, str]
    route: dict[str, Any]
    latency_ms: float


class SimulateIn(BaseModel):
    marketing_multiplier: float = 1.0
    stockout_rate: float | None = None
    competitor_price_index: float | None = None


class IngestIn(BaseModel):
    scenario: str = "custom_ingested"
    transactions: list[dict[str, Any]] = []
    marketing: list[dict[str, Any]] = []
    external: list[dict[str, Any]] = []

