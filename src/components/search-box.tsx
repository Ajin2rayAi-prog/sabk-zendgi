"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Loader2, ArrowLeft } from "lucide-react";

type Suggestion = {
  slug: string;
  sku: string;
  title: string;
  brand: string;
  image: string | null;
  categorySlug: string;
};

/** باکس جستجو با پیشنهادهای زندهٔ کشویی */
export function SearchBox({
  defaultValue = "",
  autoFocus = false,
  placeholder = "جستجو… مثلاً مانتو یا تی‌شرت",
  className = "",
  onNavigate,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // بستن با کلیک بیرون یا Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // پیشنهاد زنده با debounce
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (!r.ok) throw new Error("bad");
        const j = await r.json();
        setItems(Array.isArray(j.products) ? j.products : []);
        setOpen(true);
      } catch {
        /* خطا را نادیده بگیر؛ صفحهٔ نتایج همیشه هست */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const go = (to: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(to);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          go(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative flex items-center"
      >
        <Search className="pointer-events-none absolute right-4 h-5 w-5 text-muted" />
        <input
          name="q"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (items.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border bg-transparent py-2.5 pr-12 pl-10 text-sm outline-none transition focus:border-primary"
        />
        {loading && (
          <Loader2 className="absolute left-3 h-4 w-4 animate-spin text-muted" />
        )}
      </form>

      {open && q.trim().length >= 2 && !loading && (
        <div className="surface absolute right-0 left-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border shadow-2xl">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
              className="block w-full px-4 py-3 text-right text-sm text-muted hover:text-primary"
            >
              موردی یافت نشد — مشاهدهٔ نتایج کامل
            </button>
          ) : (
            <>
              {items.map((p) => (
                <button
                  key={p.sku}
                  type="button"
                  onClick={() => go(`/product/${p.slug}`)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors hover:bg-primary-soft"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border bg-elev text-xs font-bold text-muted">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      p.title.slice(0, 1)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.title}</span>
                    <span className="block text-xs text-muted">
                      {p.brand} · {p.sku}
                    </span>
                  </span>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-muted" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
                className="block w-full border-t px-4 py-2.5 text-center text-sm font-bold text-primary hover:underline"
              >
                مشاهدهٔ همهٔ نتایج
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// استفادهٔ قبلیِ مبتنی بر لینک — نگه داشته شده تا جایی که ایمپورتش کرده باشند نشکند
export function SearchLink() {
  return (
    <Link href="/search" aria-label="جستجو">
      <Search className="h-5 w-5" />
    </Link>
  );
}
