"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

/** دکمهٔ «خلاصهٔ نظرات با هوش مصنوعی» — خلاصه را به‌صورت زنده می‌گیرد. */
export function ReviewSummary({ slug }: { slug: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    if (loading) return;
    setLoading(true);
    setText("");
    setDone(false);
    try {
      const res = await fetch("/api/ai/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.body) throw new Error("no-stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
    } catch {
      setText("تهیهٔ خلاصه ممکن نشد.");
    } finally {
      setLoading(false);
      setDone(true);
    }
  }

  return (
    <div className="mb-5">
      {!done && (
        <button
          onClick={run}
          disabled={loading}
          className="btn-ghost text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          خلاصهٔ نظرات با هوش مصنوعی
        </button>
      )}
      {text && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft p-4 text-sm leading-relaxed text-primary-deep dark:text-fg">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> خلاصهٔ هوشمند نظرات
          </div>
          <div className="whitespace-pre-wrap">{text}</div>
        </div>
      )}
    </div>
  );
}
