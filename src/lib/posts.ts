import "server-only";
import { prisma } from "@/lib/prisma";
import { NO_DB } from "@/lib/db";

// ============================================================
//  لایهٔ دادهٔ بلاگ/مقاله (برای سئو و محتوا).
// ============================================================

export async function getPublishedPosts() {
  if (NO_DB) return [];
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  if (NO_DB) return null;
  return prisma.post.findUnique({ where: { slug } });
}

/* ---------- مدیریت ---------- */
export async function listPosts() {
  return prisma.post.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({ where: { id } });
}
