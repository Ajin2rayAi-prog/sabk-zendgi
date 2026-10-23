"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// ============================================================
//  مقایسهٔ محصولات (سمت کلاینت، localStorage).
//  فقط slug محصولات نگه داشته می‌شود؛ صفحهٔ /compare
//  اطلاعات کامل را از دیتابیس می‌خواند.
// ============================================================

const MAX = 4; // حداکثر تعداد محصول قابل مقایسه
const STORAGE_KEY = "hassani-compare";

type CompareContextValue = {
  ids: string[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  ready: boolean;
  max: number;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed.slice(0, MAX));
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  }, [ids, ready]);

  const has = useCallback((slug: string) => ids.includes(slug), [ids]);

  const toggle = useCallback((slug: string) => {
    setIds((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX) return prev; // پر است
      return [...prev, slug];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setIds((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareContext.Provider
      value={{ ids, count: ids.length, has, toggle, remove, clear, ready, max: MAX }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare باید داخل CompareProvider استفاده شود");
  return ctx;
}
