"""KPI semantic layer.

A single contract per KPI: definition, formula, grain, dimensions, drivers,
ownership, refresh cadence and access level. Every downstream computation
resolves through here, so a metric means one thing across the whole system.
"""
from __future__ import annotations

from .generator import DAYS, WIN

KPI_META: dict[str, dict] = {
    "revenue": {
        "name": "Revenue", "unit": "$", "strategic": 1.0, "materiality_threshold": 0.05,
        "definition": "Total realized sales revenue", "formula": "SUM(revenue)",
        "grain": "order_product_day", "dimensions": ["region", "category", "product"],
        "drivers": ["orders", "aov", "price", "discount", "product_mix"],
        "refresh": "hourly", "owner": "Commercial Analytics", "access": "manager",
        "source": "transactions",
    },
    "orders": {
        "name": "Orders", "unit": "#", "strategic": 0.7, "materiality_threshold": 0.05,
        "definition": "Count of completed orders", "formula": "SUM(orders)",
        "grain": "order_product_day", "dimensions": ["region", "category", "product"],
        "drivers": ["sessions", "conversion_rate"],
        "refresh": "hourly", "owner": "Commercial Analytics", "access": "manager",
        "source": "transactions",
    },
    "aov": {
        "name": "Average Order Value", "unit": "$", "strategic": 0.6, "materiality_threshold": 0.05,
        "definition": "Revenue per order", "formula": "SUM(revenue)/SUM(orders)",
        "grain": "order_product_day", "dimensions": ["region", "category", "product"],
        "drivers": ["price", "discount", "product_mix"],
        "refresh": "hourly", "owner": "Commercial Analytics", "access": "manager",
        "source": "transactions",
    },
    "conv_rate": {
        "name": "Conversion Rate", "unit": "%", "strategic": 0.8, "materiality_threshold": 0.05,
        "definition": "Conversions per click", "formula": "SUM(conversions)/SUM(clicks)",
        "grain": "date_region", "dimensions": ["region", "channel", "campaign"],
        "drivers": ["ad_creative", "landing_quality", "audience"],
        "refresh": "daily", "owner": "Marketing", "access": "manager", "source": "marketing",
    },
    "margin_pct": {
        "name": "Gross Margin", "unit": "%", "strategic": 0.85, "materiality_threshold": 0.05,
        "definition": "Gross margin as % of revenue", "formula": "SUM(gross_margin)/SUM(revenue)",
        "grain": "order_product_day", "dimensions": ["region", "category", "product"],
        "drivers": ["price", "discount", "cost", "product_mix"],
        "refresh": "hourly", "owner": "Commercial Analytics", "access": "manager",
        "source": "transactions",
    },
}


def window_idx() -> dict[str, int]:
    """Current period, prior period, and the longer baseline window."""
    return {
        "cur_start": DAYS - WIN, "cur_end": DAYS - 1,
        "prev_start": DAYS - 2 * WIN, "prev_end": DAYS - WIN - 1,
        "base_start": DAYS - WIN - 84, "base_end": DAYS - WIN - 1,
    }
