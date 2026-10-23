"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

/** جعبهٔ گفتگوی عمومی — در پنل ادمین استفاده می‌شود. */
export function ChatBox({
  endpoint,
  greeting,
  suggestions = [],
}: {
  endpoint: string;
  greeting: string;
  suggestions?: string[];
}) {
  const greet: Msg = { role: "assistant", content: greeting };
  const [messages, setMessages] = useState<Msg[]>([greet]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== greet) }),
      });
      if (!res.body) throw new Error("no-stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let started = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (!started) {
          started = true;
          setMessages((m) => [...m, { role: "assistant", content: acc }]);
        } else {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
      }
      if (!started) {
        setMessages((m) => [...m, { role: "assistant", content: "پاسخی دریافت نشد." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "ارتباط برقرار نشد." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex h-[70vh] flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-primary px-3 py-2 text-primary-fg"
                : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary-soft p-3 leading-relaxed text-primary-deep dark:text-fg"
            }
          >
            {m.content}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-tr-sm bg-primary-soft p-3 text-primary-deep dark:text-fg">
            <Loader2 className="h-4 w-4 animate-spin" /> در حال نوشتن…
          </div>
        )}

        {messages.length === 1 && !loading && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t p-3"
      >
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="پیام خود را بنویسید…"
          className="flex-1 rounded-xl border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="ارسال"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-grad text-primary-fg disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
