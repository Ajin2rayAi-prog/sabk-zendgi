import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import { getProducts, getCategories } from "@/lib/shop";
import { getPublishedPosts } from "@/lib/posts";

// کاتالوگ بدون ری‌دیپلوی تغییر می‌کند؛ sitemap کش سبک (ISR) می‌شود و
// هر ساعت نوسازه می‌شود تا سربار دیتابیس روی هر خزش گوگل نیاید.
export const revalidate = 3600;

const STATIC_PATHS = ["", "/products", "/price-list", "/blog"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [products, categories, posts] = await Promise.all([
    getProducts().catch(() => []),
    getCategories().catch(() => []),
    getPublishedPosts().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: p ? absoluteUrl(p) : SITE_URL,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/category/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/product/${p.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updatedAt ?? post.createdAt ?? now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...postEntries];
}
