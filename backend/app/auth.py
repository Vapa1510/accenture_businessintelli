"""Auth + RBAC.

Each role controls: visible KPIs, customer data access, and approval rights.
Keeping this server-side so the frontend can't just unhide restricted fields.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import hashlib
import secrets
from sqlalchemy.orm import Session
from .db import User

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
TOKEN_TTL_MIN = int(os.getenv("JWT_TTL_MIN", "480"))

ROLES: dict[str, dict] = {
    "executive": {
        "label": "Executive", "persona": "executive", "depth": "aggregated",
        "customer_data": True, "approve": ["budget", "strategic", "campaign", "inventory"],
        "kpis": "all",
        "note": "Approves budget & strategic initiatives; sees aggregated views.",
    },
    "marketing": {
        "label": "Marketing Manager", "persona": "marketing", "depth": "standard",
        "customer_data": False, "approve": ["campaign", "budget"],
        "kpis": ["revenue", "orders", "conv_rate", "aov"],
        "note": "Marketing, campaign, channel, conversion. No customer-level data.",
    },
    "operations": {
        "label": "Operations Manager", "persona": "operations", "depth": "standard",
        "customer_data": False, "approve": ["inventory", "supplier"],
        "kpis": ["revenue", "orders", "margin_pct"],
        "note": "Inventory, stockouts, fulfillment, supply.",
    },
    "analyst": {
        "label": "Analyst", "persona": "executive", "depth": "deep",
        "customer_data": False, "approve": [], "kpis": "all",
        "note": "Deepest analytical evidence (full model). Cannot approve actions.",
    },
}

# Hashing utility functions using standard library hashlib
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 100000
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        stored_hash = parts[3]
        dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return secrets.compare_digest(dk.hex(), stored_hash)
    except Exception:
        return False


# Demo accounts metadata for token generation fallback
DEMO_USERS = {name: {"username": name, "role": name} for name in ROLES}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def create_token(username: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MIN)
    return jwt.encode({"sub": username, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def authenticate(username: str, password: str, db: Session) -> dict | None:
    db_user = db.query(User).filter(User.username == username).first()
    if db_user and verify_password(password, db_user.hashed_password):
        return {"username": db_user.username, "role": db_user.role}
    return None


def current_role(token: str | None = Depends(oauth2_scheme)) -> dict:
    """Resolve the caller's role. Defaults to executive when auth is disabled."""
    if not token:
        if os.getenv("REQUIRE_AUTH", "true").lower() != "false":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Authentication required")
        return {"key": "executive", **ROLES["executive"]}
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        key = payload.get("role", "executive")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if key not in ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unknown role")
    return {"key": key, **ROLES[key]}


def kpi_visible(role: dict, kpi_key: str) -> bool:
    return role["kpis"] == "all" or kpi_key in role["kpis"]


def can_approve(role: dict, approval_type: str) -> bool:
    return approval_type in role["approve"]


def redact_for_role(ins: dict, role: dict) -> dict:
    """Strip KPIs the role may not see. Applied server-side, not in the UI."""
    visible, restricted = [], []
    for m in ins["movements"]:
        (visible if kpi_visible(role, m["key"]) else restricted).append(m)
    out = dict(ins)
    out["movements"] = visible
    out["restricted_kpis"] = [{"key": m["key"], "name": m["name"]} for m in restricted]
    out["customer_data_allowed"] = role["customer_data"]
    return out
