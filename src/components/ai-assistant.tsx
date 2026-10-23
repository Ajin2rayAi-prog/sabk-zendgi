"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site";

const SUGGESTIONS = [
  "تفاوت مدار ونتیلاتور شفاف و مات چیست؟",
  "برای بخش نوزادان چه ملزوماتی لازم است؟",
  "قیمت فیلتر HME و ضد باکتری",
];

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "سلام 👋 برای انتخاب محصول مناسب راهنمایی می‌خواهید؟ نوع تجهیز، بخش مصرف (بزرگسال/اطفال/نوزاد) یا بودجه را بگویید.",
};

/** لینک‌های /product/... یا /category/... داخل متن را کلیک‌پذیر می‌کند. */
function renderContent(text: string) {
  const parts = text.split(/(\/(?:product|category)\/[a-z0-9-]+)/gi);
  return parts.map((part, i) =>
    /^\/(?:product|category)\/[a-z0-9-]+$/i.test(part) ? (
      <Link key={i} href={part} className="font-bold text-primary underline underline-offset-2">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!siteConfig.features.ai) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // فقط تاریخچهٔ گفتگو (بدون پیام خوش‌آمد) ارسال می‌شود
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
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
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "متأسفانه پاسخی دریافت نشد." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "ارتباط برقرار نشد. لطفاً دوباره تلاش کنید." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="مشاور خرید"
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#c5a054,#a37f35)] px-5 py-3.5 font-bold text-white shadow-[0_14px_40px_-12px_rgba(197,160,84,0.55)] transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" /> مشاور خرید
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="card fixed bottom-5 left-5 z-50 flex h-[30rem] w-[92vw] max-w-sm flex-col overflow-hidden shadow-lux"
          >
            <div className="flex items-center justify-between bg-[linear-gradient(135deg,#c5a054,#a37f35)] p-4 text-white">
              <div className="flex items-center gap-2 font-black">
                <Sparkles className="h-5 w-5" /> مشاور خرید {siteConfig.brand.name}
              </div>
              <button onClick={() => setOpen(false)} aria-label="بستن">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-primary px-3 py-2 text-primary-fg"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary-soft p-3 leading-relaxed text-primary-deep dark:text-fg"
                  }
                >
                  {m.role === "assistant" ? renderContent(m.content) : m.content}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tr-sm bg-primary-soft p-3 text-primary-deep dark:text-fg">
                  <Loader2 className="h-4 w-4 animate-spin" /> در حال نوشتن…
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
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
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="سوال خود را بنویسید…"
                className="flex-1 rounded-xl border bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="ارسال"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#c5a054,#a37f35)] text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
