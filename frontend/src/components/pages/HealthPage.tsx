import React, { useState, useEffect } from "react";
import { Activity, BrainCircuit } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ACCENT, Badge, Card, Eyebrow } from "../ui";
import { getHealth } from "../../api";

export function HealthPage() {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getHealth()
      .then(setD)
      .catch((e) => { setError(String(e?.message || e)); });
  };

  useEffect(() => { load(); }, []);

  if (error) return (
    <Card>
      <div className="text-sm text-rose-600">Error loading telemetry: {error}</div>
      <button onClick={load} className="mt-2 rounded bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">Retry</button>
    </Card>
  );

  if (!d) return <Card><div className="text-sm text-zinc-500">Loading telemetry…</div></Card>;
  const chart = d.recent.slice().reverse().map((r: any, i: number) => ({ i: `#${i + 1}`, ms: r.latency_ms }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Last latency", `${d.latency_ms.last} ms`], ["P95 latency", `${d.latency_ms.p95} ms`],
          ["LLM calls avoided", `${d.llm_avoided_pct}%`], ["Cache hit rate", `${d.cache_hit_rate}%`]].map(([k, v]: any, i: number) => (
          <Card key={i}><div className="text-xs text-zinc-400">{k}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <Eyebrow icon={Activity}>Latency per request</Eyebrow>
          <div className="mt-3 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="i" tick={{ fontSize: 10, fill: "#a1a1aa" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} width={40} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="ms" radius={[3, 3, 0, 0]}>{chart.map((_: any, i: number) => <Cell key={i} fill={ACCENT} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-zinc-400">Cache backend: {d.cache_backend} · {d.requests_logged} requests logged · abstention rate {d.abstention_rate}%</div>
        </Card>
        <Card>
          <Eyebrow icon={BrainCircuit}>Cost-optimized model routing</Eyebrow>
          <div className="mt-3 space-y-2">
            {d.routing.map((r: any, i: number) => (
              <div key={i} className="rounded-lg border border-zinc-200 p-3">
                <div className="text-sm font-medium">{r.tier}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{r.why}</div>
                <Badge tone="indigo" className="mt-2">{r.model}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
