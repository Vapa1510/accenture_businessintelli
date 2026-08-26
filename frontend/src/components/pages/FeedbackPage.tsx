import React, { useState, useEffect } from "react";
import { BadgeCheck, BrainCircuit, ChevronRight, MessageSquare } from "lucide-react";
import { Card, Eyebrow } from "../ui";
import { getFeedback, postFeedback } from "../../api";

export function FeedbackPage({ scenario }: { scenario: string }) {
  const [d, setD] = useState<any>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [actual, setActual] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const load = () => getFeedback().then(setD).catch(console.error);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    await postFeedback({ scenario, kpi: "revenue", helpful, category: cat, actual_driver: actual, comment });
    setDone(true); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <Eyebrow icon={MessageSquare}>Rate this insight</Eyebrow>
        {done ? <div className="mt-3 flex items-center gap-2 text-emerald-700"><BadgeCheck className="h-5 w-5" />Feedback stored in PostgreSQL.</div> : (
          <>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setHelpful(true)} className={`rounded-lg border px-3 py-1.5 text-sm ${helpful === true ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-500"}`}>Helpful</button>
              <button onClick={() => setHelpful(false)} className={`rounded-lg border px-3 py-1.5 text-sm ${helpful === false ? "border-rose-300 bg-rose-50 text-rose-700" : "border-zinc-200 text-zinc-500"}`}>Not helpful</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Correct driver", "Incorrect driver", "Missing context", "Not actionable", "Other"].map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-md border px-2 py-1 text-xs ${cat === c ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-zinc-200 text-zinc-500"}`}>{c}</button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <input value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Actual driver (analyst correction)" className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" />
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment / context" className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" />
            </div>
            <button onClick={submit} className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Submit feedback</button>
          </>
        )}
      </Card>

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Card><div className="text-xs text-zinc-400">Insights reviewed</div><div className="mt-1 text-2xl font-semibold tabular-nums">{d.total}</div></Card>
            <Card><div className="text-xs text-zinc-400">Helpful</div><div className="mt-1 text-2xl font-semibold tabular-nums">{d.helpful_pct ?? "—"}%</div></Card>
            <Card><div className="text-xs text-zinc-400">Categories flagged</div><div className="mt-1 text-2xl font-semibold tabular-nums">{d.by_category.length}</div></Card>
          </div>
          <Card>
            <Eyebrow icon={BrainCircuit}>How feedback improves the system</Eyebrow>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-500">
              {d.improves.map((x: string, i: number) => <li key={i} className="flex gap-2"><ChevronRight className="mt-0.5 h-3.5 w-3.5 text-indigo-500" />{x}</li>)}
            </ul>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{d.note}</div>
          </Card>
        </>
      )}
    </div>
  );
}
