import { MessageSquare, Check, X, Trash2, Clock } from "lucide-react";
import { DeleteButton } from "../delete-button";
import { listReviews } from "@/lib/reviews";
import { Stars } from "@/components/stars";
import { moderateReview } from "../../actions";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "نظرات" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "در انتظار تأیید", cls: "bg-amber-400/15 text-amber-600 dark:text-amber-400" },
  APPROVED: { label: "تأییدشده", cls: "bg-emerald-400/15 text-emerald-600 dark:text-emerald-400" },
  REJECTED: { label: "ردشده", cls: "bg-rose-400/15 text-rose-500" },
};

export default async function AdminReviewsPage() {
  const reviews = await listReviews();
  const pending = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-black">نظرات کاربران</h1>
        {pending > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> {toFa(pending)} در انتظار
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="card p-6 text-sm text-muted">هنوز نظری ثبت نشده است.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const s = STATUS_LABEL[r.status];
            return (
              <div key={r.id} className="card p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-bold">{r.authorName}</span>
                  <Stars value={r.rating} size={13} />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                  <a
                    href={`/product/${r.productSlug}`}
                    target="_blank"
                    className="text-xs text-muted hover:text-primary"
                  >
                    /product/{r.productSlug}
                  </a>
                </div>
                <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{r.comment}</p>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "APPROVED" && (
                    <form action={moderateReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> تأیید
                      </button>
                    </form>
                  )}
                  {r.status !== "REJECTED" && (
                    <form action={moderateReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="action" value="reject" />
                      <button className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">
                        <X className="h-3.5 w-3.5" /> رد
                      </button>
                    </form>
                  )}
                  <DeleteButton
                    action={moderateReview}
                    id={r.id}
                    extra={{ action: "delete" }}
                    message="این نظر حذف شود؟"
                    className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </DeleteButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
