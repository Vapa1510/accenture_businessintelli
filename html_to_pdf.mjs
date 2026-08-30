import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, 'KPI_Engine_README.pdf');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>KPI Intelligence-to-Action Engine — README</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 22mm 18mm;
  }

  * { box-sizing: border-box; }

  body {
    font-family: Georgia, "Times New Roman", "Cambria", serif;
    font-size: 10.2pt;
    line-height: 1.7;
    color: #1a1a1a;
    background: #fff;
    margin: 0;
    padding: 0;
  }

  /* ── Headings ── */
  h1 {
    font-family: Georgia, serif;
    font-size: 24pt;
    font-weight: bold;
    color: #000;
    margin: 0 0 6px 0;
    letter-spacing: -0.3px;
    border-bottom: 2px solid #222;
    padding-bottom: 8px;
  }

  .lead {
    font-size: 10.8pt;
    color: #444;
    margin: 10px 0 6px 0;
    line-height: 1.65;
  }

  .meta {
    font-family: "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 8pt;
    color: #777;
    margin-bottom: 16px;
  }

  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 18px 0;
  }

  h2 {
    font-family: Georgia, serif;
    font-size: 14.5pt;
    font-weight: bold;
    color: #111;
    margin-top: 24px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  h3 {
    font-family: Georgia, serif;
    font-size: 11.5pt;
    font-weight: bold;
    color: #222;
    margin-top: 16px;
    margin-bottom: 5px;
    page-break-after: avoid;
  }

  p { margin: 0 0 9px 0; }

  strong { color: #111; }

  ul, ol {
    margin: 5px 0 10px 0;
    padding-left: 20px;
  }

  li { margin-bottom: 4px; }

  /* ── Code ── */
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.8pt;
    background: #f3f3f3;
    padding: 1px 4px;
    border-radius: 2px;
    color: #333;
  }

  pre {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.2pt;
    background: #f7f7f7;
    border: 1px solid #ddd;
    padding: 10px 12px;
    border-radius: 3px;
    overflow-x: auto;
    margin: 8px 0 12px 0;
    line-height: 1.45;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  pre code {
    background: none;
    padding: 0;
    font-size: 8.2pt;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 8.8pt;
    page-break-inside: avoid;
  }

  th {
    background: #eee;
    font-weight: bold;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #ccc;
    font-family: "Segoe UI", Helvetica, sans-serif;
    font-size: 8pt;
    color: #222;
  }

  td {
    padding: 4px 8px;
    border: 1px solid #ddd;
    vertical-align: top;
  }

  .page-break { page-break-before: always; }

  .footer {
    font-size: 7pt;
    color: #aaa;
    text-align: center;
    margin-top: 28px;
    border-top: 1px solid #ddd;
    padding-top: 6px;
    font-family: "Segoe UI", Helvetica, sans-serif;
  }
</style>
</head>
<body>

<!-- ══════════════════════════ PAGE 1 ══════════════════════════ -->

<h1>KPI Intelligence-to-Action Engine</h1>

<p class="lead">
  A system that watches business KPIs, figures out what actually moved them, and tells you what to do about it.
  Or admits it doesn&rsquo;t know, when the data doesn&rsquo;t support a confident answer.
</p>

<p class="meta">
  Accenture Hackathon &mdash; Round 2, Problem Track 3 &nbsp;|&nbsp;
  Live: https://kpi-engine.vercel.app &nbsp;|&nbsp;
  GitHub: github.com/Vapa1510/accenture_businessintelli
</p>

<p>
  It was built around NovaMart, a synthetic e-commerce business, but the pipeline underneath isn&rsquo;t tied
  to that dataset. Point it at real transactions, marketing spend, and external signals, and the same engine
  keeps working.
</p>

<hr>

<h2>Why this exists</h2>

<p>
  Most &ldquo;AI analytics&rdquo; tools have the same weak spot: they let a language model touch the numbers.
  Ask it why revenue dropped and it will happily give you a confident, well-written, occasionally made-up answer.
  That&rsquo;s fine for a demo and dangerous for a finance meeting.
</p>

<p>
  This project takes the opposite stance. Every number you see &mdash; the percentage change, the driver breakdown,
  the confidence score &mdash; is computed in plain Python using pandas, statsmodels, and scikit-learn. The LLM is
  only ever allowed to turn those numbers into readable prose, and even then, its output gets checked line by line
  against the underlying evidence before it&rsquo;s shown to anyone. If it invents a figure, that response is thrown
  out and a template-based explanation is used instead. The user never sees a hallucinated number, and the request
  never fails.
</p>

<p>
  The other core idea is that &ldquo;I don&rsquo;t know&rdquo; is a valid answer. If the evidence is thin,
  contradictory, or too recent to trust, the engine says so instead of guessing. That&rsquo;s arguably the more
  interesting part of this project.
</p>

<hr>

<h2>What it actually does</h2>

<ul>
  <li>Detects meaningful KPI movements (revenue, orders, AOV, margin, conversion) against a rolling baseline</li>
  <li>Splits a revenue change into &ldquo;how much came from volume vs. how much came from price/mix&rdquo; using
      LMDI decomposition, which sums exactly to the total change with no leftover residual to hand-wave away</li>
  <li>Fits a regression against marketing spend, conversion, price, and supply availability to estimate which
      levers actually moved the needle, in dollar terms</li>
  <li>Flags anomalous days with IsolationForest, using multiple signals at once rather than a single threshold</li>
  <li>Scores its own confidence using five weighted signals (completeness, freshness, statistical strength,
      cross-source agreement, historical coverage) and abstains outright below a threshold, or when specific
      red flags show up (stale marketing data, sub-30-day history, conflicting sources)</li>
  <li>Writes a narrative in plain language, tailored to who&rsquo;s asking. An executive gets a different summary
      than an analyst</li>
  <li>Recommends an action, with an approval workflow gated by role</li>
  <li>Lets you simulate additional days of data with adjustable marketing spend, stockout rate, and competitor
      pricing, to see how the engine reacts</li>
  <li>Logs feedback on its own recommendations and factors that feedback into future driver attribution</li>
</ul>

<hr>

<h2>How it&rsquo;s put together</h2>

<p>
  Data comes in from three sources (transactions, marketing, and external signals like competitor pricing, weather,
  and supply) and gets reconciled against a shared semantic layer, then flows through movement detection and
  data-quality checks in parallel. From there, statistics, a bit of ML, and hand-written business rules all
  contribute to driver analysis. Everything gets bundled into an evidence object with full lineage, and a confidence
  engine decides what happens next: high confidence goes to the narrative generator and an action recommendation,
  low confidence stops the process and returns an abstention with a reason. Either way, the outcome can be rated by
  the person using it, and that feedback loops back into the system.
</p>

<pre><code>Transactions &mdash;+
Marketing   &mdash;+&mdash;> Reconciliation -> Semantic layer -> Movement detection + Data quality
External    &mdash;+                                              |
                                                               v
                        Statistics / ML / Business rules -> Driver analysis
                                                               |
                                                               v
                                     Evidence layer -> Confidence engine
                                                       /              \\
                                            high confidence      low confidence
                                                    |                    |
                                      Persona narrative (LLM)        ABSTAIN
                                                    |                    |
                                            Action recommendation        |
                                                    +&mdash;&mdash;&mdash; Feedback &mdash;&mdash;&mdash;+
                                                               |
                                                        Evaluation loop</code></pre>

<!-- ══════════════════════════ PAGE 2 ══════════════════════════ -->
<div class="page-break"></div>

<h3>Why these particular tools</h3>

<p>
  A few choices worth explaining up front. The full reasoning, including alternatives we considered and rejected,
  is in <code>DESIGN.md</code>.
</p>

<p>
  <strong>LMDI over Shapley for revenue decomposition.</strong> Revenue is Orders &times; AOV, and we wanted the
  volume effect and the price/mix effect to add up exactly to the total change. Shapley is more theoretically
  elegant for many-factor problems, but it leaves a residual that&rsquo;s hard to explain to someone reading a
  dashboard. LMDI doesn&rsquo;t.
</p>

<p>
  <strong>OLS regression, not causal inference.</strong> We fit a regression and report standardized coefficients,
  R&sup2;, and p-values. We do not claim causality. There&rsquo;s no instrument, no natural experiment, and
  pretending otherwise with synthetic e-commerce data would be misleading. The UI and the narrative validator both
  enforce &ldquo;associational, not causal&rdquo; language.
</p>

<p>
  <strong>IsolationForest for anomaly detection</strong>, because a single day can look fine on any one metric but
  abnormal once you consider revenue, conversion, and marketing spend together. Z-score thresholds miss that, and a
  full autoencoder is more than this data needs.
</p>

<p>
  <strong>Templates by default, LLM as an opt-in upgrade.</strong> <code>narrate()</code> produces prose from Python
  templates driven entirely by computed values, so no infrastructure or API key is required. If you set
  <code>ANTHROPIC_API_KEY</code> and request <code>?live=true</code>, the structured evidence (never raw data) gets
  sent to Claude, and the response is scanned for every number it contains. Anything that doesn&rsquo;t match the
  evidence within a small tolerance gets rejected, and the template output is used instead.
</p>

<h3>Stack</h3>

<table>
  <tr><th>Layer</th><th>Tools</th><th>Notes</th></tr>
  <tr><td>API</td><td>FastAPI</td><td>async, auto-generated docs at <code>/docs</code></td></tr>
  <tr><td>Analytics engine</td><td>pandas, numpy, scipy, statsmodels, scikit-learn</td><td>all the actual number-crunching lives here</td></tr>
  <tr><td>Database</td><td>PostgreSQL via SQLAlchemy</td><td>falls back to SQLite automatically if Postgres isn&rsquo;t available</td></tr>
  <tr><td>Cache &amp; cost routing</td><td>Redis, with an in-memory fallback</td><td>also classifies each request so cheap lookups skip the LLM entirely</td></tr>
  <tr><td>Auth</td><td>JWT + role-based access control</td><td>redaction happens server-side, not in the UI</td></tr>
  <tr><td>Frontend</td><td>React, TypeScript, Tailwind, Recharts</td><td></td></tr>
  <tr><td>Narrative (optional)</td><td>Claude API</td><td>off unless you provide a key</td></tr>
</table>

<hr>

<h2>Getting started</h2>

<p>
  You&rsquo;ve got two options: Docker (gives you Postgres and Redis for free) or running it manually against SQLite.
  Both work fine for trying this out.
</p>

<h3>Option 1: Docker</h3>

<pre><code>cp .env.example .env
docker compose up --build</code></pre>

<ul>
  <li>App: <code>http://localhost:5173</code></li>
  <li>API docs: <code>http://localhost:8000/docs</code></li>
</ul>

<p>The backend seeds all four demo scenarios into Postgres automatically on startup.</p>

<h3>Option 2: Run it directly</h3>

<p>No Postgres, no Redis needed. SQLite and an in-memory cache take over automatically.</p>

<pre><code># backend
cd backend
python -m venv .venv
source .venv/bin/activate        # on Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000

# frontend (second terminal)
cd frontend
npm install
npm run dev</code></pre>

<h3>Logging in</h3>

<p>
  There&rsquo;s no real signup flow, this is a demo. Every role name doubles as its own username and password:
</p>

<table>
  <tr><th>Username</th><th>Role</th><th>What they can see</th><th>What they can approve</th></tr>
  <tr><td><code>executive</code></td><td>Executive</td><td>everything, including customer-level detail</td><td>budget, strategic, campaign, inventory</td></tr>
  <tr><td><code>marketing</code></td><td>Marketing Manager</td><td>revenue, orders, conversion, AOV</td><td>campaign, budget</td></tr>
  <tr><td><code>operations</code></td><td>Operations Manager</td><td>revenue, orders, margin</td><td>inventory, supplier</td></tr>
  <tr><td><code>analyst</code></td><td>Analyst</td><td>everything, deepest evidence view</td><td>nothing, read-only by design</td></tr>
</table>

<p>
  Switching roles in the UI re-authenticates you as that role. Worth noting: the redaction isn&rsquo;t a frontend
  trick. Restricted KPIs are stripped out on the server before the response ever leaves the API, so there&rsquo;s
  no way to see them by poking at the network tab.
</p>

<!-- ══════════════════════════ PAGE 3 ══════════════════════════ -->
<div class="page-break"></div>

<h2>The four demo scenarios</h2>

<p>
  Data is generated with a seeded random number generator, so re-running a scenario always produces identical
  numbers. Useful for testing, and for not looking silly during a demo.
</p>

<table>
  <tr><th>Scenario</th><th>What&rsquo;s happening under the hood</th><th>What the engine should do</th></tr>
  <tr>
    <td>Revenue Decline</td>
    <td>Marketing pullback plus a stockout in the North region</td>
    <td>Explain it: revenue down ~14.4%, marketing surfaces as the top driver</td>
  </tr>
  <tr>
    <td>Revenue Growth</td>
    <td>A campaign lift combined with a shift toward premium products</td>
    <td>Explain it: revenue up ~21.4%</td>
  </tr>
  <tr>
    <td>Contradictory Evidence</td>
    <td>Marketing data is 29 hours stale and 18% of external rows are missing</td>
    <td>Abstain &mdash; the signals don&rsquo;t agree with each other</td>
  </tr>
  <tr>
    <td>New Product</td>
    <td>A product launched only 18 days ago</td>
    <td>Abstain &mdash; not enough history to establish a baseline</td>
  </tr>
</table>

<p>
  You can also step through time yourself using the simulator, which lets you add another day of data and dial
  marketing spend, stockout rate, and competitor pricing up or down to see how the engine&rsquo;s read on the
  situation changes.
</p>

<hr>

<h2>API reference</h2>

<p>Full interactive documentation lives at <code>/docs</code> once the backend is running. Quick summary:</p>

<table>
  <tr><th>Route</th><th>What it does</th></tr>
  <tr><td><code>POST /api/auth/token</code></td><td>Get a JWT for a given role</td></tr>
  <tr><td><code>GET /api/scenarios</code></td><td>List available scenarios and roles</td></tr>
  <tr><td><code>GET /api/insight</code></td><td>The full insight: computed values, narrative, validation result, telemetry</td></tr>
  <tr><td><code>GET /api/drivers</code></td><td>Regression output, correlations, anomaly flags, drill-down data</td></tr>
  <tr><td><code>GET /api/sources</code></td><td>Freshness, row counts, and schemas for each data source</td></tr>
  <tr><td><code>GET /api/semantic</code></td><td>The KPI contract definitions</td></tr>
  <tr><td><code>POST /api/chat</code></td><td>Ask a question in plain language; routed to a structured engine query</td></tr>
  <tr><td><code>POST /api/feedback</code> / <code>GET /api/feedback</code></td><td>Submit or view aggregated feedback on recommendations</td></tr>
  <tr><td><code>GET /api/health</code></td><td>Latency, cache hit rate, how often the LLM was avoided, abstention rate</td></tr>
  <tr><td><code>POST /api/scenarios/{id}/simulate-day</code></td><td>Append a new simulated day to a scenario</td></tr>
  <tr><td><code>POST /api/scenarios/{id}/reset</code></td><td>Wipe a scenario back to its seeded state</td></tr>
</table>

<hr>

<h2>Running the tests</h2>

<pre><code>cd backend
pytest -q</code></pre>

<p>
  This runs 39 tests split across two files. The ones in <code>test_engine.py</code> matter most. Each scenario
  has a known, deliberately injected ground truth, so the tests check that the engine actually <em>recovers</em>
  that truth rather than just producing some plausible-looking output. Specifically, they check things like:
</p>

<ul>
  <li>Revenue declines by 10 to 20% and marketing shows up in the top two attributed drivers</li>
  <li>LMDI effects sum to the total revenue change within a dollar</li>
  <li>The contradictory scenario abstains and cites stale marketing data as the reason</li>
  <li>The new-product scenario abstains because of sparse history</li>
  <li>No <code>NaN</code> or infinity values leak out anywhere</li>
  <li>Every number quoted in every persona&rsquo;s narrative can be traced back to an evidence object</li>
</ul>

<p>
  <code>test_api.py</code> covers the HTTP layer and auth/RBAC behavior, and <code>test_simulation.py</code>
  covers the day-by-day simulator.
</p>

<!-- ══════════════════════════ PAGE 4 ══════════════════════════ -->
<div class="page-break"></div>

<h2>Project layout</h2>

<pre><code>backend/
  app/
    engine/
      generator.py     synthetic data generation (seeded, reproducible)
      semantic.py       KPI contracts: definitions, thresholds, access rules
      analytics.py       movement detection, LMDI, regression, anomaly detection
      insight.py          evidence assembly and confidence scoring
      narrative.py         template narratives + optional validated LLM narratives
    main.py             FastAPI app and all routes
    auth.py             JWT auth and role-based access control
    db.py               SQLAlchemy models, Postgres/SQLite handling
    cache.py            Redis/in-memory caching and cost-tier routing
  tests/                pytest suite

frontend/
  src/
    components/pages/   one file per screen (Overview, Drivers, Sources, Chat, Simulator, etc.)
    api.ts              API client
    App.tsx             routing and layout

DESIGN.md               the reasoning behind each technical choice, in more depth</code></pre>

<hr>

<h2>Honest limitations</h2>

<p>Worth being upfront about a few things:</p>

<ul>
  <li>The data is synthetic. If you want to point this at real numbers, swap out <code>generate()</code> in
      <code>generator.py</code> for a loader that returns the same three DataFrames. The rest of the pipeline
      doesn&rsquo;t need to change.</li>
  <li>The regression is associational, not causal, and both the UI and the narrative validator are built to stop
      causal-sounding language from slipping through.</li>
  <li>Feedback is collected and does influence future driver weighting, but nothing is retrained live, and the
      product doesn&rsquo;t pretend otherwise.</li>
  <li>The demo login setup uses the role name as its own password. That&rsquo;s fine for a prototype; replace
      <code>DEMO_USERS</code> in <code>auth.py</code> with a real identity provider before this goes anywhere near
      actual users.</li>
  <li>In local dev mode (<code>REQUIRE_AUTH=false</code>), unauthenticated requests default to executive access,
      purely to make iterating faster. Flip this before deploying anywhere that isn&rsquo;t your own laptop.</li>
</ul>

<hr>

<h2>What we&rsquo;d change with more time</h2>

<ul>
  <li>Swap OLS for something closer to actual causal inference (instrumental variables or diff-in-diff) once
      there&rsquo;s richer data to support it. The attribution function is already isolated enough to make this a
      contained change.</li>
  <li>Learn the confidence-score weights from analyst feedback instead of hand-tuning them.</li>
  <li>Make the chat endpoint stream responses instead of doing a full round trip.</li>
  <li>Build real data connectors once there&rsquo;s an actual source system to connect to.</li>
</ul>

<p class="footer">
  KPI Intelligence-to-Action Engine &nbsp;&bull;&nbsp; Accenture Hackathon 2026 &nbsp;&bull;&nbsp; NovaMart
</p>

</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '18mm', bottom: '22mm', left: '18mm' },
  });
  await browser.close();
  console.log('PDF saved to:', outputPath);
})();
