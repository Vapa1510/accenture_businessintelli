# KPI Intelligence-to-Action Engine

An analytics engine for **NovaMart** (synthetic e-commerce) that detects
material KPI movements, tries to explain them from evidence, and recommends
an action — or says "I don't know" when the evidence doesn't add up.

We built this as a Round 2 prototype for Problem Track 3. The core idea:
**don't let the LLM be the source of numbers**. Every figure is computed
deterministically in Python; the model only writes prose, and even that
prose gets validated against the evidence before it reaches the user.

See [DESIGN.md](DESIGN.md) for the rationale behind each technical choice
(LMDI vs Shapley, OLS vs causal inference, template vs LLM narrative, etc.).

---

## Quick start

### With Docker (Postgres + Redis included)

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:5173
- API docs: http://localhost:8000/docs

The backend seeds all four scenarios into Postgres on startup.

### Without Docker

Falls back to SQLite and an in-memory cache — no infrastructure required.

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000

# frontend (second terminal)
cd frontend
npm install
npm run dev
```

### Log in

Any role name works as both username and password:

| Username | Role | Sees | Can approve |
|---|---|---|---|
| `executive` | Executive | all KPIs, customer-level | budget, strategic, campaign, inventory |
| `marketing` | Marketing Manager | revenue, orders, conversion, AOV | campaign, budget |
| `operations` | Operations Manager | revenue, orders, margin | inventory, supplier |
| `analyst` | Analyst | all KPIs, deepest evidence | nothing |

Role switching in the UI re-authenticates. Redaction happens **server-side** — restricted
KPIs never leave the API, so it's not a UI trick.

---

## Tests

```bash
cd backend
pytest -q          # 39 tests: 19 engine, 20 API
```

The engine tests are the important ones. Each scenario has **known ground truth** — a driver
was deliberately injected — so the tests assert that the engine *recovers* it rather than
just trusting whatever it produces:

- revenue declines 10–20 % and marketing lands in the top two attributed drivers
- LMDI effects sum to the revenue change to within $1
- the contradictory scenario abstains, citing stale marketing data
- the new-product scenario abstains on sparse history (18 days)
- no NaN or infinity anywhere in any scenario
- every figure in every persona narrative traces back to an evidence object

---

## Architecture

```
Transactions ─┐
Marketing   ─ ┼─> Reconciliation -> Semantic layer -> Movement engine + Data quality
External    ─┘                                                  |
                                                                v
                          Statistics / ML / Business rules -> Driver analysis
                                                                |
                                                                v
                                        Evidence layer -> Confidence engine
                                                            /            \
                                                 high confidence      low confidence
                                                        |                   |
                                          Persona narrative (LLM)        ABSTAIN
                                                        |                   |
                                                Action recommendation       |
                                                        └──> Feedback <─────┘
                                                                |
                                                         Evaluation loop
```

### Layer map

| Layer | Technology | Why this choice | Where |
|---|---|---|---|
| Data generation | seeded mulberry32 PRNG | reproducible across runs | `app/engine/generator.py` |
| Semantic layer | KPI contracts (dict) | single source of truth for definitions, thresholds, access | `app/engine/semantic.py` |
| Movement detection | pandas, numpy, z-score | straightforward, auditable | `app/engine/analytics.py` |
| Factor decomposition | LMDI (exact, additive) | effects sum to total change with zero residual — see DESIGN.md | `app/engine/analytics.py` |
| Driver attribution | statsmodels OLS + scipy correlation | interpretable dollar effects, transparent significance | `app/engine/analytics.py` |
| Anomaly detection | scikit-learn IsolationForest | unsupervised, handles mixed features, no labelled data needed | `app/engine/analytics.py` |
| Business rules | auditable thresholds | separate from regression so they're auditable | `app/engine/analytics.py` |
| Confidence + abstention | weighted composite (5 signals) | explicit multi-factor decision, not just a score cutoff | `app/engine/analytics.py`, `insight.py` |
| Evidence + lineage | traceable claim objects | every number traces to a source and method | `app/engine/insight.py` |
| Narrative + validation | templates, optional Claude, post-hoc number check | template-safe by default; LLM output validated against evidence | `app/engine/narrative.py` |
| API | FastAPI | async, auto-docs, good for prototyping | `app/main.py` |
| Persistence | PostgreSQL + SQLAlchemy | real DB for demo; SQLite fallback for zero-infra setup | `app/db.py` |
| Cache + cost routing | Redis (fallback: in-memory) | classify queries into tiers to avoid LLM calls when possible | `app/cache.py` |
| Auth | JWT + RBAC | server-side redaction, not UI-level hiding | `app/auth.py` |
| Frontend | React + TypeScript + Tailwind + Recharts | fast to build, good charting | `frontend/` |

### Confidence scoring

Weighted composite of five signals (weights hand-tuned — see DESIGN.md for rationale):

| Component | Weight |
|---|---|
| Data completeness | 25% |
| Data freshness | 20% |
| Statistical strength | 20% |
| Cross-source agreement | 20% |
| Historical coverage | 15% |

### Abstention

Not just a score threshold — the system has three explicit conditions:

- history < 30 days for the affected slice (can't build a reliable baseline)
- cross-source agreement < 0.5 **and** marketing is stale or external coverage is incomplete
- composite confidence < 0.60

On abstention: no recommendation is produced. The system states what's missing and offers
clarifying questions instead.

---

## Scenarios

| Scenario | What happens | Expected behaviour |
|---|---|---|
| Revenue Decline | marketing pullback, North stockout | explains: revenue −14.4%, marketing top driver |
| Revenue Growth | campaign lift, premium mix shift | explains: revenue +21.4% |
| Contradictory Evidence | marketing 29h stale, 18% of external rows missing | **abstains** — signals conflict |
| New Product | NovaBud Air launched 18 days ago | **abstains** — insufficient baseline |

Data is seeded and reproducible — same scenario always gives identical numbers.

---

## The LLM boundary

Deterministic by default. `narrate()` produces persona-specific prose from templates
driven entirely by computed values.

Set `ANTHROPIC_API_KEY` and pass `?live=true` to route narrative through Claude. Even then:

- the model receives only the structured evidence object, never raw data
- its output is scanned for numbers, and **any figure not traceable to evidence rejects the response**
- rejection falls back to the deterministic narrative — the request never fails
- the recommendation, confidence score, and all figures remain engine-computed

Cost routing (`app/cache.py`) picks the cheapest tier that can answer: numeric lookups,
evidence requests and comparisons never invoke a model at all.

---

## API

| Route | Purpose |
|---|---|
| `POST /api/auth/token` | obtain a JWT for a role |
| `GET /api/scenarios` | scenarios + role catalogue |
| `GET /api/insight` | full insight, narrative, validation, telemetry |
| `GET /api/drivers` | regression, correlations, anomalies, drill-down |
| `GET /api/sources` | freshness, coverage, row counts, schemas |
| `GET /api/semantic` | KPI contracts |
| `POST /api/chat` | natural language → structured query → engine |
| `POST /api/feedback` · `GET /api/feedback` | capture and aggregate feedback |
| `GET /api/health` | latency, P95, cache hit rate, LLM-avoidance, abstention rate |

Interactive docs at `/docs`.

---

## Challenges and tradeoffs

- **LMDI vs Shapley**: Shapley is theoretically cleaner for >2 factors, but LMDI's exact
  additivity was more important for the dashboard. With only two factors (Orders × AOV),
  the choice is straightforward.
- **Narrative validation**: Getting the number-checking regex right took several iterations.
  Small integers (like "7 days") kept triggering false positives, so we added an exemption
  for integers below 8. Not elegant, but it works.
- **Abstention design**: Early versions just checked the confidence score. We added the
  explicit conditions (stale data, sparse history) after realising that a 65% confidence
  score could still produce a misleading recommendation if the underlying data was 29 hours
  old.
- **Auth bypass**: In development mode (`REQUIRE_AUTH=false`), unauthenticated requests get
  executive access. This is intentional for quick iteration but should be flipped for
  anything beyond a demo.

---

## Notes and limits

- Data is synthetic and seeded. Swapping in real data means replacing `generate()` with a
  loader returning the same three DataFrames — everything downstream is unchanged.
- Regression is **associational, not causal**. The UI says so, and the validator rejects
  causal language in generated prose.
- Feedback is stored and aggregated. The rules engine and driver attribution both read
  feedback to downweight consistently-flagged levers. No model is retrained live, and
  the UI doesn't claim otherwise.
- Demo authentication accepts the role name as its own password. Replace `DEMO_USERS` in
  `app/auth.py` before this goes anywhere near real users.
