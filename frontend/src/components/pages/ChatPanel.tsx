import React, { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { postChat } from "../../api";

export function ChatPanel({ scenario, onClose, seed }: { scenario: string; onClose: () => void; seed?: string }) {
  const [msgs, setMsgs] = useState<any[]>([{ role: "assistant", text: "Ask about what changed, drivers, evidence, or what to do. Your question is parsed into a structured query and answered by the engine." }]);
  const [input, setInput] = useState(seed || "");

  const send = async (q?: string) => {
    const text = (q ?? input).trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    try {
      const d = await postChat(text, scenario);
      setMsgs((m) => [...m, { role: "assistant", text: d.answer, meta: d }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: "Request failed — is the API running?" }]);
    }
  };

  const suggestions = ["Why is revenue down?", "What caused the decline in North?", "Show me evidence", "Why are you not confident?", "What should I do?"];

  return (
    <div className="flex h-full flex-col border-l border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-indigo-600" /><span className="text-sm font-semibold">Analyst chat</span></div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-zinc-100"><X className="h-4 w-4 text-zinc-400" /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-zinc-100"}`}>
              {m.meta && (
                <div className="mb-1 flex flex-wrap gap-1 text-xs">
                  <span className="rounded bg-indigo-100 px-1 font-mono text-indigo-700">{m.meta.intent}</span>
                  {Object.entries(m.meta.filters).map(([k, v]: any) => <span key={k} className="rounded bg-indigo-100 px-1 font-mono text-indigo-700">{k}={v}</span>)}
                  <span className={`rounded px-1 font-mono ${m.meta.route.llm ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>{m.meta.route.llm ? "narrative" : "no-LLM"}</span>
                  <span className="rounded bg-zinc-200 px-1 font-mono text-zinc-600">{m.meta.latency_ms}ms</span>
                </div>
              )}
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200 px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {suggestions.map((s, i) => <button key={i} onClick={() => send(s)} className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100">{s}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask the engine…" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <button onClick={() => send()} className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
