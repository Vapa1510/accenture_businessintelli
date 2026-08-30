import os, subprocess, shutil

html = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NovaMart Intelligence — README</title>
<style>
  @page {
    size: A4;
    margin: 22mm 20mm 24mm 20mm;
  }

  * { box-sizing: border-box; }

  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 10.5pt;
    line-height: 1.72;
    color: #222;
    background: #fff;
    margin: 0;
    padding: 0;
  }

  h1 {
    font-family: Georgia, serif;
    font-size: 26pt;
    font-weight: bold;
    color: #111;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 12pt;
    color: #555;
    font-style: italic;
    margin: 0 0 18px 0;
    line-height: 1.5;
  }

  .meta-line {
    font-family: "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    color: #666;
    margin-bottom: 4px;
  }

  .meta-line a {
    color: #2563EB;
    text-decoration: none;
  }

  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 20px 0;
  }

  h2 {
    font-family: Georgia, serif;
    font-size: 15pt;
    font-weight: bold;
    color: #111;
    margin-top: 26px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }

  h3 {
    font-family: Georgia, serif;
    font-size: 12pt;
    font-weight: bold;
    color: #333;
    margin-top: 18px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p { margin: 0 0 10px 0; }

  ul, ol {
    margin: 6px 0 12px 0;
    padding-left: 22px;
  }

  li { margin-bottom: 5px; }

  /* Code */
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 9pt;
    background: #f4f4f4;
    padding: 1px 5px;
    border-radius: 3px;
    color: #333;
  }

  pre {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.8pt;
    background: #f7f7f7;
    border: 1px solid #ddd;
    padding: 12px 14px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 10px 0 14px 0;
    line-height: 1.5;
    page-break-inside: avoid;
  }

  pre code {
    background: none;
    padding: 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 9.2pt;
    page-break-inside: avoid;
  }

  th {
    background: #f0f0f0;
    font-weight: bold;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #ccc;
    font-family: "Segoe UI", Helvetica, sans-serif;
    font-size: 8.5pt;
  }

  td {
    padding: 6px 10px;
    border: 1px solid #ddd;
    vertical-align: top;
  }

  /* Blockquotes for thinking asides */
  blockquote {
    border-left: 3px solid #999;
    margin: 12px 0;
    padding: 8px 14px;
    background: #fafafa;
    font-style: italic;
    color: #444;
    font-size: 9.5pt;
  }

  .page-break { page-break-before: always; }

  .footer-note {
    font-size: 7.5pt;
    color: #999;
    text-align: center;
    margin-top: 30px;
    border-top: 1px solid #ddd;
    padding-top: 8px;
    font-family: "Segoe UI", Helvetica, sans-serif;
  }
</style>
</head>
<body>

<!-- ============ COVER ============ -->
<h1>KPI Intelligence-to-Action Engine</h1>
<p class="subtitle">
  An analytics engine for NovaMart (synthetic e-commerce) that detects material KPI movements,
  tries to explain them from evidence, and recommends an action &mdash; or says
  &ldquo;I don&rsquo;t know&rdquo; when the evidence doesn&rsquo;t add up.
</p>

<p class="meta-line"><strong>Live demo:</strong> <a href="https://kpi-engine.vercel.app">https://kpi-engine.vercel.app</a></p>
<p class="meta-line"><strong>GitHub:</strong> <a href="https://github.com/Vapa1510/accenture_businessintelli">github.com/Vapa1510/accenture_businessintelli</a></p>
<p class="meta-line"><strong>Track:</strong> Accenture Hackathon &mdash; Round 2, Problem Track 3</p>

<hr>

<h2>What This Project Is About</h2>

<p>
  Imagine you&rsquo;re a business executive at NovaMart, and revenue just dropped 15% this week.
  You want to know <em>why</em>. Was it because fewer people bought things? Was each order smaller?
  Did a marketing campaign stop working? Is a supplier having problems?
</p>

<p>
  That&rsquo;s exactly what this engine does. It takes data from three sources &mdash; transaction records,
  marketing campaigns, and external factors like competitor pricing &mdash; and tries to figure out
  what moved and why. Then it either tells you with a recommendation, or it honestly says
  &ldquo;the data isn&rsquo;t good enough to be sure&rdquo; and asks clarifying questions instead.
</p>

<h3>The one rule we never break</h3>

<blockquote>
  Don&rsquo;t let the LLM be the source of numbers.
</blockquote>

<p>
  Every single financial figure &mdash; every percentage, every dollar amount, every regression
  coefficient &mdash; is computed deterministically in Python. The LLM (when used) only writes
  prose around those numbers, and even that prose gets scanned afterward: if it contains any
  number that doesn&rsquo;t match what the engine computed, the entire LLM response gets thrown
  away and we fall back to a safe template. The request never fails.
</p>

<p>
  We made this choice because in a finance context, a confident wrong number is far more
  dangerous than a boring sentence. Templates may not read as smoothly, but they never lie.
</p>

<hr>

<h2>How to Run It</h2>

<h3>Option A: Docker (batteries included)</h3>

<pre><code>cp .env.example .env
docker compose up --build</code></pre>

<p>
  This gives you PostgreSQL + Redis out of the box. The backend automatically seeds all four
  test scenarios on startup. Open <code>http://localhost:5173</code> for the app and
  <code>http://localhost:8000/docs</code> for the interactive API documentation.
</p>

<h3>Option B: No Docker (zero infrastructure)</h3>

<pre><code># Terminal 1: Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # On macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed              # Seeds the SQLite database
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev</code></pre>

<p>
  Without Docker, the backend falls back to SQLite and an in-memory cache. No Redis, no
  Postgres &mdash; just Python and Node. We wanted the demo to work with nothing more than
  <code>pip install</code> and <code>npm install</code>.
</p>

<h3>Logging in</h3>

<p>
  Each role name doubles as its own password. This is intentional for the demo &mdash; obviously
  you&rsquo;d replace this before going anywhere near real users.
</p>

<table>
  <tr><th>Username</th><th>Role</th><th>What they see</th><th>What they can approve</th></tr>
  <tr><td><code>executive</code></td><td>Executive</td><td>All KPIs, customer-level data, strategic views</td><td>Budget, strategic initiatives, campaigns</td></tr>
  <tr><td><code>marketing</code></td><td>Marketing Manager</td><td>Revenue, orders, conversion rate, AOV</td><td>Campaign budgets, ad creative changes</td></tr>
  <tr><td><code>operations</code></td><td>Operations Manager</td><td>Revenue, orders, gross margin, supply data</td><td>Inventory re-orders, supplier SLAs</td></tr>
  <tr><td><code>analyst</code></td><td>Data Analyst</td><td>All KPIs + full regression telemetry</td><td>Nothing (advisory role)</td></tr>
</table>

<p>
  Important: redaction happens <strong>server-side</strong>. When a Marketing Manager logs in, the
  API literally doesn&rsquo;t return gross margin data. It&rsquo;s not hidden with CSS &mdash;
  it never leaves the server.
</p>

<!-- PAGE BREAK -->
<div class="page-break"></div>

<h2>How the Engine Thinks (Architecture)</h2>

<p>
  Here is the step-by-step flow of what happens when someone clicks &ldquo;Run Analysis&rdquo;
  on the dashboard:
</p>

<pre><code>Transactions &mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;+
Marketing campaigns &mdash;&mdash;&mdash;&mdash;+---> Data reconciliation ---> Semantic layer
External context &mdash;&mdash;&mdash;&mdash;&mdash;+                                   |
                                                          Movement detection
                                                          + Data quality check
                                                                |
                                                                v
                           OLS Regression + LMDI + Business Rules ---> Driver attribution
                                                                |
                                                                v
                                            Evidence assembly ---> Confidence scoring
                                                              /             \
                                                     High (&gt;60%)       Low (&lt;60%)
                                                          |                  |
                                              Persona narrative          ABSTAIN
                                              (templates or LLM)     (say what's missing,
                                                          |           ask questions)
                                                          v
                                               Action recommendation
                                                          |
                                                    User feedback
                                                          |
                                                  Evaluation loop</code></pre>

<p>
  Let&rsquo;s walk through what each layer actually does and <em>why</em> we built it that way.
</p>

<h3>Step 1: The Semantic Layer &mdash; what does each KPI actually mean?</h3>

<p>
  Before we compute anything, we need a shared definition of what &ldquo;Revenue&rdquo; or
  &ldquo;Conversion Rate&rdquo; actually means. The semantic layer (<code>engine/semantic.py</code>)
  is a Python dictionary that defines, for each KPI: its formula, its unit, its grain
  (order-product-day vs date-region), which dimensions you can slice it by, who owns it,
  what its materiality threshold is, and what access level is required.
</p>

<p>
  This matters because everything downstream resolves through these definitions. A metric means
  one thing across the entire system &mdash; the dashboard, the regression, the narrative, and the
  tests all agree on what &ldquo;Gross Margin&rdquo; is.
</p>

<h3>Step 2: Movement Detection &mdash; what changed and is it significant?</h3>

<p>
  The engine compares the current 21-day window against the previous 21-day window. But a raw
  percentage change isn&rsquo;t enough &mdash; a 5% dip might be normal volatility. So we also
  compute a Z-score against a rolling 84-day baseline (twelve 7-day windows). If the current
  value deviates more than 1.5 standard deviations from the historical mean, we flag it as a
  material movement.
</p>

<p>
  We also weight each movement by its dollar impact. A 20% swing in a tiny metric matters less
  than a 3% swing in revenue. This ranking determines what the narrative leads with.
</p>

<h3>Step 3: Factor Decomposition (LMDI) &mdash; volume vs price/mix</h3>

<p>
  Revenue is fundamentally Orders &times; Average Order Value. When revenue drops, you want to
  know: did we sell fewer items, or did each sale bring in less money?
</p>

<p>
  We use <strong>LMDI (Log Mean Divisia Index)</strong> to split the total revenue change into
  an Orders effect and an AOV effect. The critical property is that these two effects
  <em>exactly</em> sum to the total change &mdash; no residual term, no rounding error.
</p>

<blockquote>
  We considered Shapley value decomposition, which is theoretically cleaner for more than two
  factors. But LMDI&rsquo;s exact additivity won us over. When a user sees the Orders effect and
  the AOV effect on a waterfall chart, they should add up to the total. With Shapley, there&rsquo;s
  always a leftover term that&rsquo;s hard to explain to a non-technical stakeholder.
</blockquote>

<h3>Step 4: Driver Attribution (OLS Regression) &mdash; what&rsquo;s driving the change?</h3>

<p>
  We fit a multivariate OLS regression on the daily time-series data: revenue regressed against
  marketing spend, conversion rate, average selling price, and supply availability. This gives us
  beta coefficients (how many dollars of revenue are associated with a one-unit change in each
  driver), t-statistics, p-values, and R&sup2;.
</p>

<blockquote>
  We were tempted by causal inference methods (DoWhy, instrumental variables), but you need
  either a natural experiment or strong domain assumptions about the causal graph. With synthetic
  data, claiming causal estimates would be dishonest. So we stuck with OLS and labelled
  everything &ldquo;associational, not causal&rdquo; &mdash; in the UI, in the narrative, and in
  the validator that checks LLM output.
</blockquote>

<p>
  We also run Pearson and Spearman correlations alongside the regression as a sanity check. If
  the regression says a driver matters but the raw correlation is weak, that&rsquo;s a flag worth
  surfacing.
</p>

<h3>Step 5: Confidence Scoring &mdash; should we trust this result?</h3>

<p>
  This is probably the most important design decision in the whole system. Before we tell a user
  anything, we score our own confidence using five weighted signals:
</p>

<table>
  <tr><th>Signal</th><th>Weight</th><th>Why it matters</th></tr>
  <tr><td>Data completeness</td><td>25%</td><td>Missing rows mean missing revenue, which means wrong baselines</td></tr>
  <tr><td>Data freshness</td><td>20%</td><td>If marketing data is 29 hours old, it can&rsquo;t explain what happened today</td></tr>
  <tr><td>Statistical strength</td><td>20%</td><td>Low R&sup2; or weak Z-scores mean the signal is noisy</td></tr>
  <tr><td>Cross-source agreement</td><td>20%</td><td>If marketing says &ldquo;up&rdquo; but supply says &ldquo;stockout,&rdquo; something is off</td></tr>
  <tr><td>Historical coverage</td><td>15%</td><td>Less than 30 days means no reliable seasonal baseline exists</td></tr>
</table>

<p>
  The weights are hand-tuned. In production you&rsquo;d learn them from analyst feedback, but
  manual calibration was faster and more transparent for a prototype.
</p>

<h3>Step 6: Selective Abstention &mdash; saying &ldquo;I don&rsquo;t know&rdquo;</h3>

<p>
  This is not just &ldquo;if confidence &lt; 60%, hide the answer.&rdquo; Early versions did that,
  and we found that a 65% confidence score could still produce a misleading recommendation
  if the underlying marketing data was 29 hours stale. So we added three explicit triggers:
</p>

<ol>
  <li><strong>History &lt; 30 days</strong> for the affected slice &mdash; you can&rsquo;t build a
      reliable baseline from 18 days of data.</li>
  <li><strong>Cross-source agreement &lt; 0.50</strong> when marketing is stale or external
      coverage is incomplete &mdash; conflicting signals with bad data is worse than no answer.</li>
  <li><strong>Composite confidence &lt; 60%</strong> &mdash; the overall score threshold.</li>
</ol>

<p>
  When any of these fires, the engine produces no recommendation. Instead, it tells the user
  exactly what&rsquo;s wrong (&ldquo;marketing data is 29h stale,&rdquo; &ldquo;only 18 days of
  history&rdquo;) and offers clarifying questions. We think it&rsquo;s genuinely better to say
  &ldquo;I don&rsquo;t know&rdquo; than to guess.
</p>

<!-- PAGE BREAK -->
<div class="page-break"></div>

<h2>The LLM Boundary</h2>

<p>
  By default, the system is fully deterministic. The <code>narrate()</code> function produces
  persona-specific prose using Python templates driven entirely by computed values. No LLM is
  called, no API key is needed.
</p>

<p>
  If you want richer prose, set an LLM API key and pass <code>?live=true</code> to the insight
  endpoint. Even then, the LLM is tightly fenced:
</p>

<ul>
  <li>The model receives only the structured evidence object &mdash; never raw data.</li>
  <li>Its output is scanned for every number it contains.</li>
  <li>Any figure that doesn&rsquo;t trace back to the evidence set within 3% tolerance
      <strong>rejects the entire response</strong>.</li>
  <li>On rejection, we silently fall back to the deterministic template.</li>
  <li>The confidence score, the recommendation, and every dollar figure remain engine-computed.
      The LLM only chooses words.</li>
</ul>

<blockquote>
  Getting the number-checking regex right took several iterations. Small integers like
  &ldquo;7 days&rdquo; kept triggering false positives, so we added an exemption for integers
  below 8. It&rsquo;s not elegant, but it works.
</blockquote>

<p>
  The cost router (<code>engine/cache.py</code>) classifies each incoming query into tiers:
  numeric lookups, evidence/comparison requests, and narrative requests. Only the narrative tier
  may invoke an LLM. This separation lets us report an &ldquo;LLM-avoidance percentage&rdquo;
  in the health dashboard &mdash; typically 90%+ of requests never touch an LLM at all.
</p>

<hr>

<h2>The Four Test Scenarios</h2>

<p>
  We designed four benchmark scenarios, each with a known ground truth. The data is seeded with
  a deterministic PRNG (Mulberry32), so the same scenario always produces identical numbers.
</p>

<table>
  <tr><th>Scenario</th><th>What we injected</th><th>What the engine should do</th></tr>
  <tr>
    <td>Revenue Decline</td>
    <td>Marketing spend pulled back 30%, stockout in North region</td>
    <td>Explain: revenue down ~15.7%, marketing is the top attributed driver</td>
  </tr>
  <tr>
    <td>Margin Compression</td>
    <td>Revenue steady, but supplier cost inflation pushes unit costs up 12%</td>
    <td>Explain: gross margin down ~8.2%, identify cost as the driver</td>
  </tr>
  <tr>
    <td>Contradictory Evidence</td>
    <td>Marketing data 29 hours stale, 18% of external rows missing</td>
    <td><strong>Abstain</strong> &mdash; signals conflict, data is unreliable</td>
  </tr>
  <tr>
    <td>New Product (Paid Search)</td>
    <td>NovaBud Air launched only 18 days ago</td>
    <td><strong>Abstain</strong> &mdash; insufficient historical baseline</td>
  </tr>
</table>

<p>
  The first two scenarios test that the engine correctly identifies the injected driver.
  The last two test that it&rsquo;s honest enough to <em>not</em> give an answer when it
  shouldn&rsquo;t.
</p>

<hr>

<h2>Data Ingestion</h2>

<p>
  The engine supports three ways to get data in:
</p>

<ul>
  <li><strong>Synthetic generator</strong> &mdash; the default. Run <code>python -m app.seed</code>
      or call <code>POST /api/seed</code> to populate all four benchmark scenarios.</li>
  <li><strong>Custom JSON ingestion</strong> &mdash; call <code>POST /api/ingest</code> with a
      JSON payload containing transaction, marketing, and/or external records. The API validates
      schema and inserts into SQLite.</li>
  <li><strong>UI ingestion tool</strong> &mdash; the Data Sources page in the frontend has a
      text area where you can paste JSON and click &ldquo;Ingest.&rdquo; Good for quick demos.</li>
</ul>

<p>
  Swapping in real production data means replacing the <code>generate()</code> function with a
  loader that returns the same three DataFrames &mdash; everything downstream stays unchanged.
</p>

<hr>

<h2>API Reference</h2>

<table>
  <tr><th>Route</th><th>Method</th><th>What it does</th></tr>
  <tr><td><code>/api/auth/token</code></td><td>POST</td><td>Authenticate with username/password, receive a JWT token</td></tr>
  <tr><td><code>/api/scenarios</code></td><td>GET</td><td>List available scenarios and role catalogue</td></tr>
  <tr><td><code>/api/insight</code></td><td>GET</td><td>Full analysis: KPI movements, LMDI decomposition, narrative, confidence, recommendations</td></tr>
  <tr><td><code>/api/drivers</code></td><td>GET</td><td>OLS regression coefficients, correlations, dimensional drill-down by region/category</td></tr>
  <tr><td><code>/api/sources</code></td><td>GET</td><td>Data source freshness, coverage, row counts, schema definitions</td></tr>
  <tr><td><code>/api/semantic</code></td><td>GET</td><td>KPI semantic layer contracts (definitions, formulas, owners, thresholds)</td></tr>
  <tr><td><code>/api/chat</code></td><td>POST</td><td>Natural language question &rarr; intent classification &rarr; structured engine query</td></tr>
  <tr><td><code>/api/ingest</code></td><td>POST</td><td>Ingest custom JSON records for transactions, marketing, or external context</td></tr>
  <tr><td><code>/api/seed</code></td><td>POST</td><td>Populate database with all four benchmark scenarios</td></tr>
  <tr><td><code>/api/feedback</code></td><td>POST / GET</td><td>Submit feedback on insight quality; view aggregated feedback dashboard</td></tr>
  <tr><td><code>/api/health</code></td><td>GET</td><td>System health: latency P95, cache hit rate, LLM-avoidance %, abstention rate</td></tr>
</table>

<p>
  Full interactive documentation is available at <code>/docs</code> when running locally
  (powered by FastAPI&rsquo;s auto-generated OpenAPI spec).
</p>

<!-- PAGE BREAK -->
<div class="page-break"></div>

<h2>Technology Choices and Why</h2>

<p>
  Every technology choice in this project was made for a reason. Here&rsquo;s the full map:
</p>

<table>
  <tr><th>Layer</th><th>Technology</th><th>Why we chose it</th><th>File</th></tr>
  <tr><td>Data generation</td><td>Seeded Mulberry32 PRNG</td><td>Same seed = same data every time, across machines</td><td><code>engine/generator.py</code></td></tr>
  <tr><td>Semantic layer</td><td>Python dictionaries</td><td>Single source of truth; every downstream module resolves through it</td><td><code>engine/semantic.py</code></td></tr>
  <tr><td>Movement detection</td><td>pandas + numpy + Z-score</td><td>Simple, auditable, no black boxes</td><td><code>engine/analytics.py</code></td></tr>
  <tr><td>Factor decomposition</td><td>LMDI (exact additive)</td><td>Effects sum to total with zero residual &mdash; critical for dashboards</td><td><code>engine/analytics.py</code></td></tr>
  <tr><td>Driver attribution</td><td>statsmodels OLS</td><td>Coefficients in interpretable dollars, transparent significance</td><td><code>engine/analytics.py</code></td></tr>
  <tr><td>Anomaly detection</td><td>IsolationForest (scikit-learn)</td><td>Unsupervised, handles mixed features, no labelled data needed</td><td><code>engine/analytics.py</code></td></tr>
  <tr><td>Business rules</td><td>Auditable thresholds</td><td>Kept separate from regression so they&rsquo;re independently reviewable</td><td><code>engine/analytics.py</code></td></tr>
  <tr><td>Confidence</td><td>Weighted composite (5 signals)</td><td>Multi-factor; not just a single-score cutoff</td><td><code>engine/analytics.py</code></td></tr>
  <tr><td>Narrative</td><td>Templates + optional LLM + validator</td><td>Safe by default; LLM upgrades prose but every number is verified</td><td><code>engine/narrative.py</code></td></tr>
  <tr><td>API</td><td>FastAPI</td><td>Async, auto-generated docs, great for rapid prototyping</td><td><code>main.py</code></td></tr>
  <tr><td>Persistence</td><td>PostgreSQL (Docker) / SQLite (local)</td><td>Real DB for demos; zero-infra fallback for quick setup</td><td><code>db.py</code></td></tr>
  <tr><td>Cache</td><td>Redis (Docker) / in-memory dict</td><td>Sub-5ms cached responses; no Redis dependency for local dev</td><td><code>cache.py</code></td></tr>
  <tr><td>Auth</td><td>JWT + server-side RBAC</td><td>Redaction at the API layer, not UI-level hiding</td><td><code>auth.py</code></td></tr>
  <tr><td>Frontend</td><td>React + TypeScript + Recharts</td><td>Component-based UI, good charting library, fast iteration</td><td><code>frontend/</code></td></tr>
</table>

<hr>

<h2>Tests</h2>

<pre><code>cd backend
pytest -q          # 39 tests: 19 engine, 20 API</code></pre>

<p>
  The engine tests are the ones that matter most. Each scenario has a <strong>known ground
  truth</strong> &mdash; we deliberately injected a specific driver &mdash; and the tests assert
  that the engine <em>recovers</em> it, rather than just checking that the code runs without
  errors:
</p>

<ul>
  <li>Revenue declines 10&ndash;20% and marketing lands in the top two attributed drivers</li>
  <li>LMDI effects sum to the total revenue change to within $1</li>
  <li>The contradictory scenario abstains, citing stale marketing data</li>
  <li>The new-product scenario abstains on sparse history (18 days)</li>
  <li>No NaN or Infinity anywhere, in any scenario</li>
  <li>Every number in every persona narrative traces back to a computed evidence value</li>
</ul>

<hr>

<h2>Challenges and Honest Tradeoffs</h2>

<p>
  We want to be upfront about what went well and what we wrestled with:
</p>

<ul>
  <li><strong>LMDI vs Shapley:</strong> Shapley is theoretically cleaner for more than two factors,
      but with only two (Orders &times; AOV), LMDI&rsquo;s exact additivity was more important
      for the dashboard than Shapley&rsquo;s game-theory elegance.</li>

  <li><strong>Narrative number-checking:</strong> Getting the regex right took multiple iterations.
      Small integers like &ldquo;7 days&rdquo; kept triggering false positives. We added an
      exemption for integers below 8. Not beautiful, but reliable.</li>

  <li><strong>Abstention design:</strong> Early versions just checked the composite score. We added
      the explicit stale-data and sparse-history conditions after realising that a 65% confidence
      score could still produce a misleading recommendation if the underlying data was a day old.</li>

  <li><strong>Regression is associational, not causal:</strong> We say this in the UI, in the
      narrative, and in the validator. With synthetic data and no natural experiment, claiming
      causality would be dishonest. The code is structured so swapping in a causal method
      (DoWhy, IV regression) is straightforward if better data becomes available.</li>
</ul>

<hr>

<h2>What We&rsquo;d Do With More Time</h2>

<ul>
  <li><strong>Learned confidence weights</strong> &mdash; let analyst feedback tune the 25/20/20/20/15
      weighting instead of hand-tuning.</li>
  <li><strong>Proper causal inference</strong> &mdash; with richer data and domain assumptions, use
      instrumental variables or difference-in-differences instead of OLS.</li>
  <li><strong>Streaming chat</strong> &mdash; the current chat endpoint does a full round-trip.
      Server-sent events would feel more natural.</li>
  <li><strong>Real data connectors</strong> &mdash; replace the synthetic generator with connectors
      to actual data warehouses. The interface is clean: return three DataFrames.</li>
</ul>

<p class="footer-note">
  NovaMart Intelligence &mdash; KPI Intelligence-to-Action Engine &mdash; Accenture Hackathon 2026
</p>

</body>
</html>
"""

with open("pdf_readme.html", "w", encoding="utf-8") as f:
    f.write(html)

print("pdf_readme.html created successfully.")
