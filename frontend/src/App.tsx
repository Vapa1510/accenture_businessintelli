import { useEffect, useState } from "react";
import {
  Activity, BrainCircuit, Database, FlaskConical, Layers, Lock, MessageSquare,
  Play, Server, ShieldCheck, Sparkles,
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
  ["insight", "Insight", Sparkles],
  ["drivers", "Drivers", FlaskConical],
  ["sources", "Data Sources", Database],
  ["semantic", "Semantic Layer", Layers],
  ["feedback", "Feedback", MessageSquare],
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
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>();

  useEffect(() => { getScenarios().then(setMeta).catch((e) => setErr(String(e))); }, []);

  const load = async () => {
    try {
      setErr(null);
      await login(role);
      const opts = scenario === "new_product" ? { product_id: "EL-3" } : {};
      setIns(await getInsight(scenario, opts));
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scenario, role]);

  const runAnalysis = () => {
    setRunning(true); setStep(0); setPage("overview");
    let s = 0;
    const iv = setInterval(() => {
      s += 1; setStep(s);
      if (s >= PIPELINE.length) { clearInterval(iv); setTimeout(() => { setRunning(false); load(); }, 250); }
    }, 140);
  };

  const onClarify = (q: string) => { setChatSeed(q); setChatOpen(true); };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ maxWidth: 1400 }}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-600 p-1.5"><BrainCircuit className="h-4 w-4 text-white" /></div>
            <div>
              <div className="text-sm font-semibold leading-tight">NovaMart Intelligence</div>
              <div className="text-xs leading-tight text-zinc-400">Intelligence-to-Action Engine</div>
            </div>
          </div>

          <div className="ml-2 flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">Scenario</span>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 text-sm">
              {meta?.scenarios.map((s: any) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 text-sm">
              {meta?.roles.map((r: any) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setChatOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100">
              <MessageSquare className="h-4 w-4" />Chat
            </button>
            <button onClick={runAnalysis} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              <Play className="h-4 w-4" />{running ? "Analyzing…" : "Run Intelligence Analysis"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex" style={{ maxWidth: 1400 }}>
        <aside className="sticky hidden w-52 shrink-0 border-r border-zinc-200 px-3 py-4 md:block" style={{ top: 57, height: "calc(100vh - 57px)" }}>
          <nav className="space-y-0.5">
            {NAV.map(([key, label, Icon]) => (
              <button key={key} onClick={() => setPage(key)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${page === key ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>
          {ins && (
            <div className="mt-4 rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold"><ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />{ins.role.label}</div>
              <div className="mt-1 text-xs text-zinc-400">{ins.role.note}</div>
            </div>
          )}
          <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700"><Lock className="h-3.5 w-3.5" />Quant / LLM split</div>
            <div className="mt-1 text-xs text-violet-600">All numbers computed server-side in Python. The LLM only writes prose, validated against evidence.</div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4">
          <div className="mb-3 flex gap-1 overflow-x-auto md:hidden">
            {NAV.map(([key, label, Icon]) => (
              <button key={key} onClick={() => setPage(key)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${page === key ? "bg-indigo-600 text-white" : "border border-zinc-200 text-zinc-500"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {err && (
            <Card className="mb-3 border-rose-300">
              <div className="text-sm font-medium text-rose-700">Cannot reach the API</div>
              <div className="mt-1 text-sm text-zinc-500">{err}</div>
              <div className="mt-2 font-mono text-xs text-zinc-500">Start it with: uvicorn app.main:app --reload --port 8000</div>
            </Card>
          )}

          {!ins && !err && <Card><div className="text-sm text-zinc-500">Loading insight…</div></Card>}

          {ins && page === "overview" && <Overview ins={ins} onOpen={() => setPage("insight")} onClarify={onClarify} />}
          {ins && page === "insight" && <InsightPage ins={ins} onClarify={onClarify} />}
          {page === "drivers" && <DriversPage scenario={scenario} />}
          {page === "sources" && <SourcesPage scenario={scenario} />}
          {page === "semantic" && <SemanticPage />}
          {page === "feedback" && <FeedbackPage scenario={scenario} />}
          {page === "health" && <HealthPage />}

          {ins && (
            <div className="mt-6 text-center text-xs text-zinc-400">
              Seeded, reproducible dataset · {meta?.scenarios.find((s: any) => s.key === scenario)?.intent} ·
              {" "}{ins.telemetry.latency_ms}ms {ins.telemetry.cache_hit ? "(cached)" : ""} · narrative: {ins.narrative.provider}
            </div>
          )}
        </main>

        {chatOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md">
            <ChatPanel scenario={scenario} seed={chatSeed} onClose={() => { setChatOpen(false); setChatSeed(undefined); }} />
          </div>
        )}
      </div>

      {running && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="font-semibold">Running intelligence pipeline</div>
            <div className="mt-4 space-y-2">
              {PIPELINE.map((label, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <div className={`h-2 w-2 rounded-full ${i < step ? "bg-emerald-500" : i === step ? "bg-indigo-500" : "bg-zinc-200"}`} />
                  <span className={i > step ? "text-zinc-400" : ""}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
