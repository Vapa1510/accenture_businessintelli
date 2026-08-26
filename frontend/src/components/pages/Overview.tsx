import React from "react";
import { ChevronRight, ClipboardList, FlaskConical, Gauge, Lock, Sparkles } from "lucide-react";
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {ins.movements.map((m) => (
          <Card key={m.key}>
            <div className="flex items-start justify-between">
              <span className="text-sm text-zinc-500">{m.name}</span>
              <Badge tone={priorityTone(m.priority)}>{m.priority === "HIGH" ? "high impact" : m.priority.toLowerCase()}</Badge>
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{kpiValue(m)}</div>
            <div className="mt-1 flex items-center justify-between">
              <Delta v={m.pct} />
              <span className="text-xs tabular-nums text-zinc-400">z {m.z.toFixed(1)} · mat {m.materiality}</span>
            </div>
          </Card>
        ))}
        {ins.restricted_kpis.map((r) => (
          <Card key={r.key} className="opacity-70">
            <Eyebrow icon={Lock}>{r.name}</Eyebrow>
            <div className="mt-3 text-sm text-zinc-400">Restricted for {ins.role.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {ins.abstain ? <AbstentionPanel ins={ins} onClarify={onClarify} /> : (
            <Card>
              <div className="flex items-center justify-between">
                <Eyebrow icon={Sparkles}>What changed</Eyebrow>
                <Badge tone={ins.target.pct < 0 ? "red" : "green"}>{ins.target.priority} priority</Badge>
              </div>
              <h2 className="mt-2 text-xl font-semibold">{ins.narrative.headline}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div><div className="text-xs text-zinc-400">Business impact</div><div className="text-lg font-semibold tabular-nums">{moneyExact(ins.target.abs)}</div></div>
                <div><div className="text-xs text-zinc-400">vs expected baseline</div><div className="text-lg font-semibold tabular-nums">{money(ins.target.baseline)}</div></div>
                <div><div className="text-xs text-zinc-400">Abnormality</div><div className="text-lg font-semibold tabular-nums">z {ins.target.z.toFixed(2)}</div></div>
              </div>
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Top drivers · model-attributed <span className="font-normal normal-case">(associational)</span>
                </div>
                <ContribBars rows={ins.driver_res.attrib.slice(0, 5).map((a: any) => ({
                  label: a.driver, value: a.effect, pct: a.pct,
                  color: a.raw === "other" ? NEU : undefined,
                }))} />
              </div>
              <button onClick={onOpen} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                Open full insight <ChevronRight className="h-4 w-4" />
              </button>
            </Card>
          )}

          <Card>
            <Eyebrow icon={ClipboardList}>Material movement ledger</Eyebrow>
            <div className="mt-3 space-y-1.5">
              {ins.movements.map((m) => (
                <div key={m.key} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-100">
                  <Badge tone={priorityTone(m.priority)} className="w-16 justify-center">{m.priority}</Badge>
                  <div className="w-40 font-medium">{m.name}</div>
                  <div className="w-16 text-right"><Delta v={m.pct} /></div>
                  <div className="h-2 flex-1 rounded-full bg-zinc-100">
                    <div className="h-2 rounded-full" style={{ width: `${m.materiality}%`, backgroundColor: m.priority === "HIGH" ? DOWN : m.priority === "MEDIUM" ? WARN : NEU }} />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold tabular-nums">{m.materiality}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Materiality = 40% impact + 30% deviation + 20% abnormality + 10% strategic weight. Computed server-side.
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Eyebrow icon={Gauge}>Confidence</Eyebrow>
            <div className="mt-3"><ConfidenceMeter score={ins.confidence.score} band={ins.confidence.band} /></div>
            <div className="mt-4"><ScoreRows parts={ins.confidence.parts} /></div>
          </Card>
          <Card>
            <Eyebrow icon={FlaskConical}>Detection method</Eyebrow>
            <div className="mt-2">
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
