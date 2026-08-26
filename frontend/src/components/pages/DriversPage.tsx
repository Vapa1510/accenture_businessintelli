import React, { useState, useEffect } from "react";
import { Activity, Check, ChevronRight, FlaskConical, Info, Layers, Lock, ShieldCheck, Zap } from "lucide-react";
import { ACCENT, Badge, Card, DOWN, Eyebrow } from "../ui";
import { getDrivers, money, pct, signPct } from "../../api";

export function DriversPage({ scenario }: { scenario: string }) {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<{ region?: string; category?: string }>({});
  const dim = !path.region ? "region" : !path.category ? "category" : "product";

  const load = () => {
    setError(null);
    getDrivers(scenario, dim, path.region, path.category)
      .then(setD)
      .catch((e) => { setError(String(e?.message || e)); });
  };

  useEffect(() => { load(); }, [scenario, dim, path.region, path.category]);

  if (error) return (
    <Card>
      <div className="text-sm text-rose-600">Error loading drivers: {error}</div>
      <button onClick={load} className="mt-2 rounded bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">Retry</button>
    </Card>
  );

  if (!d) return <Card><div className="text-sm text-zinc-500">Loading drivers…</div></Card>;
  const drivers = d.regression.attrib.filter((a: any) => a.raw !== "other");
  const maxB = Math.max(...drivers.map((x: any) => Math.abs(x.beta_std || 0)), 1e-6);
  const sig = (p: number) => (p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "ns");
  const crumbs: [string, any][] = [["Revenue", {}]];
  if (path.region) crumbs.push([path.region, { region: path.region }]);
  if (path.category) crumbs.push([path.category, { region: path.region, category: path.category }]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700">
        <Info className="h-4 w-4" />Regression below is <b className="mx-1">associational — not causal proof</b>. Rules and correlations are kept distinct.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <Eyebrow icon={FlaskConical}>Multi-factor regression · OLS (statsmodels)</Eyebrow>
          <p className="mt-1 text-xs text-zinc-400">R²={d.regression.r2.toFixed(3)}, n={d.regression.n}</p>
          <div className="mt-3">
            <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <div className="col-span-4">Driver</div><div className="col-span-3">Strength |β|</div>
              <div className="col-span-2 text-center">Dir</div><div className="col-span-3 text-right">Significance</div>
            </div>
            {drivers.map((x: any, i: number) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 border-b border-zinc-200 py-2 text-sm">
                <div className="col-span-4 font-medium">{x.driver}</div>
                <div className="col-span-3"><div className="h-2 rounded-full bg-zinc-100"><div className="h-2 rounded-full" style={{ width: `${(Math.abs(x.beta_std) / maxB) * 100}%`, background: ACCENT }} /></div></div>
                <div className="col-span-2 text-center">{x.direction === "positive" ? <Badge tone="green">+</Badge> : <Badge tone="red">−</Badge>}</div>
                <div className="col-span-3 text-right font-mono text-xs">p={x.pval.toFixed(3)} {sig(x.pval)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Eyebrow icon={Activity}>Correlation · Pearson & Spearman (scipy)</Eyebrow>
          <div className="mt-3">
            <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 pb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <div className="col-span-6">Factor</div><div className="col-span-3 text-right">Pearson r</div><div className="col-span-3 text-right">Spearman ρ</div>
            </div>
            {d.correlations.map((c: any, i: number) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 border-b border-zinc-200 py-2 text-sm">
                <div className="col-span-6">{c.name}</div>
                <div className="col-span-3 text-right font-medium tabular-nums">{c.pearson.toFixed(2)}</div>
                <div className="col-span-3 text-right font-medium tabular-nums">{c.spearman.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <Eyebrow icon={Layers}>Contribution drill-down</Eyebrow>
          <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
            {crumbs.map(([label, p], i) => (
              <span key={i} className="flex items-center gap-1">
                <button onClick={() => setPath(p)} className={i === crumbs.length - 1 ? "font-semibold" : "text-zinc-500 hover:underline"}>{label}</button>
                {i < crumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
              </span>
            ))}
            <span className="ml-2 text-xs text-zinc-400">→ by {dim}</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {d.drilldown.rows.map((r: any, i: number) => {
              const max = Math.max(...d.drilldown.rows.map((x: any) => Math.abs(x.contribution)), 1);
              const drillable = dim !== "product";
              return (
                <button key={i} disabled={!drillable}
                        onClick={() => setPath(dim === "region" ? { region: r.level } : { region: path.region, category: r.level })}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${drillable ? "hover:bg-zinc-100" : ""}`}>
                  <div className="w-32 shrink-0 truncate text-left">{r.level}</div>
                  <div className="relative h-6 flex-1 rounded bg-zinc-50">
                    <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${Math.max(2, (Math.abs(r.contribution) / max) * 100)}%`, backgroundColor: r.contribution < 0 ? DOWN : "#059669", opacity: 0.85 }} />
                  </div>
                  <div className="w-20 shrink-0 text-right font-medium tabular-nums">{money(r.contribution)}</div>
                  {drillable && <ChevronRight className="h-4 w-4 text-zinc-400" />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <Eyebrow icon={ShieldCheck}>Business rules · auditable</Eyebrow>
          <div className="mt-3 space-y-2">
            {[
              ["stockout_rate > 10%", "Supply Constraint", d.rules.fired.some((f: any) => f.code === "SUPPLY_CONSTRAINT"), d.rules.stockout != null ? pct(d.rules.stockout) : "n/a"],
              ["competitor_price_index < 0.95", "Competitive Pricing Pressure", d.rules.fired.some((f: any) => f.code === "PRICING_PRESSURE"), d.rules.comp != null ? d.rules.comp.toFixed(3) : "n/a"],
              ["marketing ↓>15% & conversions ↓", "Marketing Demand Effect", d.rules.fired.some((f: any) => f.code === "MARKETING_DEMAND"), signPct(d.rules.spend_drop)],
            ].map(([cond, label, fired, val]: any, i: number) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${fired ? "border-rose-200 bg-rose-50" : "border-zinc-200"}`}>
                {fired ? <Zap className="h-4 w-4 text-rose-600" /> : <Check className="h-4 w-4 text-zinc-400" />}
                <div className="flex-1">
                  <div className={`text-sm font-medium ${fired ? "text-rose-700" : ""}`}>{label}</div>
                  <div className="font-mono text-xs text-zinc-400">IF {cond}</div>
                </div>
                <div className="text-xs tabular-nums text-zinc-500">{val}</div>
                <Badge tone={fired ? "red" : "slate"}>{fired ? "fired" : "clear"}</Badge>
              </div>
            ))}
          </div>
          {d.anomalies?.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Anomalous days · IsolationForest</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {d.anomalies.map((a: any, i: number) => <Badge key={i} tone="amber">{a.date}</Badge>)}
              </div>
            </div>
          )}
        </Card>
      </div>

      {!d.customer_data_allowed && (
        <Card className="flex items-center gap-3">
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600"><Lock className="h-4 w-4" /></div>
          <div>
            <div className="font-medium">Access restricted</div>
            <div className="text-sm text-zinc-500">Customer-level cohort detail isn’t available to this role.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
