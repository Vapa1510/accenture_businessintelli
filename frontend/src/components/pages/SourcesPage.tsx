import React, { useState, useEffect } from "react";
import { Activity, AlertTriangle, BadgeCheck, Database } from "lucide-react";
import { Badge, Card, KV } from "../ui";
import { getSources, num, pct } from "../../api";

export function SourcesPage({ scenario }: { scenario: string }) {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getSources(scenario)
      .then(setD)
      .catch((e) => { setError(String(e?.message || e)); });
  };

  useEffect(() => { load(); }, [scenario]);

  if (error) return (
    <Card>
      <div className="text-sm text-rose-600">Error loading sources: {error}</div>
      <button onClick={load} className="mt-2 rounded bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">Retry</button>
    </Card>
  );

  if (!d) return <Card><div className="text-sm text-zinc-500">Loading sources…</div></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Activity className="h-4 w-4" />Freshness and coverage feed the confidence score directly.
      </div>
      <Card pad={false}>
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <div className="col-span-3">Source</div><div className="col-span-3">Grain</div>
          <div className="col-span-2">Rows</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Coverage</div>
        </div>
        {Object.entries<any>(d.sources).map(([key, s]) => (
          <div key={key} className="border-b border-zinc-200">
            <button onClick={() => setOpen(open === key ? null : key)} className="grid w-full grid-cols-12 items-center gap-2 px-4 py-3 text-sm hover:bg-zinc-50">
              <div className="col-span-3 flex items-center gap-2 font-medium"><Database className="h-4 w-4 text-indigo-600" />{s.name}</div>
              <div className="col-span-3 font-mono text-xs text-zinc-500">{s.grain}</div>
              <div className="col-span-2 tabular-nums text-zinc-500">{num(s.rows)}</div>
              <div className="col-span-2">
                <Badge tone={s.status === "Fresh" ? "green" : "red"}>
                  {s.status === "Fresh" ? <BadgeCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{s.status}
                </Badge>
              </div>
              <div className="col-span-2 text-right font-medium tabular-nums">{pct(s.coverage)}</div>
            </button>
            {open === key && (
              <div className="bg-zinc-50 px-4 pb-4">
                <div className="grid grid-cols-2 gap-4 pt-3 md:grid-cols-4">
                  <KV k="Last refresh">{s.last_refresh_h < 1 ? "just now" : `${Math.round(s.last_refresh_h)}h ago`}</KV>
                  <KV k="Expected">{s.expected}</KV>
                  <KV k="Missing">{pct(s.missing)}</KV>
                  <KV k="Rows">{num(s.rows)}</KV>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Schema</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {s.schema.map((f: string) => <span key={f} className="rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-500">{f}</span>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
