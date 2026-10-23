import "server-only";
import { getProducts, getCategories } from "@/lib/shop";
import { isAiReady, aiChat } from "@/lib/ai";
import type { Product } from "@/data/catalog";

// ============================================================
//  جستجوی هوشمند: کلمه‌ایِ سریع (همیشه کار می‌کند) + بهبود با AI.
//  کاتالوگ کوچک است، پس در حافظه امتیازدهی می‌کنیم (robust و آفلاین).
// ============================================================

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ً-ْ‌]/g, " ") // اعراب و نیم‌فاصله
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
}

function tokenize(q: string): string[] {
  return Array.from(
    new Set(
      normalize(q)
        .split(/\s+/)
        .filter((t) => t.length >= 2),
    ),
  );
}

export type SearchResult = {
  products: Product[];
  tokens: string[];
  aiUsed: boolean;
};

/** امتیاز تطبیق یک محصول با مجموعه‌ای از توکن‌ها. */
function scoreProduct(p: Product, catTitle: string, tokens: string[]): number {
  const title = normalize(p.title);
  const brand = normalize(p.brand);
  const tags = normalize((p.tags ?? []).join(" "));
  const desc = normalize(p.description ?? "");
  const cat = normalize(catTitle);
  let score = 0;
  for (const t of tokens) {
    if (title.includes(t)) score += 5;
    if (brand.includes(t)) score += 3;
    if (tags.includes(t)) score += 2;
    if (desc.includes(t)) score += 2;
    if (cat.includes(t)) score += 1;
  }
  return score;
}

/** از AI می‌خواهیم پرسش آزاد را به کلمات کلیدی مرتبط گسترش دهد (اختیاری، غیرمسدودکننده). */
async function aiRefine(q: string, categoryTitles: string[]): Promise<string[]> {
  const system = [
    "تو موتور کمکی جستجوی یک فروشگاه پوشاک خانوادگی هستی.",
    "پرسش کاربر را به فهرست کوتاهی از کلمات کلیدی فارسی مرتبط (شامل مترادف‌ها و نام دسته) گسترش بده.",
    `دسته‌های موجود: ${categoryTitles.join("، ")}.`,
    'فقط JSON معتبر به شکل {"keywords":["..."]} برگردان و هیچ متن اضافه‌ای ننویس.',
  ].join("\n");
  const reply = await aiChat({
    system,
    messages: [{ role: "user", content: q }],
    maxTokens: 200,
  });
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.keywords)) return [];
  return parsed.keywords.filter((k: unknown): k is string => typeof k === "string").slice(0, 12);
}

export async function searchProducts(q: string): Promise<SearchResult> {
  const baseTokens = tokenize(q);
  if (baseTokens.length === 0) return { products: [], tokens: [], aiUsed: false };

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const catTitle = new Map(categories.map((c) => [c.slug, c.title]));

  let tokens = baseTokens;
  let aiUsed = false;

  // بهبود با AI فقط وقتی فعال باشد؛ خطا مسدودکننده نیست.
  if (await isAiReady()) {
    try {
      const extra = await aiRefine(q, categories.map((c) => c.title));
      if (extra.length) {
        const extraTokens = extra.flatMap((k) => tokenize(k));
        tokens = Array.from(new Set([...baseTokens, ...extraTokens]));
        aiUsed = true;
      }
    } catch {
      /* بازگشت به توکن‌های خام */
    }
  }

  const ranked = products
    .map((p) => ({ p, score: scoreProduct(p, catTitle.get(p.categorySlug) ?? "", tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  return { products: ranked, tokens, aiUsed };
}
