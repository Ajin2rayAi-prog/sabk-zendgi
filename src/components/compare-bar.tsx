"use client";

import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "@/components/compare-provider";
import { toFa } from "@/lib/utils";

// نوار شناور مقایسه: وقتی محصولی برای مقایسه انتخاب شده باشد ظاهر می‌شود.
export function CompareBar() {
  const { ids, count, clear, ready } = useCompare();
  if (!ready || count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border bg-bg/90 px-4 py-3 shadow-lux backdrop-blur">
        <GitCompare className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold">
          {toFa(count)} کالا برای مقایسه
        </span>
        <Link
          href={`/compare?ids=${encodeURIComponent(ids.join(","))}`}
          className="btn-primary px-4 py-1.5 text-sm"
        >
          مقایسه
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label="پاک کردن مقایسه"
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-rose-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
