const LOCAL_BASE = import.meta.env.VITE_API_URL || "";
const REMOTE_FALLBACK = "https://kpi-engine.vercel.app";
let activeBase = LOCAL_BASE;

export type Movement = {
  key: string; name: string; unit: string; current: number; previous: number;
  abs: number; pct: number; baseline: number; z: number; materiality: number;
  priority: "HIGH" | "MEDIUM" | "LOW"; significant: boolean;
};

export type Attrib = {
  driver: string; raw: string; effect: number; beta_std: number | null;
  pval: number | null; direction: string; significant: boolean | null; pct: number;
};

export type Evidence = {
  id: string; claim: string; source: string; dataset: string; method: string;
  result: string; period: string; confidence: number;
};

export type Recommendation = {
  driver: string; lever: string; action: string; impact: string; owner: string;
  approval_type: string; monitoring: string; can_approve: boolean;
};

export type Narrative = {
  abstain: boolean; provider: string; headline: string; paragraphs: string[];
  recommendation: Recommendation | null; causal: string;
};

export type Insight = {
  scenario: string; kpi: string; period: string;
  movements: Movement[]; restricted_kpis: { key: string; name: string }[];
  target: Movement;
  lmdi: { d_r: number; orders_effect: number; aov_effect: number; check: number };
  driver_res: { attrib: Attrib[]; r2: number; n: number; d_r: number };
  rules: { fired: { code: string; label: string; detail: string }[]; stockout: number | null; comp: number | null; spend_drop: number };
  confidence: { score: number; band: "high" | "medium" | "low"; parts: Record<string, { w: number; v: number }>; history_days: number };
  hypotheses: { name: string; conf: number }[];
  region_contrib: { level: string; contribution: number }[];
  cat_contrib: { level: string; contribution: number }[];
  evidence: Evidence[];
  abstain: boolean; abstain_kind: string | null; reasons: string[]; clarifications: string[];
  sources: Record<string, any>;
  narrative: Narrative;
  validation: { numeric: boolean; causal: boolean; checks: { label: string; pass: boolean; detail: string }[] };
  role: { key: string; label: string; note: string; customer_data: boolean };
  telemetry: { latency_ms: number; cache_hit: boolean; cache_backend: string; llm_used: boolean; provider: string };
  customer_data_allowed: boolean;
};

let token: string | null = null;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as any) };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${activeBase}${path}`, { ...init, headers });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  } catch (err: any) {
    if (activeBase !== REMOTE_FALLBACK) {
      try {
        const fallbackRes = await fetch(`${REMOTE_FALLBACK}${path}`, { ...init, headers });
        if (fallbackRes.ok) {
          activeBase = REMOTE_FALLBACK;
          return fallbackRes.json();
        }
      } catch (_) {}
    }
    throw err;
  }
}

export async function login(role: string) {
  const body = new URLSearchParams({ username: role, password: role });
  try {
    const res = await fetch(`${activeBase}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (res.ok) {
      const d = await res.json();
      token = d.access_token;
      return d;
    }
  } catch (_) {}

  // Fallback to remote Vercel API if local server is down or unreachable
  if (activeBase !== REMOTE_FALLBACK) {
    activeBase = REMOTE_FALLBACK;
    return login(role);
  }
  throw new Error("login failed");
}

export const getScenarios = () => req<any>("/api/scenarios");
export const getSemantic = () => req<any>("/api/semantic");
export const getSources = (scenario: string) => req<any>(`/api/sources?scenario=${scenario}`);
export const getHealth = () => req<any>("/api/health");
export const getFeedback = () => req<any>("/api/feedback");

export function getInsight(scenario: string, opts: { product_id?: string; region?: string; live?: boolean } = {}) {
  const q = new URLSearchParams({ scenario });
  if (opts.product_id) q.set("product_id", opts.product_id);
  if (opts.region) q.set("region", opts.region);
  if (opts.live) q.set("live", "true");
  return req<Insight>(`/api/insight?${q}`);
}

export function getDrivers(scenario: string, dim = "region", region?: string, category?: string) {
  const q = new URLSearchParams({ scenario, dim });
  if (region) q.set("region", region);
  if (category) q.set("category", category);
  return req<any>(`/api/drivers?${q}`);
}

export const postChat = (question: string, scenario: string) =>
  req<any>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, scenario }),
  });

export const postFeedback = (payload: Record<string, unknown>) =>
  req<any>("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const money = (x: number) => {
  const s = x < 0 ? "-" : "";
  const a = Math.abs(x);
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
};
export const moneyExact = (x: number) =>
  `${x < 0 ? "-" : ""}$${Math.abs(x).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;
export const signPct = (x: number, dp = 1) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(dp)}%`;
export const num = (x: number) => Math.round(x).toLocaleString("en-US");
