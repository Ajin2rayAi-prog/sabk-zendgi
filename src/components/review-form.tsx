"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { submitReviewAction, getCustomerNameAction } from "@/app/(site)/product/[slug]/actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary justify-center disabled:opacity-60">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      ثبت نظر
    </button>
  );
}

/** فرم ثبت نظر و امتیاز برای یک محصول. نام کاربر واردشده را سمت کلاینت می‌خواند
 *  تا صفحهٔ محصول کش (static) بماند. */
export function ReviewForm({ slug }: { slug: string }) {
  const [state, action] = useFormState(submitReviewAction, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [defaultName, setDefaultName] = useState("");

  useEffect(() => {
    getCustomerNameAction().then(setDefaultName).catch(() => {});
  }, []);

  if (state?.ok) {
    return (
      <div className="card flex items-center gap-2 p-5 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5 shrink-0" /> {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <label className="mb-1.5 block text-sm font-bold">امتیاز شما</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i} ستاره`}
              className="p-0.5"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-transparent text-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold">نام شما</label>
        <input
          name="authorName"
          defaultValue={defaultName}
          placeholder="مثلاً دکتر رضایی"
          className="w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold">نظر شما</label>
        <textarea
          name="comment"
          rows={3}
          required
          placeholder="تجربهٔ خود از این محصول را بنویسید…"
          className="w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {state && !state.ok && <p className="text-sm text-rose-500">{state.message}</p>}

      <SubmitBtn />
    </form>
  );
}
