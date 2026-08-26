import React from "react";
import { AlertTriangle } from "lucide-react";
import { Card, Badge } from "../ui";
import type { Insight } from "../../api";

export function AbstentionPanel({ ins, onClarify }: { ins: Insight; onClarify: (q: string) => void }) {
  return (
    <Card className="border-amber-300">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <span className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          {ins.abstain_kind === "sparse_history" ? "Insufficient baseline" : "Analysis paused — low confidence"}
        </span>
        <Badge tone="amber" className="ml-auto">{Math.round(ins.confidence.score * 100)}%</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{ins.narrative.headline}</h3>
      {ins.narrative.paragraphs.map((p, i) => <p key={i} className="mt-2 text-sm leading-relaxed text-zinc-500">{p}</p>)}
      <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Why</div>
        <ul className="mt-1 space-y-1">
          {ins.reasons.map((r, i) => <li key={i} className="flex gap-2 text-sm text-zinc-500"><span className="text-amber-600">•</span>{r}</li>)}
        </ul>
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Ask for clarification</div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ins.clarifications.map((q, i) => (
            <button key={i} onClick={() => onClarify(q)} className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100">{q}</button>
          ))}
        </div>
      </div>
    </Card>
  );
}
