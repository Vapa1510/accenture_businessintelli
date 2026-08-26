"""Load generated scenario data into the database.

Usage:  python -m app.seed            (all scenarios)
        python -m app.seed decline    (one scenario, prefix match)
"""
from __future__ import annotations

import sys
from datetime import date

from .db import External, Marketing, SessionLocal, Transaction, User, init_db
from .auth import hash_password, ROLES
from .engine.generator import SCENARIOS, generate


def _d(s: str) -> date:
    return date.fromisoformat(s)


def seed(scenario_keys: list[str] | None = None) -> None:
    init_db()
    keys = scenario_keys or list(SCENARIOS)
    db = SessionLocal()
    try:
        # Seed users
        db.query(User).delete()
        for role_name in ROLES:
            db.add(User(username=role_name, hashed_password=hash_password(role_name), role=role_name))
        db.commit()
        print("  Seeded database users.")

        for key in keys:
            ds = generate(key)
            db.query(Transaction).filter(Transaction.scenario == key).delete()
            db.query(Marketing).filter(Marketing.scenario == key).delete()
            db.query(External).filter(External.scenario == key).delete()

            db.bulk_save_objects([Transaction(scenario=key, **{**r, "date": _d(r["date"])})
                                  for r in ds.transactions])
            db.bulk_save_objects([Marketing(scenario=key, **{**r, "date": _d(r["date"])})
                                  for r in ds.marketing])
            db.bulk_save_objects([External(scenario=key, **{**r, "date": _d(r["date"])})
                                  for r in ds.external])
            db.commit()
            print(f"  {key:18} tx={len(ds.transactions):6}  mk={len(ds.marketing):5}  ex={len(ds.external):5}")
    finally:
        db.close()


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    sel = [k for k in SCENARIOS if arg in k] if arg else None
    print("Seeding scenarios...")
    seed(sel)
    print("Done.")
