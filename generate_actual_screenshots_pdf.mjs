import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.resolve(__dirname, 'Actual_Vercel_UI_Screenshots.pdf');
const screenshotsDir = path.resolve(__dirname, 'live_screenshots');

// Helper to convert image file path to file:// URL
const toFileUrl = (fileName) => {
  const fullPath = path.join(screenshotsDir, fileName).replace(/\\/g, '/');
  return `file:///${fullPath}`;
};

const screens = [
  {
    title: '1. Overview Dashboard (Happy Path)',
    subtitle: 'Revenue Decline Scenario — Prioritized KPI Cards, Materiality Scores & 5-Signal Confidence Gauge',
    tag: 'ROUTE: / (Overview)',
    file: '01_overview.png',
    features: [
      'Top bar shows active Scenario dropdown (Revenue Decline) and Role selector (Executive).',
      'KPI Cards: Revenue ($18.4M, -14.4%, HIGH Priority), Orders, AOV, Gross Margin, Conversion Rate.',
      'Primary Insight Card displaying computed business impact and Top Drivers attribution bar chart.',
      'Materiality Ledger ranking movements and 5-Factor Weighted Confidence Meter at 84% (HIGH).'
    ]
  },
  {
    title: '2. Insight Analysis & What-If Sandbox',
    subtitle: 'Validated Persona Narrative, LMDI Decomposition, Decision Sandbox & Traceable Lineage Ledger',
    tag: 'ROUTE: / (Insight Tab)',
    file: '02_insight.png',
    features: [
      'Headline and Persona narrative with green "Output validated" pass badge and anti-causal guardrails.',
      'LMDI Factor Breakdown: Orders Volume Effect (-$2.4M) vs AOV Price/Mix Effect (-$694K).',
      'Interactive "What-If" Decision Sandbox sliders for real-time projected dollar recovery.',
      'Traceable Evidence Ledger mapping claims to evidence IDs [E101-E110] with full lineage.'
    ]
  },
  {
    title: '3. Selective Abstention Protocol (Contradictory Scenario)',
    subtitle: 'Honest AI Refusal — Machine-Enforced Pause on Stale Data & Low Confidence',
    tag: 'SCENARIO: Contradictory Evidence',
    file: '03_abstention.png',
    features: [
      'Amber warning panel replaces standard recommendations when data quality is insufficient.',
      'Explicit failure diagnostic reasons: Marketing data 29 hours stale, 18% missing external rows.',
      'Prevents hallucinated advice when cross-source agreement drops below 50%.',
      'Interactive clarification prompt chips allowing analysts to query failure details directly.'
    ]
  },
  {
    title: '4. Driver Attribution & Statistical Diagnostics',
    subtitle: 'Multivariate OLS Panel Regression, Correlation Matrix & Anomaly Detection',
    tag: 'ROUTE: / (Drivers Tab)',
    file: '04_drivers.png',
    features: [
      'Methodology banner: "Regression is associational, not causal proof."',
      'OLS Regression table displaying standardized beta strength bars, R² fit, and p-value significance.',
      'Comparative Pearson r vs Spearman rank ρ correlation matrix for monotonicity checking.',
      'Auditable Business Rules triggers (SUPPLY_CONSTRAINT) and IsolationForest anomaly badges.'
    ]
  },
  {
    title: '5. Live Time-Machine Scenario Simulator Lab',
    subtitle: 'Parameter Shocks, Sprint Progression & Live SQLite Record Counters',
    tag: 'ROUTE: / (Simulator Tab)',
    file: '05_simulator.png',
    features: [
      'Interactive parameter shock sliders: Marketing Spend (0.1x to 3.0x), Stockouts (0-50%), Price Index.',
      'Sprint Duration selector: Advance scenario timeline by 1, 7, or 14 days.',
      'Live SQLite record counters tracking active transaction, marketing, and external row additions.',
      'One-click Scenario Reset button to restore pristine 365-day seeded benchmark.'
    ]
  },
  {
    title: '6. Data Sources & Ingestion Portal',
    subtitle: 'Pipeline SLA Freshness Audit, Schema Definitions & Custom JSON Ingestion',
    tag: 'ROUTE: / (Sources Tab)',
    file: '06_sources.png',
    features: [
      'Data freshness matrix auditing latency against expected SLAs for transactions, marketing, external feeds.',
      'Accordion inspection view showing grain, total rows, expected rows, and missing percentage.',
      'One-Click "Seed All 4 Scenarios to Database" button powering instant PRNG re-seeding.',
      'Custom Data Ingestion Portal (POST /api/ingest) with JSON text area editor.'
    ]
  },
  {
    title: '7. Semantic Layer & Metric Contracts',
    subtitle: 'Central KPI Governance — Definitions, Formulas, Owners, Grains & Access',
    tag: 'ROUTE: / (Semantic Tab)',
    file: '07_semantic.png',
    features: [
      'Centralized contract definitions for Revenue, Orders, AOV, Gross Margin, CAC, Stockout Rate.',
      'Formal mathematical formulas (e.g. SUM(unit_price * quantity), revenue / orders).',
      'Business metric owners (VP Sales, Head of Growth, Supply Chain Lead).',
      'Associated statistical drivers, refresh cadences, materiality thresholds, and role access.'
    ]
  },
  {
    title: '8. Feedback Loop & Analyst Telemetry',
    subtitle: 'Human-in-the-Loop Analyst Ratings, Closed-Loop Weight Tuning & Feedback Audit',
    tag: 'ROUTE: / (Feedback Tab)',
    file: '08_feedback.png',
    features: [
      'Analyst rating card: Helpful vs Not Helpful, category tagging, driver correction input.',
      'Feedback telemetry cards: Total insights reviewed, helpfulness percentage, error categories.',
      'Explains closed-loop tuning: Analyst corrections dynamically penalize disproven driver weights.',
      'Audit log storing analyst corrections directly in PostgreSQL / SQLite.'
    ]
  },
  {
    title: '9. System Health & Telemetry Dashboard',
    subtitle: 'Latency Bar Chart per Request, P95 Metric, Cache Hit Rate & Cost Routing',
    tag: 'ROUTE: / (Health Tab)',
    file: '09_health.png',
    features: [
      'Telemetry metrics: Last latency (ms), P95 latency (ms), LLM calls avoided %, Cache hit rate %.',
      'Interactive Recharts bar chart tracking request latency across recent engine queries.',
      'Cost-Optimized Model Routing breakdown: Tier 1 (Deterministic), Tier 2 (Fast), Tier 3 (Complex).',
      'Confirms 90%+ of quantitative queries skip LLM API token costs entirely.'
    ]
  },
  {
    title: '10. Analyst Natural Language Chat Drawer',
    subtitle: 'Natural Language Querying, Intent Classification & Cost-Tier Routing Badges',
    tag: 'COMPONENT: Analyst Chat Drawer',
    file: '10_chat_drawer.png',
    features: [
      'Slide-in right drawer for conversational analytics in natural language.',
      'Assistant response pills displaying intent (why_down), filter tags (region=North), and execution latency.',
      'Route indicator badge distinguishing narrative vs zero-token deterministic queries.',
      'Quick suggestion prompt chips for instant click-to-query execution.'
    ]
  }
];

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NovaMart KPI Engine — Actual Vercel UI Screenshots</title>
<style>
  @page {
    size: 297mm 210mm; /* A4 Landscape */
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    background: #0B0F17;
    color: #F1F5F9;
    -webkit-print-color-adjust: exact;
  }
  .page {
    width: 297mm;
    height: 210mm;
    padding: 12mm 16mm;
    position: relative;
    page-break-after: always;
    background: #0B0F17;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Header structure */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #1E293B;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .page-title {
    font-size: 14pt;
    font-weight: 800;
    color: #F8FAFC;
    letter-spacing: -0.3px;
  }
  .page-subtitle {
    font-size: 8pt;
    color: #94A3B8;
  }
  .badge-tag {
    background: rgba(16, 185, 129, 0.2);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.4);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  /* Footer bar */
  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #1E293B;
    padding-top: 5px;
    font-size: 7pt;
    color: #64748B;
    font-family: monospace;
  }

  /* Image Containers */
  .img-frame {
    width: 100%;
    height: 124mm;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #334155;
    box-shadow: 0 8px 20px rgba(0,0,0,0.6);
  }

  /* Grid & Cards */
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }
  .card {
    background: #121824;
    border: 1px solid #1E293B;
    border-radius: 6px;
    padding: 6px 10px;
    border-left: 3px solid #A100FF;
  }
  .card-title {
    font-size: 8.5pt;
    font-weight: 700;
    color: #F1F5F9;
    margin-bottom: 3px;
  }
  ul { padding-left: 12px; }
  li {
    font-size: 7.5pt;
    color: #CBD5E1;
    line-height: 1.35;
    margin-bottom: 2px;
  }
</style>
</head>
<body>

<!-- ════════════════════ COVER PAGE ════════════════════ -->
<div class="page" style="justify-content: space-between;">
  <div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
      <div>
        <span class="badge-tag" style="font-size: 9pt; padding: 4px 10px;">LIVE VERCEL PRODUCTION SCREENSHOTS</span>
        <h1 style="font-size: 30pt; font-weight: 900; color: #FFF; margin-top: 8px; letter-spacing: -0.8px;">
          NovaMart Intelligence Platform
        </h1>
        <p style="font-size: 13pt; color: #94A3B8; margin-top: 4px;">
          Actual Application UI Frame Screenshots Captured Live from Production
        </p>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 9pt; color: #64748B;">
        <div style="color: #34D399; font-weight: bold; font-size: 10pt;">https://kpi-engine.vercel.app</div>
        <div>Accenture Hackathon Round 2</div>
        <div>Problem Track 3</div>
      </div>
    </div>

    <!-- Summary Box -->
    <div style="background: #121824; border: 1px solid #1E293B; border-left: 4px solid #10B981; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
      <div style="font-size: 11pt; font-weight: 700; color: #F1F5F9; margin-bottom: 6px;">
        📸 Verified Production Interface Screenshots (10 Frames)
      </div>
      <p style="font-size: 9pt; color: #CBD5E1; line-height: 1.5;">
        This document contains unedited 1440x900 screenshots captured directly from the live Vercel production deployment at <code>https://kpi-engine.vercel.app</code> using automated Puppeteer headless navigation. It documents all 9 main application screens plus the slide-in Analyst Chat drawer, confirming live functionality across movement detection, LMDI factor splits, abstention protocols, live time simulation, RBAC redactions, and telemetry monitoring.
      </p>
    </div>

    <!-- 10 Frames Table Index -->
    <div style="background: #121824; border: 1px solid #1E293B; border-radius: 8px; padding: 12px 14px;">
      <div style="font-size: 9.5pt; font-weight: 700; color: #F1F5F9; margin-bottom: 8px;">
        📋 Table of Live UI Frames Included:
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8pt; color: #CBD5E1;">
        <div>1. <strong>Overview Dashboard</strong> — KPI Cards, LMDI Bar Chart, Confidence Gauge</div>
        <div>6. <strong>Data Sources &amp; Ingestion</strong> — SLA Freshness, Row Counts, JSON Editor</div>
        <div>2. <strong>Insight Analysis</strong> — Persona Narrative, What-If Sandbox Sliders, Lineage</div>
        <div>7. <strong>Semantic Layer</strong> — KPI Contracts, Formulas, Owners, Materiality</div>
        <div>3. <strong>Abstention Protocol</strong> — Low Confidence Alert, Failure Logs, Clarification Chips</div>
        <div>8. <strong>Feedback Loop</strong> — Analyst Helpfulness Rating, Error Categorization</div>
        <div>4. <strong>Driver Attribution</strong> — OLS Panel Regression Table, Pearson/Spearman Matrix</div>
        <div>9. <strong>System Health</strong> — Latency Bar Chart, P95 Telemetry, Cost Routing</div>
        <div>5. <strong>Live Simulator Lab</strong> — Parameter Shocks, Sprint Trigger, SQLite Counters</div>
        <div>10. <strong>Analyst Chat Drawer</strong> — Natural Language Queries, Intent Metadata Badges</div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>NovaMart Intelligence-to-Action Engine | Live Vercel Production Screenshots</div>
    <div>Cover Page</div>
  </div>
</div>

<!-- ════════════════════ 10 SCREENSHOT PAGES ════════════════════ -->
${screens.map((s, idx) => `
<div class="page">
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">${s.title}</div>
        <div class="page-subtitle">${s.subtitle}</div>
      </div>
      <span class="badge-tag">${s.tag}</span>
    </div>

    <img src="${toFileUrl(s.file)}" class="img-frame" alt="${s.title}" />

    <div class="features-grid">
      <div class="card" style="border-left: 3px solid #A100FF;">
        <div class="card-title">🔍 Live UI Components &amp; State</div>
        <ul>
          <li>${s.features[0]}</li>
          <li>${s.features[1]}</li>
        </ul>
      </div>
      <div class="card" style="border-left: 3px solid #10B981;">
        <div class="card-title">⚡ Feature Functionality &amp; Engine Mechanics</div>
        <ul>
          <li>${s.features[2]}</li>
          <li>${s.features[3]}</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div>NovaMart Intelligence-to-Action Engine | Live Vercel Screenshots (https://kpi-engine.vercel.app)</div>
    <div>Page ${idx + 1} of ${screens.length}</div>
  </div>
</div>
`).join('')}

</body>
</html>
`;

fs.writeFileSync(path.resolve(__dirname, 'actual_screenshots_catalog.html'), htmlContent, 'utf-8');
console.log('actual_screenshots_catalog.html created successfully.');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser.close();
  console.log('PDF saved successfully to:', pdfPath);
})();
