import React, { useState, useEffect } from "react";
import {
  Sliders, Play, RefreshCw, Calendar, Database, AlertTriangle,
  TrendingDown, TrendingUp, Info, Zap, CheckCircle2, ShieldAlert
} from "lucide-react";
import { Badge, Card, KV } from "../ui";
import { getScenarioDates, simulateDay, resetScenario, money } from "../../api";

interface SimulatorPageProps {
  scenario: string;
  reloadInsights: () => void;
}

export function SimulatorPage({ scenario, reloadInsights }: SimulatorPageProps) {
  const [dates, setDates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sliders State
  const [marketingMultiplier, setMarketingMultiplier] = useState<number>(1.0);
  const [stockoutRate, setStockoutRate] = useState<number>(0.04);
  const [competitorPriceIndex, setCompetitorPriceIndex] = useState<number>(1.0);

  // Run multiple days
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1 day, 7 days, 14 days

  const loadDates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScenarioDates(scenario);
      setDates(data);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDates();
    // Default sliders on scenario change
    setMarketingMultiplier(1.0);
    setStockoutRate(scenario === "revenue_decline" ? 0.12 : 0.04);
    setCompetitorPriceIndex(scenario === "contradictory" ? 0.94 : 1.0);
    setSuccessMsg(null);
  }, [scenario]);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      setError(null);
      setSuccessMsg(null);

      let lastResult: any = null;
      for (let step = 0; step < simulationSpeed; step++) {
        lastResult = await simulateDay(scenario, {
          marketing_multiplier: marketingMultiplier,
          stockout_rate: stockoutRate,
          competitor_price_index: competitorPriceIndex,
        });
      }

      await loadDates();
      reloadInsights();

      if (simulationSpeed === 1) {
        setSuccessMsg(
          `Successfully simulated ${lastResult.date} (Day ${lastResult.day_index}). Added ${lastResult.added_tx} transactions, ${lastResult.added_mk} marketing campaigns and ${lastResult.added_ex} external records.`
        );
      } else {
        setSuccessMsg(
          `Successfully ran a ${simulationSpeed}-day sprint! Dynamic analytics windows advanced by ${simulationSpeed} days.`
        );
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset this scenario database? All your simulated data will be emptied and the scenario baseline will be re-seeded.")) {
      return;
    }
    try {
      setResetting(true);
      setError(null);
      setSuccessMsg(null);
      await resetScenario(scenario);
      await loadDates();
      reloadInsights();
      setSuccessMsg("Scenario SQLite records reset to clean out-of-the-box baseline.");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setResetting(false);
    }
  };

  if (loading && !dates) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="text-sm font-medium text-zinc-500">Querying scenario database boundaries...</span>
        </div>
      </Card>
    );
  }

  const scenarioNames: Record<string, string> = {
    revenue_decline: "Revenue Decline",
    revenue_growth: "Revenue Growth",
    contradictory: "Contradictory Evidence",
    new_product: "New Product / Sparse History",
  };

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
        <Sliders className="h-5 w-5 text-indigo-600" />
        <span>Scenario Simulation Lab</span>
      </h2>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-800 flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Query Failed:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-250 bg-emerald-50/70 p-4 text-sm text-emerald-800 flex items-start gap-2.5 shadow-xs animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Simulation Event Feed:</span> {successMsg}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Simulator controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-indigo-100 shadow-sm relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 bg-indigo-50/50 px-4 py-1.5 rounded-bl-2xl text-[10px] uppercase font-bold tracking-wider text-indigo-600 border-l border-b border-indigo-100">
              Control Panel
            </div>
            
            <h3 className="text-base font-semibold text-zinc-900">Step 1: Configure Shock Parameters</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Adjust business operations levers to inject anomalies or events. These parameters directly modify the generator algorithms when appending the next days.
            </p>

            <div className="mt-6 space-y-6">
              {/* Marketing Budget multiplier */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Marketing Spend Multiplier</span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${marketingMultiplier !== 1.0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-zinc-100 text-zinc-600'}`}>
                    {marketingMultiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={marketingMultiplier}
                  onChange={(e) => setMarketingMultiplier(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-150 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                  <span>0.1x Budget Pullback</span>
                  <span>1.0x (Normal)</span>
                  <span>3.0x Scale Spillover</span>
                </div>
              </div>

              {/* Stockout rate */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Inventory Stockout Rate</span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${stockoutRate > 0.10 ? 'bg-rose-50 text-rose-700 border border-rose-200' : stockoutRate > 0.05 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-zinc-100 text-zinc-600'}`}>
                    {(stockoutRate * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.01"
                  value={stockoutRate}
                  onChange={(e) => setStockoutRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-150 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                  <span>0% Perfect Supply</span>
                  <span>&gt;10% SUPPLY_CONSTRAINT trigger</span>
                  <span>50% Severe Stockout</span>
                </div>
              </div>

              {/* Competitor Price Index */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-2">
                    {competitorPriceIndex < 0.95 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    <span>Competitor Price Index</span>
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${competitorPriceIndex < 0.95 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-zinc-100 text-zinc-600'}`}>
                    {competitorPriceIndex.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.01"
                  value={competitorPriceIndex}
                  onChange={(e) => setCompetitorPriceIndex(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-150 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                  <span>0.70 Aggressive Competitor Drop</span>
                  <span>1.00 (MSRP Equalized)</span>
                  <span>1.30 Premium competitors</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-indigo-100 shadow-sm bg-white">
            <h3 className="text-base font-semibold text-zinc-900">Step 2: Trigger Simulation</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Click the simulate trigger to append new days into the database. These records will be queryable in the Overview, Insight, and Driver Attribution tabs.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-50 border border-zinc-200/50 p-4 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-zinc-700">Sprint Duration:</span>
                <div className="inline-flex rounded-lg border border-zinc-200/60 bg-white p-0.5">
                  {[1, 7, 14].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSimulationSpeed(v)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold select-none ${
                        simulationSpeed === v
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {v === 1 ? "1 Day" : `${v} Days`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSimulate}
                  disabled={simulating || resetting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-750 disabled:opacity-50 transition-all font-medium"
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Simulating {simulationSpeed} days...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Simulate Sprint ({simulationSpeed === 1 ? "Next Day" : `Advance ${simulationSpeed} Days`})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Database Status & Rules Details */}
        <div className="space-y-6">
          {/* DB Status */}
          <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-indigo-600 px-3 py-1 text-[9px] uppercase font-bold tracking-widest rounded-bl-xl">
              Active SQLite
            </div>

            <div className="flex items-center gap-2 text-zinc-300">
              <Database className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Dynamic Boundaries</h3>
            </div>
            
            <div className="mt-4 space-y-1">
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Active Schema Context</span>
                <span className="font-bold text-indigo-400">{scenarioNames[dates?.scenario] || dates?.scenario}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Starting Baseline Date</span>
                <span className="font-bold tabular-nums">{dates?.min_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Latest Computed Date</span>
                <span className="font-bold tabular-nums text-emerald-450">{dates?.max_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Baseline Dataset Length</span>
                <span className="font-bold tabular-nums">365 Days</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Simulated Increments</span>
                <Badge tone="green" className="font-bold border-green-800 tabular-nums">
                  +{dates?.simulated_days} days
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Transaction Rows (TX)</span>
                <span className="font-semibold text-zinc-300 tabular-nums">{dates?.tx_rows?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Marketing Campaign Rows</span>
                <span className="font-semibold text-zinc-300 tabular-nums">{dates?.mk_rows?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Context / External Rows</span>
                <span className="font-semibold text-zinc-300 tabular-nums">{dates?.ex_rows?.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800">
              <button
                onClick={handleReset}
                disabled={resetting || simulating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700/60 px-4 py-2 text-xs font-semibold text-rose-455 hover:bg-zinc-800 hover:border-rose-900/40 disabled:opacity-40 transition-all cursor-pointer"
              >
                {resetting ? (
                  <span>Re-seeding database baseline...</span>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reset Scenario Dataset</span>
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Logic explanations */}
          <Card className="border-indigo-100 bg-indigo-50/15">
            <h4 className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Attribution Logic & Rules</span>
            </h4>
            <p className="mt-2 text-xs text-zinc-650 leading-relaxed">
              When simulating next days:
            </p>
            <ul className="mt-2 text-xs space-y-1.5 text-zinc-600 list-disc list-inside">
              <li>
                <strong className="text-zinc-800">Supplier constraints:</strong> High stockout overrides will lower conversion rates proportionally and trigger supply chain alerts.
              </li>
              <li>
                <strong className="text-zinc-800">Pricing pressures:</strong> Low competitor price parameters will fire pricing alarm rules, influencing customer mix purchase decisions.
              </li>
              <li>
                <strong className="text-zinc-800">Dynamic Windows:</strong> All metrics, regressions, and narratives in other tabs refresh dynamically to reflect the expanded date bounds.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
