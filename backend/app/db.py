"""Database layer.

PostgreSQL in Docker; falls back to a local SQLite file if DATABASE_URL is not
set, so the backend runs with no infrastructure at all.
"""
from __future__ import annotations

import os

from sqlalchemy import (Boolean, Column, Date, Float, Integer, String, Text,
                        create_engine, func)
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kpi_engine.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    scenario = Column(String(40), index=True)
    date = Column(Date, index=True)
    region = Column(String(20), index=True)
    category = Column(String(30), index=True)
    product_id = Column(String(10), index=True)
    product = Column(String(60))
    orders = Column(Float)
    units = Column(Float)
    avg_selling_price = Column(Float)
    discount = Column(Float)
    revenue = Column(Float)
    cost = Column(Float)
    gross_margin = Column(Float)


class Marketing(Base):
    __tablename__ = "marketing"
    id = Column(Integer, primary_key=True)
    scenario = Column(String(40), index=True)
    date = Column(Date, index=True)
    campaign_id = Column(String(20))
    channel = Column(String(30))
    region = Column(String(20), index=True)
    impressions = Column(Integer)
    clicks = Column(Integer)
    ad_spend = Column(Float)
    conversions = Column(Integer)


class External(Base):
    __tablename__ = "external"
    id = Column(Integer, primary_key=True)
    scenario = Column(String(40), index=True)
    date = Column(Date, index=True)
    region = Column(String(20), index=True)
    competitor_price_index = Column(Float)
    holiday_flag = Column(Integer)
    weather_index = Column(Float)
    supply_availability = Column(Float)
    stockout_rate = Column(Float)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(128))
    role = Column(String(30))


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    created_at = Column(Date, server_default=func.current_date())
    scenario = Column(String(40), index=True)
    kpi = Column(String(30))
    role = Column(String(30))
    helpful = Column(Boolean)
    category = Column(String(40))
    actual_driver = Column(String(120))
    comment = Column(Text)


class InsightLog(Base):
    """Telemetry: one row per generated insight."""
    __tablename__ = "insight_log"
    id = Column(Integer, primary_key=True)
    scenario = Column(String(40), index=True)
    kpi = Column(String(30))
    role = Column(String(30))
    latency_ms = Column(Float)
    cache_hit = Column(Boolean)
    llm_used = Column(Boolean)
    provider = Column(String(60))
    abstained = Column(Boolean)
    confidence = Column(Float)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
