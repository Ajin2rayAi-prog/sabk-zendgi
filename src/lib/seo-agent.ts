/**
 * seo-agent.ts — خواندنِ خروجی‌های ذخیره‌شدهٔ ایجنت سئو برای نمایش در صفحات.
 *
 * چرا جدا از route.ts: نکست‌جی‌اس در فایلِ route فقط GET/POST و چند exportِ
 * خاص را قبول می‌کند؛ هر exportِ دیگری بیلد را می‌شکند («is not a valid Route
 * export field»). پس منطقِ مشترک اینجاست و route.ts هم از همین می‌خواند.
 */
import fs from "node:fs";
import path from "node:path";

const STORE =
  process.env.SEO_AGENT_STORE || path.join(process.cwd(), "data", "seo-agent.json");

type Page = {
  title?: string; description?: string; canonical?: string;
  schema?: unknown[]; content_pending?: string;
};
type Store = { pages: Record<string, Page>; redirects: Record<string, string> };

function readStore(): Store {
  try {
    const d = JSON.parse(fs.readFileSync(STORE, "utf8"));
    return { pages: d.pages || {}, redirects: d.redirects || {} };
  } catch {
    return { pages: {}, redirects: {} };
  }
}

function keyOf(target: unknown): string {
  let p = String(target ?? "/");
  try { p = new URL(p, "http://x").pathname; } catch { /* مسیر ساده بود */ }
  return ("/" + p.replace(/^\/+/, "")).replace(/\/+$/, "") || "/";
}

/** خروجی آمادهٔ generateMetadata برای این مسیر (نبود → {} و متای پیش‌فرض می‌ماند). */
export function seoAgentMetadata(pathname: string) {
  const page = readStore().pages[keyOf(pathname)];
  if (!page) return {};
  const out: Record<string, unknown> = {};
  if (page.title) out.title = page.title;
  if (page.description) out.description = page.description;
  if (page.canonical) out.alternates = { canonical: page.canonical };
  return out;
}

/** رشتهٔ JSON-LD این مسیر (داخل <script type="application/ld+json">). */
export function seoAgentSchema(pathname: string): string {
  const list = readStore().pages[keyOf(pathname)]?.schema || [];
  if (!list.length) return "";
  const s = list[0];
  return (typeof s === "string" ? s : JSON.stringify(s)).replace(/<\//g, "<\\/");
}

/** مقصد ریدایرکت این مسیر (برای middleware). */
export function seoAgentRedirect(pathname: string): string | null {
  return readStore().redirects[keyOf(pathname)] || null;
}
