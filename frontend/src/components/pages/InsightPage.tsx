import React from "react";
import { BadgeCheck, BrainCircuit, Check, ClipboardList, Database, FlaskConical, GitBranch, HelpCircle, Layers, ShieldCheck, Sparkles, Target, X, Boxes, Gauge } from "lucide-react";
import { ACCENT, Badge, Card, ConfidenceMeter, ContribBars, Eyebrow, KV, NEU, ScoreRows } from "../ui";
import { moneyExact } from "../../api";
import type { Insight } from "../../api";
import { AbstentionPanel } from "./AbstentionPanel";

export function InsightPage({ ins, onClarify }: { ins: Insight; onClarify: (q: string) => void }) {
  const rec = ins.narrative.recommendation;
  const lineage: [string, string, any][] = [
    ["KPI definition", "SUM(revenue)", Target],
    ["Source tables", "transactions · marketing · external", Database],
    ["Statistical method", "z-score · LMDI · OLS", FlaskConical],
    ["Evidence", `${ins.evidence.length} objects`, ClipboardList],
    ["Narrative", `${ins.narrative.provider} · evidence-bound`, BrainCircuit],
    ["Recommendation", rec ? rec.action : "withheld (insufficient evidence)", ShieldCheck],
  ];

  return (
    <div className="space-y-4">
      {ins.abstain ? <AbstentionPanel ins={ins} onClarify={onClarify} /> : (
        <Card>
          <div className="flex items-center justify-between">
            <Eyebrow icon={Sparkles}>Insight summary</Eyebrow>
            <Badge tone={ins.validation.numeric && ins.validation.causal ? "green" : "red"}>
              <BadgeCheck className="h-3.5 w-3.5" />
              {ins.validation.numeric && ins.validation.causal ? "Output validated" : "Validation failed"}
            </Badge>
          </div>
          <h2 className="mt-2 text-xl font-semibold">{ins.narrative.headline}</h2>
          {ins.narrative.paragraphs.map((p, i) => <p key={i} className="mt-2 text-sm leading-relaxed text-zinc-500">{p}</p>)}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="violet"><GitBranch className="h-3.5 w-3.5" />associational, not causal</Badge>
            {ins.validation.checks.map((c, i) => (
              <Badge key={i} tone={c.pass ? "green" : "red"}>{c.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{c.label}</Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <Eyebrow icon={Layers}>Factor split — LMDI (exact)</Eyebrow>
              <p className="mt-1 text-xs text-zinc-400">Revenue = Orders × AOV. Effects sum exactly to the change.</p>
              <div className="mt-3">
                <ContribBars rows={[
                  { label: "Orders effect", value: ins.lmdi.orders_effect },
                  { label: "AOV effect", value: ins.lmdi.aov_effect },
                ]} />
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-sm">
                <span className="text-zinc-500">Total ΔRevenue</span>
                <span className="font-semibold tabular-nums">{moneyExact(ins.lmdi.d_r)}</span>
              </div>
            </Card>
            <Card>
              <Eyebrow icon={Boxes}>By region</Eyebrow>
              <div className="mt-3">
                <ContribBars rows={ins.region_contrib.map((r) => ({ label: r.level, value: r.contribution }))} />
              </div>
            </Card>
          </div>

          <Card>
            <Eyebrow icon={HelpCircle}>Alternative hypotheses</Eyebrow>
            <p className="mt-1 text-xs text-zinc-400">Competing explanations are ranked, not hidden.</p>
            <div className="mt-3 space-y-2">
              {ins.hypotheses.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Badge tone={i === 0 ? "indigo" : "slate"} className="w-20 justify-center">{i === 0 ? "primary" : "alt"}</Badge>
                  <div className="flex-1 text-sm">{h.name}</div>
                  <div className="h-2 w-28 rounded-full bg-zinc-100">
                    <div className="h-2 rounded-full" style={{ width: `${h.conf * 100}%`, backgroundColor: i === 0 ? ACCENT : NEU }} />
                  </div>
                  <div className="w-10 text-right text-sm font-medium tabular-nums">{Math.round(h.conf * 100)}%</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Eyebrow icon={ClipboardList}>Evidence · {ins.evidence.length} traceable claims</Eyebrow>
            <div className="mt-3 divide-y divide-zinc-200">
              {ins.evidence.map((e) => (
                <div key={e.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-700">{e.id}</span>
                    <span className="text-sm font-medium">{e.claim}</span>
                    <Badge tone={e.confidence > 0.8 ? "green" : e.confidence >= 0.6 ? "amber" : "red"} className="ml-auto">conf {e.confidence.toFixed(2)}</Badge>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 text-xs text-zinc-400 md:grid-cols-4">
                    <span>Source: <span className="text-zinc-500">{e.source}</span></span>
                    <span>Method: <span className="text-zinc-500">{e.method}</span></span>
                    <span>Result: <span className="text-zinc-500">{e.result}</span></span>
                    <span>Period: <span className="text-zinc-500">{e.period}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Eyebrow icon={Gauge}>Confidence breakdown</Eyebrow>
            <div className="mt-3"><ConfidenceMeter score={ins.confidence.score} band={ins.confidence.band} /></div>
            <div className="mt-4"><ScoreRows parts={ins.confidence.parts} /></div>
          </Card>

          <Card>
            <Eyebrow icon={Target}>Recommended action</Eyebrow>
            {rec ? (
              <>
                <div className="mt-3 space-y-2">
                  <KV k="Driver">{rec.driver}</KV>
                  <KV k="Controllable lever">{rec.lever}</KV>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Action</div>
                    <div className="mt-0.5 text-sm">{rec.action}</div>
                  </div>
                  <KV k="Expected impact">{rec.impact}</KV>
                  <KV k="Owner">{rec.owner}</KV>
                  <KV k="Monitoring">{rec.monitoring}</KV>
                </div>
                <div className="mt-3">
                  {rec.can_approve
                    ? <button className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Approve as {ins.role.label}</button>
                    : <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-center text-sm font-medium text-amber-700">Outside your rights — escalate to {rec.owner}</div>}
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
                Withheld. No action is recommended when evidence is insufficient.
              </div>
            )}
          </Card>

          <Card>
            <Eyebrow icon={GitBranch}>Lineage</Eyebrow>
            <div className="mt-3">
              {lineage.map(([label, val, Icon], i) => (
                <div key={i} className="relative pl-6">
                  {i < lineage.length - 1 && <div className="absolute left-2.5 top-5 h-full w-px bg-zinc-200" />}
                  <div className="absolute left-0 top-1 rounded-md bg-indigo-50 p-1 text-indigo-600"><Icon className="h-3 w-3" /></div>
                  <div className="text-xs font-medium">{label}</div>
                  <div className="mb-3 break-words font-mono text-xs text-zinc-400">{val}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
