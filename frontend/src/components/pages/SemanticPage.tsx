import React, { useState, useEffect } from "react";
import { Badge, Card, KV } from "../ui";
import { getSemantic } from "../../api";

export function SemanticPage() {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getSemantic()
      .then(setD)
      .catch((e) => { setError(String(e?.message || e)); });
  };

  useEffect(() => { load(); }, []);

  if (error) return (
    <Card>
      <div className="text-sm text-rose-600">Error loading contracts: {error}</div>
      <button onClick={load} className="mt-2 rounded bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200">Retry</button>
    </Card>
  );

  if (!d) return <Card><div className="text-sm text-zinc-500">Loading contracts…</div></Card>;
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Object.entries<any>(d.kpis).map(([key, k]) => (
        <Card key={key}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{k.name}</h3>
            <Badge tone="indigo">{k.owner}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{k.definition}</p>
          <div className="mt-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-500">{k.formula}</div>
          <div className="mt-2 space-y-1">
            <KV k="Grain">{k.grain}</KV>
            <KV k="Dimensions">{k.dimensions.join(", ")}</KV>
            <KV k="Drivers">{k.drivers.join(", ")}</KV>
            <KV k="Refresh">{k.refresh}</KV>
            <KV k="Access">{k.access}</KV>
          </div>
        </Card>
      ))}
    </div>
  );
}
