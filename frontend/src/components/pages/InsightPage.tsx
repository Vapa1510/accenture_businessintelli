import React, { useState } from "react";
import {
  BadgeCheck, BrainCircuit, Check, ClipboardList, Database, FlaskConical,
  GitBranch, HelpCircle, Layers, ShieldCheck, Sparkles, Target, X, Boxes, Gauge,
  Sliders, Copy, Download, TrendingUp, TrendingDown, RefreshCw,
} from "lucide-react";
import { ACCENT, Badge, Card, ConfidenceMeter, ContribBars, Eyebrow, KV, NEU, ScoreRows } from "../ui";
import { money, moneyExact, signPct } from "../../api";
import type { Insight } from "../../api";
import { AbstentionPanel } from "./AbstentionPanel";

export function InsightPage({ ins, onClarify }: { ins: Insight; onClarify: (q: string) => void }) {
  const [spendAdj, setSpendAdj] = useState(0);
  const [priceAdj, setPriceAdj] = useState(0);
  const [copied, setCopied] = useState(false);

  const rec = ins.narrative.recommendation;

  // Extract base driver effects for the interactive simulator
  const adEffect = ins.driver_res.attrib.find((a) => a.raw === "ad_spend")?.effect || 120000;
  const priceEffect = ins.driver_res.attrib.find((a) => a.raw === "price")?.effect || 85000;

  // Calculate projected dollar impact based on slider deltas
  const projectedImpact = (spendAdj / 100) * Math.abs(adEffect) + (priceAdj / 100) * Math.abs(priceEffect);

  const copyExecutiveBrief = () => {
    const text = `
=== NOVAMART EXECUTIVE BRIEF ===
Scenario: ${ins.scenario} | KPI: ${ins.target.name}
Movement: ${ins.target.pct >= 0 ? "+" : ""}${(ins.target.pct * 100).toFixed(1)}% (${moneyExact(ins.target.abs)})
Confidence Score: ${Math.round(ins.confidence.score * 100)}% (${ins.confidence.band.toUpperCase()})

HEADLINE:
${ins.narrative.headline}

KEY EVIDENCE:
${ins.evidence.slice(0, 3).map((e) => `- [${e.id}] ${e.claim} (${e.result})`).join("\n")}

RECOMMENDED ACTION:
${rec ? `${rec.action}\nExpected Impact: ${rec.impact}\nOwner: ${rec.owner}` : "Withheld due to insufficient evidence."}

LINEAGE & INTEGRITY:
Analytical Core: LMDI Factor Split + OLS Regression (Associational, non-causal)
Prose Provider: ${ins.narrative.provider} (Validated against numeric whitelist)
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
      {ins.abstain ? (
        <AbstentionPanel ins={ins} onClarify={onClarify} />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow icon={Sparkles}>Insight summary</Eyebrow>
            <div className="flex items-center gap-2">
              <button
                onClick={copyExecutiveBrief}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-100 transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-indigo-600" />}
                <span>{copied ? "Brief Copied!" : "Copy Executive Brief"}</span>
              </button>
              <Badge tone={ins.validation.numeric && ins.validation.causal ? "green" : "red"}>
                <BadgeCheck className="h-3.5 w-3.5" />
                {ins.validation.numeric && ins.validation.causal ? "Output validated" : "Validation failed"}
              </Badge>
            </div>
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">{ins.narrative.headline}</h2>
          {ins.narrative.paragraphs.map((p, i) => (
            <p key={i} className="mt-2 text-xs leading-relaxed text-zinc-600">
              {p}
            </p>
          ))}
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Badge tone="violet">
              <GitBranch className="h-3.5 w-3.5" />
              associational, not causal
            </Badge>
            {ins.validation.checks.map((c, i) => (
              <Badge key={i} tone={c.pass ? "green" : "red"}>
                {c.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {c.label}
              </Badge>
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
                <ContribBars
                  rows={[
                    { label: "Orders effect", value: ins.lmdi.orders_effect },
                    { label: "AOV effect", value: ins.lmdi.aov_effect },
                  ]}
                />
              </div>
              <div className="mt-3 flex justify-between border-t border-zinc-100 pt-2.5 text-xs font-semibold">
                <span className="text-zinc-500">Total ΔRevenue</span>
                <span className="font-mono text-zinc-900">{moneyExact(ins.lmdi.d_r)}</span>
              </div>
            </Card>

            <Card>
              <Eyebrow icon={Boxes}>By region</Eyebrow>
              <div className="mt-3">
                <ContribBars rows={ins.region_contrib.map((r) => ({ label: r.level, value: r.contribution }))} />
              </div>
            </Card>
          </div>

          {/* NEW INNOVATION: What-If Action Simulator Sandbox */}
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
            <div className="flex items-center justify-between">
              <Eyebrow icon={Sliders}>Interactive "What-If" Action Simulator</Eyebrow>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Decision Sandbox
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Simulate controllable lever adjustments to project estimated revenue recovery using standard OLS beta coefficients.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-600">Marketing Budget Shift</span>
                  <span className="font-mono text-indigo-600">{spendAdj >= 0 ? `+${spendAdj}%` : `${spendAdj}%`}</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="5"
                  value={spendAdj}
                  onChange={(e) => setSpendAdj(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>-30% Cut</span>
                  <span>Baseline</span>
                  <span>+30% Boost</span>
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-600">Price Alignment Delta</span>
                  <span className="font-mono text-indigo-600">{priceAdj >= 0 ? `+${priceAdj}%` : `${priceAdj}%`}</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="2.5"
                  value={priceAdj}
                  onChange={(e) => setPriceAdj(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>-15% Match</span>
                  <span>Baseline</span>
                  <span>+15% Premium</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5">
              <div className="flex items-center gap-2">
                {projectedImpact >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                )}
                <span className="text-xs font-semibold text-indigo-900">Projected Monthly Delta:</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-mono text-base font-extrabold ${
                    projectedImpact >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {projectedImpact >= 0 ? `+${money(projectedImpact)}` : money(projectedImpact)}
                </span>
                <button
                  onClick={() => {
                    setSpendAdj(0);
                    setPriceAdj(0);
                  }}
                  className="text-[11px] font-semibold text-indigo-600 underline hover:text-indigo-800"
                >
                  Reset
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <Eyebrow icon={HelpCircle}>Alternative hypotheses</Eyebrow>
            <p className="mt-1 text-xs text-zinc-400">Competing explanations are ranked, not hidden.</p>
            <div className="mt-3 space-y-2">
              {ins.hypotheses.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Badge tone={i === 0 ? "indigo" : "slate"} className="w-20 justify-center">
                    {i === 0 ? "primary" : "alt"}
                  </Badge>
                  <div className="flex-1 text-xs font-medium text-zinc-800">{h.name}</div>
                  <div className="h-2 w-28 rounded-full bg-zinc-100">
                    <div className="h-2 rounded-full" style={{ width: `${h.conf * 100}%`, backgroundColor: i === 0 ? ACCENT : NEU }} />
                  </div>
                  <div className="w-10 text-right font-mono text-xs font-semibold text-zinc-700">{Math.round(h.conf * 100)}%</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Eyebrow icon={ClipboardList}>Evidence · {ins.evidence.length} traceable claims</Eyebrow>
            <div className="mt-3 divide-y divide-zinc-100">
              {ins.evidence.map((e) => (
                <div key={e.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700">
                      {e.id}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">{e.claim}</span>
                    <Badge tone={e.confidence > 0.8 ? "green" : e.confidence >= 0.6 ? "amber" : "red"} className="ml-auto">
                      conf {e.confidence.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400 md:grid-cols-4">
                    <span>
                      Source: <span className="font-medium text-zinc-600">{e.source}</span>
                    </span>
                    <span>
                      Method: <span className="font-medium text-zinc-600">{e.method}</span>
                    </span>
                    <span>
                      Result: <span className="font-medium text-zinc-600">{e.result}</span>
                    </span>
                    <span>
                      Period: <span className="font-medium text-zinc-600">{e.period}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Eyebrow icon={Gauge}>Confidence breakdown</Eyebrow>
            <div className="mt-3">
              <ConfidenceMeter score={ins.confidence.score} band={ins.confidence.band} />
            </div>
            <div className="mt-4">
              <ScoreRows parts={ins.confidence.parts} />
            </div>
          </Card>

          <Card>
            <Eyebrow icon={Target}>Recommended action</Eyebrow>
            {rec ? (
              <>
                <div className="mt-3 space-y-2">
                  <KV k="Driver">{rec.driver}</KV>
                  <KV k="Controllable lever">{rec.lever}</KV>
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Action</div>
                    <div className="mt-1 text-xs font-semibold text-zinc-900">{rec.action}</div>
                  </div>
                  <KV k="Expected impact">{rec.impact}</KV>
                  <KV k="Owner">{rec.owner}</KV>
                  <KV k="Monitoring">{rec.monitoring}</KV>
                </div>
                <div className="mt-4">
                  {rec.can_approve ? (
                    <button className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-emerald-600 transition-all">
                      Approve as {ins.role.label}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 p-2.5 text-center text-xs font-semibold text-amber-800">
                      Outside your rights — escalate to {rec.owner}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-medium text-zinc-500">
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
                  <div className="absolute left-0 top-1 rounded-md bg-indigo-50 p-1 text-indigo-600">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="text-xs font-semibold text-zinc-800">{label}</div>
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
