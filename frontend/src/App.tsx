import { useEffect, useState } from "react";
import {
  Activity, BrainCircuit, Database, FlaskConical, Layers, Lock, MessageSquare,
  Play, RefreshCw, Server, ShieldCheck, Sparkles, AlertCircle, ChevronRight,
} from "lucide-react";
import { getInsight, getScenarios, login } from "./api";
import type { Insight } from "./api";
import {
  ChatPanel, DriversPage, FeedbackPage, HealthPage, InsightPage, Overview,
  SemanticPage, SourcesPage,
} from "./components/pages/index";
import { Card } from "./components/ui";

const NAV: [string, string, any][] = [
  ["overview", "Overview", Activity],
  ["insight", "Insight Analysis", Sparkles],
  ["drivers", "Driver Attribution", FlaskConical],
  ["sources", "Data Sources", Database],
  ["semantic", "Semantic Layer", Layers],
  ["feedback", "Feedback Loop", MessageSquare],
  ["health", "System Health", Server],
];

const PIPELINE = [
  "Fetching KPI data", "Reconciling source systems", "Checking data freshness",
  "Detecting material movements", "Running contribution analysis",
  "Testing explanatory drivers", "Calculating confidence",
  "Generating persona narrative", "Validating recommendation",
];

export default function App() {
  const [meta, setMeta] = useState<any>(null);
  const [scenario, setScenario] = useState("revenue_decline");
  const [role, setRole] = useState("executive");
  const [page, setPage] = useState("overview");
  const [ins, setIns] = useState<Insight | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>();

  useEffect(() => {
    getScenarios()
      .then(setMeta)
      .catch((e) => setErr(String(e?.message || e)));
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      await login(role);
      const opts = scenario === "new_product" ? { product_id: "EL-3" } : {};
      const data = await getInsight(scenario, opts);
      setIns(data);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [scenario, role]);

  const runAnalysis = () => {
    setRunning(true);
    setStep(0);
    setPage("overview");
    let s = 0;
    const iv = setInterval(() => {
      s += 1;
      setStep(s);
      if (s >= PIPELINE.length) {
        clearInterval(iv);
        setTimeout(() => {
          setRunning(false);
          load();
        }, 250);
      }
    }, 140);
  };

  const onClarify = (q: string) => {
    setChatSeed(q);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50/80 font-sans text-zinc-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-200">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-zinc-900">NovaMart Intelligence</div>
              <div className="text-xs font-medium text-zinc-400">KPI Intelligence-to-Action Engine</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-1.5">
              <span className="pl-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Scenario</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="rounded-lg border border-zinc-300/80 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {meta?.scenarios ? (
                  meta.scenarios.map((s: any) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="revenue_decline">Revenue Decline</option>
                    <option value="revenue_growth">Revenue Growth</option>
                    <option value="contradictory">Contradictory Evidence</option>
                    <option value="new_product">New Product / Sparse History</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-1.5">
              <span className="pl-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg border border-zinc-300/80 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {meta?.roles ? (
                  meta.roles.map((r: any) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="executive">Executive</option>
                    <option value="marketing">Marketing Manager</option>
                    <option value="operations">Operations Manager</option>
                    <option value="analyst">Analyst</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2 pl-2">
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 hover:text-zinc-900 transition-all"
              >
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <span>Chat</span>
              </button>

              <button
                onClick={runAnalysis}
                disabled={running || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-60 transition-all"
              >
                <Play className={`h-3.5 w-3.5 fill-current ${running ? "animate-spin" : ""}`} />
                <span>{running ? "Analyzing…" : "Run Intelligence Analysis"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex max-w-7xl">
        {/* Left Desktop Navigation Sidebar */}
        <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-60 shrink-0 border-r border-zinc-200/80 p-4 space-y-4 overflow-y-auto md:block">
          <nav className="space-y-1">
            {NAV.map(([key, label, Icon]) => {
              const active = page === key;
              return (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-100"
                      : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-white" : "text-zinc-400"}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {ins && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>{ins.role.label}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{ins.role.note}</p>
            </div>
          )}

          <div className="rounded-2xl border border-violet-200/80 bg-violet-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800">
              <Lock className="h-4 w-4 text-violet-600" />
              <span>Quant / LLM Split</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-violet-700/80">
              All numbers computed server-side in Python. The LLM only writes prose, validated against evidence.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {/* Mobile Horizontal Navigation Scrollbar */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
            {NAV.map(([key, label, Icon]) => {
              const active = page === key;
              return (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ${
                    active
                      ? "bg-indigo-600 text-white font-semibold"
                      : "border border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Error Alert Box */}
          {err && (
            <Card className="mb-5 border-rose-200 bg-rose-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-rose-900">API Connection Issue</h3>
                  <p className="mt-0.5 text-xs text-rose-700/90">{err}</p>
                  <p className="mt-2 font-mono text-xs text-zinc-600">
                    If running locally, start backend via: <code className="rounded bg-rose-100/80 px-1 py-0.5 font-bold">uvicorn app.main:app --reload --port 8000</code>
                  </p>
                </div>
                <button
                  onClick={load}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-800 shadow-xs hover:bg-rose-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            </Card>
          )}

          {/* Loading Skeleton */}
          {loading && !ins && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium text-zinc-500">Computing deterministic KPI metrics…</span>
              </div>
            </Card>
          )}

          {/* Views */}
          {!loading && ins && page === "overview" && (
            <Overview ins={ins} onOpen={() => setPage("insight")} onClarify={onClarify} />
          )}
          {!loading && ins && page === "insight" && <InsightPage ins={ins} onClarify={onClarify} />}
          {page === "drivers" && <DriversPage scenario={scenario} />}
          {page === "sources" && <SourcesPage scenario={scenario} />}
          {page === "semantic" && <SemanticPage />}
          {page === "feedback" && <FeedbackPage scenario={scenario} />}
          {page === "health" && <HealthPage />}

          {/* Footer Telemetry Stamp */}
          {ins && (
            <footer className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-200/60 pt-4 text-center text-xs font-medium text-zinc-400">
              <span>Seeded, reproducible dataset</span>
              <span>•</span>
              <span>{meta?.scenarios?.find((s: any) => s.key === scenario)?.intent || scenario}</span>
              <span>•</span>
              <span className="font-mono text-zinc-500">{ins.telemetry.latency_ms}ms {ins.telemetry.cache_hit ? "(cached)" : ""}</span>
              <span>•</span>
              <span>narrative: <strong className="text-zinc-600">{ins.narrative.provider}</strong></span>
            </footer>
          )}
        </main>

        {/* Chat Drawer */}
        {chatOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md shadow-2xl">
            <ChatPanel
              scenario={scenario}
              seed={chatSeed}
              onClose={() => {
                setChatOpen(false);
                setChatSeed(undefined);
              }}
            />
          </div>
        )}
      </div>

      {/* Analysis Running Progress Modal */}
      {running && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <BrainCircuit className="h-5 w-5 text-indigo-600 animate-pulse" />
              <span>Running Intelligence Pipeline</span>
            </div>
            <div className="mt-5 space-y-2.5">
              {PIPELINE.map((label, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-medium">
                  <div
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      i < step
                        ? "bg-emerald-500 ring-2 ring-emerald-100"
                        : i === step
                        ? "bg-indigo-600 ring-4 ring-indigo-100 animate-pulse"
                        : "bg-zinc-200"
                    }`}
                  />
                  <span className={i > step ? "text-zinc-400" : i === step ? "font-bold text-indigo-700" : "text-zinc-700"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
