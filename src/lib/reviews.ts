import "server-only";
import { prisma } from "@/lib/prisma";
import { NO_DB } from "@/lib/db";

// ============================================================
//  لایهٔ دادهٔ نظرات و امتیاز محصولات.
//  نظرها پس از ثبت «در انتظار تأیید» هستند و فقط پس از تأیید مدیر
//  روی سایت دیده می‌شوند.
// ============================================================

export type PublicReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export type ReviewStats = { avg: number; count: number };

/** نظرهای تأییدشدهٔ یک محصول (جدیدترین اول). */
export async function getApprovedReviews(productSlug: string): Promise<PublicReview[]> {
  if (NO_DB) return [];
  const rows = await prisma.review.findMany({
    where: { productSlug, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));
}

/** میانگین و تعداد امتیاز تأییدشدهٔ یک محصول. */
export async function getReviewStats(productSlug: string): Promise<ReviewStats> {
  if (NO_DB) return { avg: 0, count: 0 };
  const agg = await prisma.review.aggregate({
    where: { productSlug, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  return {
    avg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
    count: agg._count,
  };
}

/** ثبت یک نظر جدید (وضعیت اولیه: در انتظار تأیید). */
export async function createReview(input: {
  productSlug: string;
  authorName: string;
  rating: number;
  comment: string;
  customerId?: string | null;
}): Promise<void> {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const authorName = input.authorName.trim().slice(0, 60) || "کاربر مهمان";
  const comment = input.comment.trim().slice(0, 1000);
  if (!comment) throw new Error("متن نظر خالی است");
  await prisma.review.create({
    data: {
      productSlug: input.productSlug,
      authorName,
      rating,
      comment,
      customerId: input.customerId ?? null,
    },
  });
}

/* ---------- مدیریت ---------- */

export async function listReviews(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return prisma.review.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function countPendingReviews(): Promise<number> {
  return prisma.review.count({ where: { status: "PENDING" } });
}
