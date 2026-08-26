# Design Decisions

This doc explains *why* we picked each technique. The problem statement asks
teams to be explicit about when they use deterministic logic, statistics,
traditional ML, business rules, or LLMs — and why. So here goes.

---

## Why LMDI over Shapley decomposition

Revenue = Orders × AOV, so we needed a way to split the total change into
"how much came from volume vs how much came from price/mix."

We looked at three options:

| Method | Pros | Cons |
|---|---|---|
| Shapley value decomposition | Theoretically clean, game-theory grounded | O(2^n) on number of factors, has a residual term |
| Simple arithmetic diff | Easy to implement | Doesn't sum exactly, residual grows with large changes |
| LMDI (Log Mean Divisia Index) | **Exact additive** — the effects sum to the total change with zero residual | Requires log-mean, slightly harder to explain |

We went with LMDI because the "no residual" property is critical for a
dashboard: if a user sees the Orders effect and the AOV effect, they should
add up to the total revenue change. With Shapley you get a leftover term
that's hard to explain to a business user.

The implementation is in `app/engine/analytics.py` (`lmdi_revenue`).

---

## Why OLS regression + correlation (not causal inference)

The driver attribution step fits an OLS regression of daily revenue against
four standardised drivers (marketing spend, conversion rate, price, supply
availability). We considered:

- **Causal inference (DoWhy, causal forests)** — Sounds impressive, but you
  need either an instrument, a natural experiment, or strong domain assumptions
  about the DAG. With synthetic e-commerce data, claiming causal estimates
  would be dishonest.
- **Gradient-boosted trees (XGBoost feature importance)** — Better predictive
  accuracy, but SHAP/permutation importances on trees are hard to turn into
  dollar-denominated effect sizes that sum to the total change.
- **OLS with standardised betas** — Gives us beta coefficients we can multiply
  by the observed change in each driver to estimate dollar effects. The R² tells
  users how much of the variation the model explains, and p-values give a rough
  significance check.

We chose OLS because:
1. The effect estimates are in interpretable units (dollars)
2. They sum approximately to the total change (with a residual bucket)
3. It's transparent — a business user can look at the coefficient table
4. We label everything "associational, not causal" in both the UI and the
   narrative validator, so we're not overclaiming

Pearson and Spearman correlations are shown alongside the regression as a
sanity check — if the regression says a driver matters but the raw correlation
is weak, that's a flag.

---

## Why IsolationForest for anomaly detection

We needed to flag unusual days in the data (e.g. a sudden stockout or an
ad-spend cliff). Options:

- **Z-score / percentile thresholds** — Too rigid, doesn't handle
  multivariate patterns (a day can be normal on revenue alone but abnormal
  when you look at revenue + conversion + marketing together)
- **IsolationForest (scikit-learn)** — Unsupervised, handles mixed feature
  types, no labelled anomaly data required, fast to fit
- **Autoencoders** — Overkill for daily panel data with 5 features, and
  harder to explain

IsolationForest with `contamination=0.08` (expect ~8% of days to be
flagged) worked well enough. We set `random_state=42` so the flags are
deterministic across runs.

---

## Why template-first narrative with LLM fallback

This was the most debated decision. Three options:

1. **LLM-only** — Just send the evidence to Claude and let it write.
   Problem: hallucinated numbers. Even with careful prompting, Claude
   occasionally invented figures that weren't in the evidence set. In a
   finance context, a wrong number is worse than a boring sentence.

2. **Template-only** — Python f-strings driven by computed values. No
   hallucination risk, but the prose reads like a form letter.

3. **Template default + validated LLM upgrade** — Templates run by default.
   If `ANTHROPIC_API_KEY` is set and the user passes `?live=true`, we send
   the structured evidence object (not raw data) to Claude. The response is
   scanned for every number it contains, and each number must match an
   evidence value within 3% tolerance. If any number fails, we reject the
   LLM output and fall back to the template. The request never errors.

We chose option 3 because:
- It's safe by default (templates)
- It can produce better prose when an LLM is available
- The validation layer catches hallucinations before they reach the user
- The cost router (`app/cache.py`) ensures that numeric lookups, evidence
  requests, and comparisons never invoke a model at all

---

## Why a weighted composite for confidence (not a single metric)

The confidence score blends five signals:

| Signal | Weight | Rationale |
|---|---|---|
| Data completeness | 25% | Missing rows → missing revenue → wrong baseline |
| Data freshness | 20% | Stale marketing data can't explain recent changes |
| Statistical strength | 20% | Low R² or weak z-score = noisy signal |
| Cross-source agreement | 20% | If marketing says up but external says stockout, something's off |
| Historical coverage | 15% | < 30 days means no reliable seasonal baseline |

The weights were hand-tuned based on which failure modes we cared about most.
In a production system we'd want to learn them from analyst feedback, but
for the prototype, manual calibration was faster and more transparent.

Abstention isn't just "score < 0.60". We have three explicit conditions:
- History < 30 days (can't establish a baseline)
- Cross-source agreement < 0.5 AND stale/incomplete sources
- Composite score < 0.60

Each condition produces a human-readable reason. No recommendation is issued
on abstention — we think it's better to say "I don't know" than to guess.

---

## Why Redis + in-memory fallback for caching

Docker users get Redis. Everyone else gets an in-memory dict with TTL.
We wanted the demo to work with zero infrastructure (`pip install` + `npm
install`), so requiring Redis felt like a barrier. The fallback is good
enough for a single-process demo.

The cost router classifies each incoming query into one of three tiers:
- **Numeric** — pure computation, no LLM → cheapest
- **Evidence / comparison** — structured retrieval → no LLM needed
- **Narrative** — the only tier that *may* invoke an LLM

This separation lets us report LLM-avoidance percentage in the health
dashboard, which the problem statement specifically asks about.

---

## What we'd do differently with more time

- **Proper causal inference**: With richer data and domain assumptions, we
  could use instrumental variables or difference-in-differences instead of
  OLS. The code is structured so swapping the attribution function is easy.
- **Learned confidence weights**: Let analyst feedback tune the 25/20/20/20/15
  split instead of hand-tuning.
- **Streaming chat**: The current chat endpoint does a full round-trip. A
  streaming response would feel more natural.
- **Real data connectors**: Right now data comes from a seeded generator.
  Replacing `generate()` with a loader that returns the same three DataFrames
  is straightforward — everything downstream stays the same.
