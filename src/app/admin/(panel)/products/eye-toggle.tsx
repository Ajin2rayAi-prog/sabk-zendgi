"use client";

import { useOptimistic, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toggleProductVisible } from "../../actions";

/** دکمهٔ چشم با بازخورد آنی (خوش‌بینانه) — منتظر پاسخ سرور نمی‌ماند */
export function EyeToggle({ id, visible }: { id: string; visible: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(visible);

  return (
    <form
      action={() => {
        setOptimistic(!optimistic);
        startTransition(async () => {
          const fd = new FormData();
          fd.append("id", id);
          await toggleProductVisible(fd);
        });
      }}
      title={optimistic ? "مخفی کردن از سایت" : "نمایش در سایت"}
    >
      <button
        className={`grid h-8 w-8 place-items-center rounded-lg border transition-all ${
          optimistic ? "text-primary hover:border-primary" : "text-muted hover:text-primary"
        } ${pending ? "scale-90 opacity-60" : ""}`}
      >
        {optimistic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </form>
  );
}
