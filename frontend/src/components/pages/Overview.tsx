import React from "react";
import { ChevronRight, ClipboardList, FlaskConical, Gauge, Lock, Sparkles, ShieldCheck } from "lucide-react";
import {
  ACCENT, Badge, Card, ConfidenceMeter, ContribBars, Delta, DOWN, Eyebrow, KV,
  NEU, ScoreRows, WARN, priorityTone,
} from "../ui";
import { money, moneyExact, num, pct } from "../../api";
import type { Insight } from "../../api";
import { AbstentionPanel } from "./AbstentionPanel";

export const kpiValue = (m: any) =>
  m.unit === "%" ? pct(m.current) : m.unit === "$" ? (m.key === "aov" ? `$${m.current.toFixed(0)}` : money(m.current)) : num(m.current);

export function Overview({ ins, onOpen, onClarify }: { ins: Insight; onOpen: () => void; onClarify: (q: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
        {ins.movements.map((m) => (
          <Card key={m.key} className="p-4">
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs font-semibold text-zinc-500">{m.name}</span>
              <Badge tone={priorityTone(m.priority)}>{m.priority === "HIGH" ? "high impact" : m.priority.toLowerCase()}</Badge>
            </div>
            <div className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-zinc-900">{kpiValue(m)}</div>
            <div className="mt-2 flex items-center justify-between">
              <Delta v={m.pct} />
              <span className="font-mono text-[11px] font-medium text-zinc-400">
                z:{m.z.toFixed(1)} · mat:{m.materiality}
              </span>
            </div>
          </Card>
        ))}
        {ins.restricted_kpis.map((r) => (
          <Card key={r.key} className="p-4 opacity-75 border-dashed">
            <Eyebrow icon={Lock}>{r.name}</Eyebrow>
            <div className="mt-3 text-xs font-medium text-zinc-400">Restricted for {ins.role.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {ins.abstain ? (
            <AbstentionPanel ins={ins} onClarify={onClarify} />
          ) : (
            <Card>
              <div className="flex items-center justify-between">
                <Eyebrow icon={Sparkles}>What changed</Eyebrow>
                <Badge tone={ins.target.pct < 0 ? "red" : "green"}>{ins.target.priority} priority</Badge>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">{ins.narrative.headline}</h2>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-zinc-400">Business impact</div>
                  <div className="mt-0.5 font-mono text-base font-extrabold text-zinc-900">{moneyExact(ins.target.abs)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-zinc-400">vs baseline</div>
                  <div className="mt-0.5 font-mono text-base font-extrabold text-zinc-900">{money(ins.target.baseline)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-zinc-400">Abnormality</div>
                  <div className="mt-0.5 font-mono text-base font-extrabold text-indigo-700">z {ins.target.z.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Top drivers · model-attributed <span className="font-normal normal-case text-zinc-400">(associational)</span>
                </div>
                <ContribBars
                  rows={ins.driver_res.attrib.slice(0, 5).map((a: any) => ({
                    label: a.driver,
                    value: a.effect,
                    pct: a.pct,
                    color: a.raw === "other" ? NEU : undefined,
                  }))}
                />
              </div>
              <button
                onClick={onOpen}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
              >
                <span>Open Full Insight Analysis</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </Card>
          )}

          <Card>
            <Eyebrow icon={ClipboardList}>Material movement ledger</Eyebrow>
            <div className="mt-3.5 space-y-1.5">
              {ins.movements.map((m) => (
                <div key={m.key} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-zinc-50">
                  <Badge tone={priorityTone(m.priority)} className="w-16 justify-center">
                    {m.priority}
                  </Badge>
                  <div className="w-40 text-xs font-bold text-zinc-800">{m.name}</div>
                  <div className="w-16 text-right">
                    <Delta v={m.pct} />
                  </div>
                  <div className="h-2 flex-1 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${m.materiality}%`,
                        backgroundColor: m.priority === "HIGH" ? DOWN : m.priority === "MEDIUM" ? WARN : NEU,
                      }}
                    />
                  </div>
                  <div className="w-10 text-right font-mono text-xs font-bold text-zinc-700">{m.materiality}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] font-medium text-zinc-400 border-t border-zinc-100 pt-2">
              Materiality = 40% impact + 30% deviation + 20% abnormality + 10% strategic weight. Computed server-side.
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Eyebrow icon={Gauge}>Confidence</Eyebrow>
            <div className="mt-3">
              <ConfidenceMeter score={ins.confidence.score} band={ins.confidence.band} />
            </div>
            <div className="mt-4">
              <ScoreRows parts={ins.confidence.parts} />
            </div>
          </Card>

          <Card>
            <Eyebrow icon={FlaskConical}>Detection method</Eyebrow>
            <div className="mt-3">
              <KV k="Method">Z-score + rolling baseline</KV>
              <KV k="Attribution">LMDI + OLS regression</KV>
              <KV k="History">{ins.confidence.history_days} days</KV>
              <KV k="Period">{ins.period}</KV>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
