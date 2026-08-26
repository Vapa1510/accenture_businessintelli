import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { money, signPct } from "../api";

export const ACCENT = "#4f46e5";
export const UP = "#059669";
export const DOWN = "#e11d48";
export const WARN = "#d97706";
export const NEU = "#64748b";
export const BAND: Record<string, string> = { high: UP, medium: WARN, low: DOWN };

const TONE: Record<string, string> = {
  red: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export const priorityTone = (p: string) => (p === "HIGH" ? "red" : p === "MEDIUM" ? "amber" : "slate");
export const bandTone = (b: string) => (b === "high" ? "green" : b === "medium" ? "amber" : "red");

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${pad ? "p-4" : ""} ${className}`}>{children}</div>;
}

export function Badge({ tone = "slate", children, className = "" }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${TONE[tone]} ${className}`}>{children}</span>;
}

export function Eyebrow({ children, icon: Icon }: { children: ReactNode; icon?: any }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-sm text-zinc-500">{k}</span>
      <span className="text-right text-sm font-medium text-zinc-900">{children}</span>
    </div>
  );
}

export function Delta({ v }: { v: number }) {
  const up = v >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 font-medium tabular-nums" style={{ color: up ? UP : DOWN }}>
      <Icon className="h-3.5 w-3.5" />
      {signPct(v)}
    </span>
  );
}

export function ContribBars({ rows }: { rows: { label: string; value: number; pct?: number; color?: string }[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-36 shrink-0 truncate text-zinc-500" title={r.label}>{r.label}</div>
          <div className="relative h-6 flex-1 rounded bg-zinc-50">
            <div className="absolute inset-y-0 left-0 rounded"
                 style={{ width: `${Math.max(2, (Math.abs(r.value) / max) * 100)}%`,
                          backgroundColor: r.color || (r.value < 0 ? DOWN : UP), opacity: 0.85 }} />
            <div className="absolute inset-0 flex items-center justify-end pr-2">
              <span className="text-xs font-medium tabular-nums text-zinc-700">{money(r.value)}</span>
            </div>
          </div>
          {r.pct != null && <div className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-400">{r.pct}%</div>}
        </div>
      ))}
    </div>
  );
}

export function ConfidenceMeter({ score, band }: { score: number; band: string }) {
  const p = Math.round(score * 100);
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums" style={{ color: BAND[band] }}>{p}%</span>
        <Badge tone={bandTone(band)}>{band} confidence</Badge>
      </div>
      <div className="relative mt-2 h-2.5 w-full rounded-full bg-zinc-100">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${p}%`, backgroundColor: BAND[band] }} />
        <div className="absolute inset-y-0" style={{ left: "60%" }}><div className="h-2.5 w-px" style={{ background: NEU }} /></div>
        <div className="absolute inset-y-0" style={{ left: "80%" }}><div className="h-2.5 w-px" style={{ background: NEU }} /></div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>0</span><span>abstain &lt; 60</span><span>80 &gt; high</span><span>100</span>
      </div>
    </div>
  );
}

const NICE: Record<string, string> = {
  completeness: "Data completeness", freshness: "Data freshness",
  statistical: "Statistical strength", agreement: "Cross-source agreement",
  history: "Historical coverage",
};

export function ScoreRows({ parts }: { parts: Record<string, { w: number; v: number }> }) {
  return (
    <div className="space-y-2">
      {Object.entries(parts).map(([k, p]) => (
        <div key={k} className="flex items-center gap-2 text-sm">
          <div className="w-40 shrink-0 text-zinc-500">{NICE[k] ?? k}</div>
          <div className="h-2 flex-1 rounded-full bg-zinc-100">
            <div className="h-2 rounded-full"
                 style={{ width: `${Math.round(p.v * 100)}%`,
                          backgroundColor: p.v > 0.75 ? UP : p.v >= 0.5 ? WARN : DOWN }} />
          </div>
          <div className="w-16 shrink-0 text-right text-xs tabular-nums text-zinc-400">
            {Math.round(p.v * 100)}% · {Math.round(p.w * 100)}w
          </div>
        </div>
      ))}
    </div>
  );
}
