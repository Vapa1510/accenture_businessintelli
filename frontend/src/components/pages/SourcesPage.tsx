import React, { useState, useEffect } from "react";
import { Activity, AlertTriangle, BadgeCheck, Database, Upload, DatabaseZap, Check, RefreshCw, Layers } from "lucide-react";
import { Badge, Card, Eyebrow, KV } from "../ui";
import { getSources, ingestData, seedDatabase, num, pct } from "../../api";

export function SourcesPage({ scenario }: { scenario: string }) {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // Ingestion states
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getSources(scenario)
      .then(setD)
      .catch((e) => {
        setError(String(e?.message || e));
      });
  };

  useEffect(() => {
    load();
  }, [scenario]);

  const handleSeedDB = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await seedDatabase();
      setSeedMsg(res.message || "Database seeded successfully!");
      load();
    } catch (e: any) {
      setSeedMsg(`Seeding failed: ${e.message || e}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCustomIngest = async () => {
    setIngesting(true);
    setIngestResult(null);
    try {
      let parsedPayload: any = {};
      if (jsonText.trim()) {
        parsedPayload = JSON.parse(jsonText);
      } else {
        // Sample default payload
        parsedPayload = {
          scenario: "custom_ingested",
          transactions: [
            { date: "2026-08-21", region: "North", category: "Electronics", product_id: "EL-1", revenue: 15400.0, orders: 12, gross_margin: 4620.0 }
          ],
          marketing: [
            { date: "2026-08-21", region: "North", channel: "Paid Search", ad_spend: 1800.0, clicks: 420, conversions: 24 }
          ],
          external: [
            { date: "2026-08-21", region: "North", supply_availability: 0.96, competitor_price_index: 0.98 }
          ]
        };
      }

      const res = await ingestData(parsedPayload);
      setIngestResult(`Success! Ingested ${res.records_ingested.transactions} transactions, ${res.records_ingested.marketing} marketing, ${res.records_ingested.external} external records.`);
      load();
    } catch (e: any) {
      setIngestResult(`Ingestion failed: ${e.message || e}`);
    } finally {
      setIngesting(false);
    }
  };

  if (error)
    return (
      <Card>
        <div className="text-sm text-rose-600">Error loading sources: {error}</div>
        <button onClick={load} className="mt-2 rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">
          Retry
        </button>
      </Card>
    );

  if (!d) return <Card><div className="text-xs text-zinc-500">Loading data sources…</div></Card>;

  return (
    <div className="space-y-4">
      {/* Top Banner & Fast Seed Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-xs">
            <DatabaseZap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Enterprise Data Pipeline & Ingestion Engine</h3>
            <p className="text-xs text-zinc-500">Freshness, grain consistency, and source coverage feed directly into the confidence meter.</p>
          </div>
        </div>

        <button
          onClick={handleSeedDB}
          disabled={seeding}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {seeding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
          <span>{seeding ? "Seeding Database…" : "Seed All 4 Scenarios to Database"}</span>
        </button>
      </div>

      {seedMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{seedMsg}</span>
        </div>
      )}

      {/* Sources Overview Grid */}
      <Card pad={false}>
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <div className="col-span-3">Source</div>
          <div className="col-span-3">Grain</div>
          <div className="col-span-2">Rows</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Coverage</div>
        </div>
        {Object.entries<any>(d.sources).map(([key, s]) => (
          <div key={key} className="border-b border-zinc-100 last:border-0">
            <button onClick={() => setOpen(open === key ? null : key)} className="grid w-full grid-cols-12 items-center gap-2 px-4 py-3.5 text-xs hover:bg-zinc-50/80 transition-colors">
              <div className="col-span-3 flex items-center gap-2 font-bold text-zinc-900">
                <Database className="h-4 w-4 text-indigo-600" />
                {s.name}
              </div>
              <div className="col-span-3 font-mono text-zinc-500">{s.grain}</div>
              <div className="col-span-2 font-mono font-bold text-zinc-800">{num(s.rows)}</div>
              <div className="col-span-2">
                <Badge tone={s.status === "Fresh" ? "green" : "red"}>
                  {s.status === "Fresh" ? <BadgeCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {s.status}
                </Badge>
              </div>
              <div className="col-span-2 text-right font-mono font-bold text-zinc-900">{pct(s.coverage)}</div>
            </button>
            {open === key && (
              <div className="bg-zinc-50/70 px-4 pb-4 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-4 pt-3 md:grid-cols-4">
                  <KV k="Last refresh">{s.last_refresh_h < 1 ? "just now" : `${Math.round(s.last_refresh_h)}h ago`}</KV>
                  <KV k="Expected">{s.expected}</KV>
                  <KV k="Missing">{pct(s.missing)}</KV>
                  <KV k="Rows">{num(s.rows)}</KV>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Schema Definition</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {s.schema.map((f: string) => (
                      <span key={f} className="rounded-md border border-zinc-200/80 bg-white px-2 py-0.5 font-mono text-xs font-medium text-zinc-600 shadow-2xs">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Interactive Custom JSON/CSV Ingestion Tool */}
      <Card>
        <Eyebrow icon={Upload}>Custom Data Ingestion API (`POST /api/ingest`)</Eyebrow>
        <p className="mt-1 text-xs text-zinc-500">
          Paste a custom JSON payload or click "Ingest Sample Data Feed" to append custom transaction, marketing, or external records directly into the SQLite analytics database.
        </p>

        <div className="mt-3.5 space-y-2">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`Leave empty to ingest sample records, or paste custom JSON:\n{\n  "scenario": "custom_ingested",\n  "transactions": [{ "date": "2026-08-21", "region": "North", "category": "Electronics", "revenue": 15400.0, "orders": 12 }],\n  "marketing": [{ "date": "2026-08-21", "region": "North", "ad_spend": 1800.0, "conversions": 24 }]\n}`}
            className="h-28 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 font-mono text-xs text-zinc-800 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
          />

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleCustomIngest}
              disabled={ingesting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              {ingesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              <span>{ingesting ? "Ingesting Data…" : "Ingest Data Payload"}</span>
            </button>
            <span className="text-[11px] font-medium text-zinc-400">Schema enforced by Pydantic & SQLAlchemy</span>
          </div>

          {ingestResult && (
            <div className={`mt-2 rounded-xl border px-3.5 py-2 text-xs font-semibold ${ingestResult.startsWith("Success") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              {ingestResult}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
