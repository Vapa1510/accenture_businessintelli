import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, 'Video_Plan.pdf');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Demo Video Plan — KPI Intelligence-to-Action Engine</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", "Cambria", serif;
    font-size: 9.8pt;
    line-height: 1.65;
    color: #1a1a1a;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-family: Georgia, serif;
    font-size: 22pt;
    font-weight: bold;
    color: #000;
    margin: 0 0 4px 0;
    border-bottom: 2px solid #222;
    padding-bottom: 6px;
  }
  .lead {
    font-size: 10pt;
    color: #555;
    font-style: italic;
    margin: 8px 0 14px 0;
  }
  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 14px 0;
  }
  h2 {
    font-family: Georgia, serif;
    font-size: 13.5pt;
    font-weight: bold;
    color: #111;
    margin-top: 20px;
    margin-bottom: 5px;
    page-break-after: avoid;
  }
  h3 {
    font-family: Georgia, serif;
    font-size: 11pt;
    font-weight: bold;
    color: #222;
    margin-top: 14px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }
  h4 {
    font-family: Georgia, serif;
    font-size: 10pt;
    font-weight: bold;
    color: #333;
    margin-top: 10px;
    margin-bottom: 3px;
  }
  p { margin: 0 0 7px 0; }
  strong { color: #111; }
  em { color: #444; }
  ul, ol {
    margin: 4px 0 8px 0;
    padding-left: 18px;
  }
  li { margin-bottom: 3px; }
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.5pt;
    background: #f3f3f3;
    padding: 1px 3px;
    border-radius: 2px;
    color: #333;
  }
  pre {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8pt;
    background: #f7f7f7;
    border: 1px solid #ddd;
    padding: 8px 10px;
    border-radius: 3px;
    margin: 6px 0 10px 0;
    line-height: 1.4;
    page-break-inside: avoid;
    white-space: pre-wrap;
  }
  pre code { background: none; padding: 0; font-size: 8pt; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 10px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #eee;
    font-weight: bold;
    text-align: left;
    padding: 4px 6px;
    border: 1px solid #ccc;
    font-family: "Segoe UI", Helvetica, sans-serif;
    font-size: 7.8pt;
    color: #222;
  }
  td {
    padding: 3px 6px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  blockquote {
    border-left: 3px solid #888;
    margin: 8px 0;
    padding: 6px 12px;
    background: #fafafa;
    font-style: italic;
    color: #444;
    font-size: 9pt;
  }
  .page-break { page-break-before: always; }
  .script-section {
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 10px 12px;
    margin: 8px 0 12px 0;
    page-break-inside: avoid;
  }
  .script-section h4 {
    margin-top: 0;
    color: #111;
    font-size: 10pt;
  }
  .stage-dir {
    font-style: italic;
    color: #666;
    font-size: 8.8pt;
  }
  .voiceover {
    color: #1a1a1a;
    font-size: 9.5pt;
    line-height: 1.6;
  }
  .hero-card {
    background: #f9f9f9;
    border-left: 3px solid #333;
    padding: 6px 10px;
    margin: 6px 0;
    page-break-inside: avoid;
  }
  .hero-card strong { color: #000; }
  .checklist { list-style: none; padding-left: 0; }
  .checklist li::before { content: "☐ "; color: #888; }
  .footer {
    font-size: 7pt;
    color: #aaa;
    text-align: center;
    margin-top: 20px;
    border-top: 1px solid #ddd;
    padding-top: 5px;
    font-family: "Segoe UI", Helvetica, sans-serif;
  }
</style>
</head>
<body>

<!-- ══════════ PAGE 1 ══════════ -->
<h1>Demo Video Plan</h1>
<p class="lead">KPI Intelligence-to-Action Engine &mdash; A complete guide for recording a 5&ndash;7 minute prototype showcase video.</p>

<hr>

<h2>Complete Feature List (39 Features)</h2>

<h3>Core Analytics Engine</h3>
<table>
  <tr><th>#</th><th>Feature</th><th>What it does</th></tr>
  <tr><td>1</td><td><strong>KPI Movement Detection</strong></td><td>Compares current 21-day window vs previous 21-day window, calculates Z-scores against an 84-day rolling baseline. Flags movements exceeding 1.5&sigma; as &ldquo;material&rdquo;</td></tr>
  <tr><td>2</td><td><strong>LMDI Factor Decomposition</strong></td><td>Splits revenue change into Orders effect + AOV effect that sum <em>exactly</em> to the total &mdash; no residual, no hand-waving</td></tr>
  <tr><td>3</td><td><strong>OLS Driver Attribution</strong></td><td>Multivariate regression: revenue vs marketing spend, conversion, price, supply. Reports dollar-denominated betas, R&sup2;, p-values</td></tr>
  <tr><td>4</td><td><strong>Correlation Analysis</strong></td><td>Pearson + Spearman correlations alongside regression as a sanity check layer</td></tr>
  <tr><td>5</td><td><strong>Anomaly Detection</strong></td><td>IsolationForest flags unusual days using multiple signals simultaneously, not single-metric thresholds</td></tr>
  <tr><td>6</td><td><strong>Dimensional Drill-down</strong></td><td>Break any KPI by region or product category to find which slice drove the aggregate movement</td></tr>
  <tr><td>7</td><td><strong>Business Rules Engine</strong></td><td>Auditable threshold-based rules separate from statistical models &mdash; independently reviewable</td></tr>
  <tr><td>8</td><td><strong>Day-by-Day Simulator</strong></td><td>Append a new day with adjustable marketing spend, stockout rate, and competitor pricing; watch the engine re-analyze</td></tr>
</table>

<h3>Confidence &amp; Abstention System</h3>
<table>
  <tr><th>#</th><th>Feature</th><th>What it does</th></tr>
  <tr><td>9</td><td><strong>5-Signal Confidence Scoring</strong></td><td>Weighted composite: completeness (25%), freshness (20%), statistical strength (20%), cross-source agreement (20%), historical coverage (15%)</td></tr>
  <tr><td>10</td><td><strong>Selective Abstention</strong></td><td>Three triggers: history &lt;30 days, cross-source disagreement + stale data, composite &lt;60%. Says <em>what&rsquo;s wrong</em> and asks clarifying questions</td></tr>
  <tr><td>11</td><td><strong>Evidence Lineage</strong></td><td>Every number traces to a source, a method, and a timestamp. Full traceable claim objects</td></tr>
</table>

<h3>Narrative &amp; LLM Layer</h3>
<table>
  <tr><th>#</th><th>Feature</th><th>What it does</th></tr>
  <tr><td>12</td><td><strong>Deterministic Templates</strong></td><td>Python templates driven by computed values &mdash; no LLM, no API key needed</td></tr>
  <tr><td>13</td><td><strong>Validated LLM Upgrade</strong></td><td>Optional Claude. LLM receives only structured evidence. Every number scanned &amp; verified within 3% tolerance. Hallucinations &rarr; auto-fallback</td></tr>
  <tr><td>14</td><td><strong>Persona-Tailored Output</strong></td><td>Same analysis, different narrative. Executive gets strategy; analyst gets regression detail; marketing sees campaigns</td></tr>
  <tr><td>15</td><td><strong>Cost-Tier Routing</strong></td><td>Queries classified into tiers. Only narrative tier can invoke an LLM. 90%+ queries never touch an LLM</td></tr>
</table>

<h3>Role-Based Access &amp; Infrastructure</h3>
<table>
  <tr><th>#</th><th>Feature</th><th>What it does</th></tr>
  <tr><td>16</td><td><strong>Server-Side Redaction</strong></td><td>Restricted KPIs never leave the API &mdash; not CSS hiding, the data literally isn&rsquo;t in the response</td></tr>
  <tr><td>17</td><td><strong>Role-Gated Approvals</strong></td><td>Actions require approval from the right role (marketing can&rsquo;t approve inventory changes)</td></tr>
  <tr><td>18</td><td><strong>JWT Authentication</strong></td><td>Standard token-based auth with four demo roles</td></tr>
  <tr><td>19</td><td><strong>Seeded Reproducible Data</strong></td><td>Mulberry32 PRNG &rarr; same scenario = same numbers, every time, on every machine</td></tr>
  <tr><td>20</td><td><strong>Four Benchmark Scenarios</strong></td><td>Revenue Decline, Revenue Growth, Contradictory Evidence, New Product &mdash; each with known ground truth</td></tr>
  <tr><td>21</td><td><strong>PostgreSQL + SQLite Dual Mode</strong></td><td>Docker &rarr; Postgres; local &rarr; SQLite. Zero-config fallback</td></tr>
  <tr><td>22</td><td><strong>Redis + In-Memory Cache</strong></td><td>Sub-5ms cached responses; no Redis required for local dev</td></tr>
  <tr><td>23</td><td><strong>Custom Data Ingestion</strong></td><td>POST JSON to <code>/api/ingest</code> or paste into the UI</td></tr>
  <tr><td>24</td><td><strong>Semantic Layer</strong></td><td>Central KPI contracts: formula, unit, grain, dimensions, ownership, materiality threshold</td></tr>
</table>

<!-- ══════════ PAGE 2 ══════════ -->
<div class="page-break"></div>

<h3>Frontend Dashboard</h3>
<table>
  <tr><th>#</th><th>Feature</th><th>What it does</th></tr>
  <tr><td>25</td><td><strong>KPI Overview Cards</strong></td><td>Revenue, Orders, AOV, Margin, Conversion &mdash; current value, delta %, Z-score, materiality index, priority badge</td></tr>
  <tr><td>26</td><td><strong>9-Stage Pipeline Animation</strong></td><td>Animated modal: fetch &rarr; reconcile &rarr; freshness &rarr; movement &rarr; contribution &rarr; drivers &rarr; confidence &rarr; narrative &rarr; validation</td></tr>
  <tr><td>27</td><td><strong>Waterfall Decomposition</strong></td><td>Visual LMDI breakdown: Orders effect &rarr; AOV effect &rarr; Total change, with exact dollar amounts</td></tr>
  <tr><td>28</td><td><strong>Driver Regression Panel</strong></td><td>Coefficient table with strength bars, direction badges, p-value significance stars, R&sup2; score</td></tr>
  <tr><td>29</td><td><strong>Hierarchical Drill-Down</strong></td><td>Interactive breadcrumb: Revenue &rarr; Region &rarr; Category &rarr; Product. Click to drill, breadcrumb to step back</td></tr>
  <tr><td>30</td><td><strong>Natural Language Chat</strong></td><td>Slide-in drawer with intent badges, filter tags, route indicator, execution latency, suggestion chips</td></tr>
  <tr><td>31</td><td><strong>Feedback System</strong></td><td>Rate helpfulness, pick error category, provide analyst correction. Feedback adjusts materiality &amp; driver weights</td></tr>
  <tr><td>32</td><td><strong>System Health Dashboard</strong></td><td>Latency bar chart, P95 metric, cache hit rate, LLM-avoidance %, 3-tier cost routing visualization</td></tr>
  <tr><td>33</td><td><strong>What-If Sandbox</strong></td><td>Marketing budget &amp; price alignment sliders with real-time projected dollar impact calculation</td></tr>
  <tr><td>34</td><td><strong>Copy Executive Brief</strong></td><td>One-click button generates a formatted markdown decision brief to clipboard</td></tr>
  <tr><td>35</td><td><strong>Data Ingestion Tool</strong></td><td>Paste JSON on the Sources page, click Ingest &mdash; validates schema and inserts into SQLite</td></tr>
</table>

<h3>Testing &amp; Validation</h3>
<table>
  <tr><th>#</th><th>Feature</th><th>What it does</th></tr>
  <tr><td>36</td><td><strong>39 Automated Tests</strong></td><td>19 engine tests with ground-truth assertions, 20 API tests for auth/RBAC</td></tr>
  <tr><td>37</td><td><strong>Ground-Truth Recovery</strong></td><td>Tests verify the engine finds the injected driver, not just &ldquo;no errors&rdquo;</td></tr>
  <tr><td>38</td><td><strong>Narrative Number Validation</strong></td><td>Every figure in every persona&rsquo;s narrative must trace back to a computed evidence value</td></tr>
  <tr><td>39</td><td><strong>Anti-Causal Language Guard</strong></td><td>Regex validator rejects LLM prose using causal language without the associational disclaimer</td></tr>
</table>

<hr>

<h2>USPs &mdash; What Makes This Different</h2>

<h3>vs. Generic BI Dashboards (Tableau, Power BI, Looker)</h3>
<table>
  <tr><th>Generic Dashboard</th><th>Our Engine</th></tr>
  <tr><td>Shows you <em>what</em> changed</td><td>Tells you <em>why</em> it changed and <em>what to do about it</em></td></tr>
  <tr><td>Numbers update, human interprets</td><td>Engine attributes drivers, decomposes factors, recommends actions</td></tr>
  <tr><td>No confidence scoring</td><td>Scores its own confidence on 5 signals before answering</td></tr>
  <tr><td>Always shows an answer</td><td><strong>Abstains</strong> when data is unreliable &mdash; says &ldquo;I don&rsquo;t know&rdquo;</td></tr>
  <tr><td>One view for everyone</td><td>Persona-tailored narratives with server-side data redaction</td></tr>
  <tr><td>Static snapshots</td><td>Day-by-day simulator to test &ldquo;what if&rdquo; scenarios</td></tr>
</table>

<h3>vs. &ldquo;AI Analytics&rdquo; Tools (ChatGPT wrapper dashboards)</h3>
<table>
  <tr><th>AI Analytics Tools</th><th>Our Engine</th></tr>
  <tr><td>LLM generates the numbers</td><td>Every number computed deterministically in Python &mdash; LLM only writes prose</td></tr>
  <tr><td>Hallucination risk on every query</td><td>Post-hoc number validation &mdash; hallucinated figures rejected, template fallback used</td></tr>
  <tr><td>No evidence trail</td><td>Full lineage: every claim &rarr; source &rarr; method &rarr; timestamp</td></tr>
  <tr><td>Always confident</td><td>Explicit abstention with human-readable reasons</td></tr>
  <tr><td>One-size-fits-all prompt</td><td>Cost-tier routing &mdash; 90%+ of queries never touch an LLM</td></tr>
  <tr><td>Black box</td><td>Open regression coefficients, p-values, R&sup2;, correlation sanity checks</td></tr>
</table>

<h3>The Three USPs in One Sentence Each</h3>
<ol>
  <li><strong>Deterministic numbers, never LLM-generated.</strong> The model writes words around verified figures &mdash; if it invents a number, the response is automatically discarded.</li>
  <li><strong>Honest abstention over confident guessing.</strong> Three explicit red-flag triggers stop the engine from giving advice when the data can&rsquo;t support it.</li>
  <li><strong>Full evidence lineage.</strong> Every percentage, every dollar amount, every recommendation traces back to a specific data source, computation, and timestamp.</li>
</ol>

<!-- ══════════ PAGE 3 ══════════ -->
<div class="page-break"></div>

<h2>Best Video Approach</h2>

<h3>Format: Screen Recording + Voiceover</h3>

<blockquote>
  <strong>Don&rsquo;t</strong> do a slide deck presentation. <strong>Do</strong> a live walkthrough of the running application
  with a calm voiceover explaining what&rsquo;s happening. This is a prototype showcase, not a pitch &mdash; the product
  should speak for itself.
</blockquote>

<h3>Recording Setup</h3>
<table>
  <tr><th>Aspect</th><th>Recommendation</th></tr>
  <tr><td><strong>Tool</strong></td><td>OBS Studio (free) or Loom (simple)</td></tr>
  <tr><td><strong>Resolution</strong></td><td>1920&times;1080, browser at 90% zoom</td></tr>
  <tr><td><strong>Audio</strong></td><td>Quiet room, USB mic or good headphones mic. Record voice separately if possible</td></tr>
  <tr><td><strong>Browser</strong></td><td>Chrome, dark mode off, no extensions visible, clean tab bar</td></tr>
  <tr><td><strong>Length</strong></td><td>5&ndash;7 minutes. Don&rsquo;t rush, don&rsquo;t pad. 6 minutes is ideal</td></tr>
  <tr><td><strong>Editing</strong></td><td>Cut dead time. Add subtle transitions. No flashy effects</td></tr>
</table>

<h3>Structure: The 6-Minute Arc</h3>
<pre><code>0:00 &ndash; 0:30   Hook + Problem Statement        (30 sec)
0:30 &ndash; 1:00   Solution Overview               (30 sec)
1:00 &ndash; 2:30   Live Demo: Happy Path           (90 sec)  &larr; the main show
2:30 &ndash; 3:30   Live Demo: Abstention           (60 sec)  &larr; the differentiator
3:30 &ndash; 4:30   Live Demo: Simulator + Chat     (60 sec)
4:30 &ndash; 5:15   Under the Hood (quick)          (45 sec)
5:15 &ndash; 5:45   Role-Based Access               (30 sec)
5:45 &ndash; 6:15   Wrap-up + What&rsquo;s Next           (30 sec)</code></pre>

<hr>

<h2>Full Script</h2>
<p><em>Speaker cues in italics. Screen actions in [brackets].</em></p>

<div class="script-section">
  <h4>SECTION 1: Hook + Problem (0:00 &ndash; 0:30)</h4>
  <p class="stage-dir">[Show the dashboard loading with the Revenue Decline scenario selected]</p>
  <p class="voiceover">
    &ldquo;Revenue just dropped fifteen percent. In most companies, what happens next is someone opens a dashboard,
    stares at the numbers, and starts guessing. Was it marketing? Was it a supply issue? Should we spend more or pull back?
  </p>
  <p class="voiceover">
    The problem isn&rsquo;t the data &mdash; it&rsquo;s that dashboards show you <em>what</em> changed but never tell you <em>why</em>.
    That&rsquo;s what we built this engine to do.&rdquo;
  </p>
</div>

<div class="script-section">
  <h4>SECTION 2: Solution Overview (0:30 &ndash; 1:00)</h4>
  <p class="stage-dir">[Slowly scroll through the Overview page, showing the KPI cards]</p>
  <p class="voiceover">
    &ldquo;This is the KPI Intelligence-to-Action Engine. It takes data from three sources &mdash; transactions,
    marketing campaigns, and external signals like competitor pricing &mdash; and runs it through a pipeline of
    statistical analysis, machine learning, and business rules to figure out what&rsquo;s driving a KPI movement.
  </p>
  <p class="voiceover">
    Here&rsquo;s the key design decision: every number you see on this screen is computed deterministically in Python.
    We never let an AI model generate a number. It only writes the explanation around numbers that are already verified.&rdquo;
  </p>
</div>

<div class="script-section">
  <h4>SECTION 3: Live Demo &mdash; Happy Path (1:00 &ndash; 2:30)</h4>
  <p class="stage-dir">[Select &ldquo;Revenue Decline&rdquo; scenario. Click through to the Insight page]</p>
  <p class="voiceover">
    &ldquo;Let&rsquo;s walk through a real scenario. We&rsquo;ve selected Revenue Decline &mdash; marketing spend was
    pulled back thirty percent and there&rsquo;s a stockout in the North region.
  </p>
  <p class="stage-dir">[Point to the KPI cards]</p>
  <p class="voiceover">
    The engine detects that revenue is down fourteen point four percent. But it doesn&rsquo;t stop there. It decomposes
    that change using LMDI &mdash; Log Mean Divisia Index &mdash; which splits the total revenue change into a volume
    effect and a price-mix effect.
  </p>
  <p class="stage-dir">[Point to the waterfall chart]</p>
  <p class="voiceover">
    What&rsquo;s powerful about LMDI is that these two effects add up <em>exactly</em> to the total change. No residual,
    no rounding error. When a stakeholder asks &lsquo;where did the other two percent go?&rsquo; &mdash; there is no
    missing two percent.
  </p>
  <p class="stage-dir">[Scroll to the driver attribution section]</p>
  <p class="voiceover">
    Next, the engine fits a regression to identify which levers are most associated with this movement. Marketing spend
    shows up as the top driver, with clear statistical significance. We also show Pearson and Spearman correlations as a
    sanity check.
  </p>
  <p class="stage-dir">[Point to the confidence score and narrative]</p>
  <p class="voiceover">
    And here&rsquo;s the confidence score &mdash; weighted across five signals. In this scenario, confidence is high,
    so the engine proceeds to give a recommendation. The narrative is written for the logged-in persona. An executive
    sees a strategic summary. An analyst would see the full regression detail. Same data, different story.&rdquo;
  </p>
</div>

<!-- ══════════ PAGE 4 ══════════ -->
<div class="page-break"></div>

<div class="script-section">
  <h4>SECTION 4: Live Demo &mdash; Abstention (2:30 &ndash; 3:30)</h4>
  <p class="stage-dir">[Switch to &ldquo;Contradictory Evidence&rdquo; scenario]</p>
  <p class="voiceover">
    &ldquo;Now here&rsquo;s where it gets interesting. This scenario has the same data structure, but the marketing
    data is twenty-nine hours stale, and eighteen percent of external rows are missing.
  </p>
  <p class="stage-dir">[Show the abstention panel appearing]</p>
  <p class="voiceover">
    The engine doesn&rsquo;t guess. It sees that the cross-source agreement is below fifty percent with stale data,
    and it <em>abstains</em>. No recommendation is produced. Instead, it tells you exactly what&rsquo;s wrong &mdash;
    &lsquo;marketing data is twenty-nine hours old, external coverage is incomplete&rsquo; &mdash; and asks clarifying questions.
  </p>
  <p class="stage-dir">[Switch to &ldquo;New Product&rdquo; scenario briefly]</p>
  <p class="voiceover">
    Same thing here. A product launched only eighteen days ago. The engine says: not enough history to build a reliable
    baseline. Come back when we have thirty days.
  </p>
  <p class="voiceover">
    This is the feature we&rsquo;re most proud of. Most analytics tools will always give you an answer. Ours is honest
    enough to say &lsquo;I don&rsquo;t have enough evidence to be confident here.&rsquo;&rdquo;
  </p>
</div>

<div class="script-section">
  <h4>SECTION 5: Simulator + Chat (3:30 &ndash; 4:30)</h4>
  <p class="stage-dir">[Navigate to the Simulator page]</p>
  <p class="voiceover">
    &ldquo;The platform also includes a day-by-day simulator. You can append a new day of data and adjust three levers:
    marketing spend, stockout rate, and competitor pricing.
  </p>
  <p class="stage-dir">[Adjust the marketing spend slider up, click &lsquo;Simulate Day&rsquo;]</p>
  <p class="voiceover">
    Watch how the engine&rsquo;s analysis updates. The revenue trajectory changes, the driver attribution shifts, and
    the confidence score adjusts. This is useful for testing &lsquo;what if&rsquo; scenarios.
  </p>
  <p class="stage-dir">[Navigate to Chat, type a question, show the response]</p>
  <p class="voiceover">
    There&rsquo;s also a natural language interface. You can ask questions like &lsquo;Why did revenue drop?&rsquo;
    The system classifies the intent, routes it to the right engine function, and returns a structured answer &mdash;
    not a generated one. Simple number lookups never touch an LLM at all.&rdquo;
  </p>
</div>

<div class="script-section">
  <h4>SECTION 6: Under the Hood (4:30 &ndash; 5:15)</h4>
  <p class="stage-dir">[Show the Data Sources page, then the Health dashboard]</p>
  <p class="voiceover">
    &ldquo;Under the hood, the Data Sources page shows the freshness and coverage of each data feed. You can see
    exactly how old each source is and how many rows are present.
  </p>
  <p class="voiceover">
    The system health dashboard tracks latency at the ninety-fifth percentile, cache hit rate, and &mdash; this is
    important &mdash; the LLM avoidance percentage. In most runs, over ninety percent of requests never invoke a
    language model. That&rsquo;s by design.&rdquo;
  </p>
</div>

<div class="script-section">
  <h4>SECTION 7: Role-Based Access (5:15 &ndash; 5:45)</h4>
  <p class="stage-dir">[Log out and log in as &lsquo;marketing&rsquo;]</p>
  <p class="voiceover">
    &ldquo;When I switch to the marketing manager role, watch what changes. Gross margin is gone. Not hidden with
    CSS &mdash; the API literally doesn&rsquo;t return it. Redaction is server-side. If you opened the browser&rsquo;s
    network tab, that data wouldn&rsquo;t be there.
  </p>
  <p class="voiceover">
    The marketing manager also can&rsquo;t approve inventory or supplier changes &mdash; only campaign and budget
    actions. Each role sees exactly what they need, and nothing they shouldn&rsquo;t.&rdquo;
  </p>
</div>

<div class="script-section">
  <h4>SECTION 8: Wrap-up (5:45 &ndash; 6:15)</h4>
  <p class="stage-dir">[Return to the Overview page]</p>
  <p class="voiceover">
    &ldquo;To sum up: this engine doesn&rsquo;t just show you numbers. It detects what moved, explains why, scores
    its own confidence, and either recommends an action or honestly says it doesn&rsquo;t know.
  </p>
  <p class="voiceover">
    Every number is deterministic. Every narrative is validated. Every claim traces back to evidence.
  </p>
  <p class="voiceover">
    We built this for NovaMart, but the pipeline is data-source agnostic &mdash; swap out the generator for a real
    data loader, and everything downstream stays the same. Thank you for watching.&rdquo;
  </p>
</div>

<!-- ══════════ PAGE 5 ══════════ -->
<div class="page-break"></div>

<h2>&ldquo;Hero Moments&rdquo; &mdash; The 5 Demos That Will Land the Strongest</h2>

<p>If you&rsquo;re short on time or need to prioritize, these five moments will make the biggest impression on judges:</p>

<div class="hero-card">
  <strong>1. The Pipeline Animation &rarr; Instant Insight (Overview page)</strong><br>
  Click &ldquo;Run Intelligence Analysis&rdquo; and let the 9-stage animated modal play through. It visually communicates
  the entire architecture in 5 seconds. Then the dashboard loads with KPI cards, materiality scores, and a confidence meter
  &mdash; all computed, nothing generated.
</div>

<div class="hero-card">
  <strong>2. Switch to Contradictory Evidence &rarr; Watch It Refuse (Abstention)</strong><br>
  This is the single most impressive demo. Switch scenarios and watch the engine refuse to answer, show exactly <em>why</em>,
  and offer clarifying questions. No other analytics tool does this.
</div>

<div class="hero-card">
  <strong>3. The Simulator Shock Test (Simulator page)</strong><br>
  Crank the stockout rate to 25%, simulate 7 days, and watch the row counters tick up in real time. Then go back to
  Overview and see the engine&rsquo;s analysis change &mdash; the supply constraint rule fires, the narrative shifts,
  the confidence adjusts.
</div>

<div class="hero-card">
  <strong>4. The Evidence Lineage Trail (Insight page)</strong><br>
  Scroll to the evidence ledger and show the chain: <code>SUM(revenue)</code> &rarr; Transaction DB &rarr; LMDI
  decomposition &rarr; Evidence object [E1] &rarr; Narrative sentence &rarr; Recommendation. Every claim is traceable.
</div>

<div class="hero-card">
  <strong>5. Role Switch: Executive &rarr; Marketing Manager (Any page)</strong><br>
  Log out, log in as marketing. Show gross margin cards disappearing &mdash; not hidden, <em>gone</em>. Open browser
  DevTools Network tab briefly and show the API response literally doesn&rsquo;t contain the data. That&rsquo;s server-side redaction.
</div>

<hr>

<h2>Practical Tips for Recording</h2>

<ol>
  <li><strong>Do a dry run first.</strong> Click through every page once before recording so you know where things are.</li>
  <li><strong>Seed the data before recording.</strong> Run <code>python -m app.seed</code> so all four scenarios are ready. Don&rsquo;t seed during the video.</li>
  <li><strong>Zoom your browser to 90%.</strong> Ensures all cards, tables, and charts fit on screen without horizontal scrolling.</li>
  <li><strong>Keep mouse movements slow and deliberate.</strong> Jerky mouse movements look unprofessional.</li>
  <li><strong>Pause for 2 seconds after each section.</strong> Makes editing easier and gives the viewer time to absorb.</li>
  <li><strong>If you make a mistake, pause and re-do that sentence.</strong> You&rsquo;ll cut it in editing.</li>
  <li><strong>Record voiceover and screen separately if possible.</strong> Lets you re-record audio without re-doing screen capture.</li>
  <li><strong>End on the Overview page.</strong> It&rsquo;s the most visually complete screen and makes a good final frame.</li>
</ol>

<hr>

<h2>Post-Production Checklist</h2>

<ul class="checklist">
  <li>Trim dead time (loading spinners, typing mistakes)</li>
  <li>Add a simple title card at the start: &ldquo;KPI Intelligence-to-Action Engine &mdash; Accenture Hackathon 2026&rdquo;</li>
  <li>Add subtle transition fades between sections (0.3s crossfade is enough)</li>
  <li>Normalize audio levels so voiceover is consistent</li>
  <li>Add a closing card with the team name and the live URL</li>
  <li>Export at 1080p, H.264, reasonable bitrate (~8 Mbps)</li>
  <li>Watch it once end-to-end before submitting. If something bores you, cut it</li>
</ul>

<p class="footer">
  KPI Intelligence-to-Action Engine &bull; Demo Video Plan &bull; Accenture Hackathon 2026
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
    margin: { top: '18mm', right: '16mm', bottom: '20mm', left: '16mm' },
  });
  await browser.close();
  console.log('PDF saved to:', outputPath);
})();
