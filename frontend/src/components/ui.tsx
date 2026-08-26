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
  red: "bg-rose-50 text-rose-700 border-rose-200/80",
  amber: "bg-amber-50 text-amber-700 border-amber-200/80",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  slate: "bg-zinc-100 text-zinc-700 border-zinc-200/80",
  violet: "bg-violet-50 text-violet-700 border-violet-200/80",
};

export const priorityTone = (p: string) => (p === "HIGH" ? "red" : p === "MEDIUM" ? "amber" : "slate");
export const bandTone = (b: string) => (b === "high" ? "green" : b === "medium" ? "amber" : "red");

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <div className={`rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-shadow hover:shadow-md ${pad ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ tone = "slate", children, className = "" }: { tone?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Eyebrow({ children, icon: Icon }: { children: ReactNode; icon?: any }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
      {Icon && <Icon className="h-3.5 w-3.5 text-indigo-500" />}
      <span>{children}</span>
    </div>
  );
}

export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 last:border-0">
      <span className="text-xs font-medium text-zinc-500">{k}</span>
      <span className="text-right text-xs font-semibold text-zinc-900">{children}</span>
    </div>
  );
}

export function Delta({ v }: { v: number }) {
  const up = v >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {signPct(v)}
    </span>
  );
}

export function ContribBars({ rows }: { rows: { label: string; value: number; pct?: number; color?: string }[] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <div className="w-36 shrink-0 truncate font-medium text-zinc-600" title={r.label}>
            {r.label}
          </div>
          <div className="relative h-7 flex-1 rounded-xl bg-zinc-100/70 p-0.5">
            <div
              className="h-full rounded-lg transition-all"
              style={{
                width: `${Math.max(3, (Math.abs(r.value) / max) * 100)}%`,
                backgroundColor: r.color || (r.value < 0 ? DOWN : UP),
                opacity: 0.9,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-2.5">
              <span className="text-xs font-bold tabular-nums text-zinc-900">{money(r.value)}</span>
            </div>
          </div>
          {r.pct != null && <div className="w-12 shrink-0 text-right font-bold tabular-nums text-zinc-400">{r.pct}%</div>}
        </div>
      ))}
    </div>
  );
}

export function ConfidenceMeter({ score, band }: { score: number; band: string }) {
  const p = Math.round(score * 100);
  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        <span className="text-3xl font-extrabold tabular-nums tracking-tight" style={{ color: BAND[band] }}>
          {p}%
        </span>
        <Badge tone={bandTone(band)}>{band} confidence</Badge>
      </div>
      <div className="relative mt-3 h-3 w-full rounded-full bg-zinc-100 p-0.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: BAND[band] }} />
        <div className="absolute top-0 bottom-0" style={{ left: "60%" }}>
          <div className="h-full w-0.5 bg-zinc-300" />
        </div>
        <div className="absolute top-0 bottom-0" style={{ left: "80%" }}>
          <div className="h-full w-0.5 bg-zinc-300" />
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-zinc-400">
        <span>0%</span>
        <span>abstain &lt; 60%</span>
        <span>high &gt; 80%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

const NICE: Record<string, string> = {
  completeness: "Data completeness",
  freshness: "Data freshness",
  statistical: "Statistical strength",
  agreement: "Cross-source agreement",
  history: "Historical coverage",
};

export function ScoreRows({ parts }: { parts: Record<string, { w: number; v: number }> }) {
  return (
    <div className="space-y-2">
      {Object.entries(parts).map(([k, p]) => (
        <div key={k} className="flex items-center gap-3 text-xs">
          <div className="w-40 shrink-0 font-medium text-zinc-500">{NICE[k] ?? k}</div>
          <div className="h-2 flex-1 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.round(p.v * 100)}%`,
                backgroundColor: p.v > 0.75 ? UP : p.v >= 0.5 ? WARN : DOWN,
              }}
            />
          </div>
          <div className="w-20 shrink-0 text-right font-semibold tabular-nums text-zinc-500">
            {Math.round(p.v * 100)}% <span className="font-normal text-zinc-400">({Math.round(p.w * 100)}%w)</span>
          </div>
        </div>
      ))}
    </div>
  );
}
