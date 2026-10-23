/**
 * route.ts — گیرندهٔ تغییرات ایجنت سئو برای سایت‌های Next.js (App Router).
 *
 * نصب (۳ قدم):
 *   ۱) این فایل را اینجا بگذارید:  app/api/seo-agent/route.ts
 *   ۲) در .env.local رمز را بگذارید:  SEO_AGENT_SECRET=یک-رمز-طولانی-تصادفی
 *   ۳) در پنل ایجنت → «اعمال روی سایت» → Webhook:
 *        URL:    https://your-site.com/api/seo-agent
 *        Secret: همان رمز قدم ۲
 *
 * استفاده از متا در صفحه‌ها (اختیاری ولی توصیه‌شده):
 *   import { seoAgentMetadata, seoAgentSchema } from "@/app/api/seo-agent/route";
 *   export async function generateMetadata() { return seoAgentMetadata("/about"); }
 *
 * دو حالتِ POST: با `dry_run: true` فقط **پیش‌نمایش** برمی‌گردد («الان این است،
 * می‌شود آن») و هیچ چیز نوشته نمی‌شود؛ بی‌آن، تغییر واقعاً می‌نشیند. پنلِ ایجنت
 * اول پیش‌نمایش می‌گیرد تا کاربر بداند دقیقاً چه چیزی را تأیید می‌کند.
 *
 * هشدار میزبانی: روی Vercel و هر میزبان بدون دیسکِ نوشتنی، فایل store پاک
 * می‌شود. آنجا SEO_AGENT_STORE را به یک مسیر نوشتنی بدهید یا به‌جای این مسیر،
 * خروجی فایلیِ پنل را با Pull Request روی مخزن اعمال کنید.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";        // برای HMAC و فایل، Edge کافی نیست
export const dynamic = "force-dynamic";

const SECRET = process.env.SEO_AGENT_SECRET || "";
const STORE = process.env.SEO_AGENT_STORE || path.join(process.cwd(), "data", "seo-agent.json");
const PUBLIC_DIR = process.env.SEO_AGENT_PUBLIC || path.join(process.cwd(), "public");
const MAX_AGE = 900;

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

function writeStore(store: Store) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(store, null, 2), "utf8");
}

function keyOf(target: unknown): string {
  let p = String(target ?? "/");
  try { p = new URL(p, "http://x").pathname; } catch { /* مسیر ساده بود */ }
  return ("/" + p.replace(/^\/+/, "")).replace(/\/+$/, "") || "/";
}

function writePublicFile(name: string, text: string): string {
  const safe = path.basename(name);
  const full = path.join(PUBLIC_DIR, safe);
  if (!path.resolve(full).startsWith(path.resolve(PUBLIC_DIR) + path.sep))
    throw new Error("مسیر مجاز نیست");
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (fs.existsSync(full)) fs.copyFileSync(full, full + ".seo-bak");
  fs.writeFileSync(full, text, "utf8");
  return safe;
}

function applyChange(change: Record<string, unknown>, store: Store) {
  const type = String(change.type || "").toLowerCase().trim();
  const key = keyOf(change.target);
  const raw = change.data;
  const data: Record<string, unknown> = (raw && typeof raw === "object")
    ? raw as Record<string, unknown> : { value: raw };
  const page: Page = store.pages[key] || {};
  const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

  switch (type) {
    case "meta":
    case "meta_description": {
      if (data.title) page.title = str(data.title);
      if (data.description) page.description = str(data.description);
      if (data.canonical) page.canonical = str(data.canonical);
      if (!data.title && !data.description && data.value) page.description = str(data.value);
      store.pages[key] = page;
      return { type, target: key, stored: true };
    }
    case "schema": {
      const schema = data.schema ?? data.json ?? data.value;
      if (!schema) throw new Error("اسکیمای خالی");
      page.schema = [schema];
      store.pages[key] = page;
      return { type, target: key, stored: true };
    }
    case "redirect": {
      const to = str(data.to ?? data.destination ?? data.value);
      if (!to) throw new Error("مقصد ریدایرکت خالی است");
      store.redirects[key] = to;
      return { type, from: key, to };
    }
    case "robots": {
      const text = str(data.content ?? data.value);
      if (!text.trim()) throw new Error("محتوای robots.txt خالی است");
      return { type, file: writePublicFile("robots.txt", text) };
    }
    case "sitemap": {
      const text = str(data.content ?? data.xml ?? data.value);
      if (!text.trim()) throw new Error("محتوای sitemap.xml خالی است");
      const nm = str(data.filename);
      return { type, file: writePublicFile(/^[A-Za-z0-9._-]+\.xml$/.test(nm) ? nm : "sitemap.xml", text) };
    }
    case "content": {
      page.content_pending = str(data.content ?? data.value);
      store.pages[key] = page;
      return { type, target: key, stored: true, note: "روی قالب نوشته نشد." };
    }
    default:
      throw new Error(`نوع تغییر پشتیبانی نمی‌شود: ${type}`);
  }
}

/* ── پیش‌نمایش: «الان چه دارم؟» بی‌آنکه چیزی عوض شود ──────────────────────── */

/** انواعی که این گیرنده می‌پذیرد — پنل این فهرست را در تستِ اتصال می‌بیند. */
const SUPPORTED = ["meta", "meta_description", "schema", "redirect", "content", "robots", "sitemap"];

type PreviewItem = {
  type: string; target: string; field: string; label: string;
  before: string; after: string; note?: string;
  /** اگر false باشد، «اعمال» هم همین را رد می‌کند — دلیلش در note است. */
  willApply: boolean;
};

const LABEL_FA: Record<string, string> = {
  title: "تیتر صفحه", description: "توضیح گوگل", canonical: "آدرس اصلی (canonical)",
  schema: "کد Schema", redirect: "ریدایرکت", content: "متن صفحه",
  robots: "فایل robots.txt", sitemap: "فایل sitemap.xml",
};

const LIVE_TIMEOUT = 6_000;
const LIVE_MAX = 512 * 1024;
const pick = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() ?? "";
const asText = (v: unknown) =>
  v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v, null, 2);

/**
 * همان چیزی که گوگل *امروز* روی این صفحه می‌بیند، از HTMLِ زندهٔ خودِ سایت.
 *
 * چرا از HTML و نه از store: تا ایجنت چیزی نفرستاده باشد store خالی است، ولی
 * صفحه متای خودش را دارد؛ بی‌این خواندن ستونِ «الان» خالی می‌ماند و کاربر
 * نمی‌داند چه چیزی را دارد عوض می‌کند. هر خطا به «چیزی خوانده نشد» ترجمه
 * می‌شود، چون پیش‌نمایشِ نصفه از پیش‌نمایش نبودن بهتر است.
 */
async function readLive(origin: string, pathname: string): Promise<Page> {
  if (!origin) return {};
  let html = "";
  try {
    const res = await fetch(new URL(keyOf(pathname), origin), {
      signal: AbortSignal.timeout(LIVE_TIMEOUT),
      headers: { "user-agent": "seo-agent-preview" },
      cache: "no-store",
    });
    if (!res.ok) return {};
    html = (await res.text()).slice(0, LIVE_MAX);
  } catch {
    return {};
  }
  const out: Page = {};
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) out.title = title;
  const desc =
    pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
    pick(html, /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i);
  if (desc) out.description = desc;
  const canonical = pick(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonical) out.canonical = canonical;
  const ld = pick(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ld) out.schema = [ld.replace(/<\\\//g, "</")];
  return out;
}

/** محتوای فعلیِ فایلِ ثابتِ public (برای ستونِ «الان» در robots/sitemap). */
function readPublicFile(name: string): string {
  try {
    return fs.readFileSync(path.join(PUBLIC_DIR, path.basename(name)), "utf8").slice(0, LIVE_MAX);
  } catch {
    return "";
  }
}

/**
 * فیلدهایی که این تغییر *می‌خواهد* عوض کند — همان تصمیم‌های `applyChange`، ولی
 * بی‌نوشتن. یک جا نگه داشته می‌شوند تا پیش‌نمایش و اعمال از هم جدا نیفتند
 * (پیش‌نمایشی که با اعمال یکی نباشد، از نبودنش بدتر است).
 */
function fieldsOf(data: Record<string, unknown>, type: string) {
  const out: { field: string; after: string }[] = [];
  switch (type) {
    case "meta":
    case "meta_description": {
      if (data.title) out.push({ field: "title", after: asText(data.title) });
      if (data.description) out.push({ field: "description", after: asText(data.description) });
      if (data.canonical) out.push({ field: "canonical", after: asText(data.canonical) });
      if (!data.title && !data.description && data.value)
        out.push({ field: "description", after: asText(data.value) });
      break;
    }
    case "schema": {
      const schema = data.schema ?? data.json ?? data.value;
      if (schema) out.push({ field: "schema", after: asText(schema) });
      break;
    }
    case "redirect": {
      const to = asText(data.to ?? data.destination ?? data.value);
      if (to) out.push({ field: "redirect", after: to });
      break;
    }
    case "content": {
      const c = asText(data.content ?? data.value);
      if (c) out.push({ field: "content", after: c });
      break;
    }
    case "robots": {
      const t = asText(data.content ?? data.value);
      if (t.trim()) out.push({ field: "robots", after: t });
      break;
    }
    case "sitemap": {
      const t = asText(data.content ?? data.xml ?? data.value);
      if (t.trim()) out.push({ field: "sitemap", after: t });
      break;
    }
  }
  return out;
}

/**
 * پیش‌نمایشِ یک تغییر: «الان این است، می‌شود آن». چیزی نوشته نمی‌شود.
 *
 * `live` را فراخوان می‌دهد (خواندنِ HTML شبکه دارد و اینجا باید بی‌شبکه بماند)؛
 * ترتیبِ «الان» این است: اولْ چیزی که ایجنت قبلاً نشانده، بعد چیزی که در HTMLِ
 * زندهٔ صفحه هست.
 */
function previewChange(
  change: Record<string, unknown>, store: Store, live: Page = {},
): PreviewItem[] {
  const type = String(change.type || "").toLowerCase().trim();
  const target = keyOf(change.target);
  const raw = change.data;
  const data: Record<string, unknown> = (raw && typeof raw === "object")
    ? raw as Record<string, unknown> : { value: raw };
  const row = (o: Partial<PreviewItem> & { field: string }): PreviewItem => ({
    type, target, label: LABEL_FA[o.field] ?? o.field,
    before: "", after: "", willApply: true, ...o,
  });

  if (!SUPPORTED.includes(type))
    return [row({ field: type || "?", willApply: false, note: `نوع تغییر پشتیبانی نمی‌شود: ${type}` })];

  const fields = fieldsOf(data, type);
  if (!fields.length)
    return [row({ field: type, willApply: false, note: "این تغییر مقداری برای نشاندن ندارد." })];

  const stored = store.pages[target] || {};
  return fields.map(({ field, after }) => {
    let before = "";
    if (field === "redirect") before = store.redirects[target] || "";
    else if (field === "schema") before = asText(stored.schema?.[0] ?? live.schema?.[0] ?? "");
    else if (field === "content") before = asText(stored.content_pending ?? "");
    else if (field === "robots" || field === "sitemap")
      before = readPublicFile(field === "robots" ? "robots.txt" : "sitemap.xml");
    else {
      const k = field as "title" | "description" | "canonical";
      before = asText(stored[k] ?? live[k] ?? "");
    }
    return row({ field, after, before });
  });
}

/** آدرس خودِ سایت، برای خواندن HTMLِ زندهٔ صفحه در پیش‌نمایش. */
function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET() {
  return NextResponse.json({
    ok: true, receiver: "seo-agent-nextjs", version: 2,
    secret_set: Boolean(SECRET),
    supports: SUPPORTED,
    /** پنل با دیدن این، قبل از تأیید «الان / می‌شود» را از خودِ سایت می‌پرسد. */
    dry_run: true,
  });
}

export async function POST(req: Request) {
  if (!SECRET)
    return NextResponse.json({ ok: false, detail: "SEO_AGENT_SECRET تنظیم نشده است." }, { status: 500 });

  const raw = await req.text();
  if (raw.length > 2 * 1024 * 1024)
    return NextResponse.json({ ok: false, detail: "بستهٔ بزرگ" }, { status: 413 });

  const expected = crypto.createHmac("sha256", SECRET).update(raw, "utf8").digest("hex");
  const got = Buffer.from(req.headers.get("x-seo-signature") || "", "utf8");
  const want = Buffer.from(expected, "utf8");
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want))
    return NextResponse.json({ ok: false, detail: "امضا معتبر نیست" }, { status: 401 });

  let body: { changes?: unknown; ts?: unknown; dry_run?: unknown };
  try { body = JSON.parse(raw); }
  catch { return NextResponse.json({ ok: false, detail: "JSON نامعتبر" }, { status: 400 }); }
  if (!Array.isArray(body.changes))
    return NextResponse.json({ ok: false, detail: "بدنهٔ درخواست changes ندارد" }, { status: 400 });
  const ts = Number(body.ts || 0);
  if (ts > 0 && Math.abs(Date.now() / 1000 - ts) > MAX_AGE)
    return NextResponse.json({ ok: false, detail: "درخواست کهنه است (ts)" }, { status: 400 });

  const store = readStore();
  const changes = body.changes as Record<string, unknown>[];

  // پیش‌نمایش: همان امضا، همان بدنه، ولی **هیچ چیز نوشته نمی‌شود**. پنل با این
  // ستونِ «الان» را پر می‌کند و بعد از کاربر تأیید می‌گیرد.
  if (body.dry_run) {
    const origin = originOf(req);
    const seen = new Map<string, Page>();
    const preview: PreviewItem[] = [];
    for (const ch of changes) {
      const key = keyOf((ch || {}).target);
      if (!seen.has(key)) seen.set(key, await readLive(origin, key));
      preview.push(...previewChange(ch || {}, store, seen.get(key)!));
    }
    return NextResponse.json({ ok: true, dry_run: true, applied: [], preview });
  }

  const applied: unknown[] = [], failed: unknown[] = [];
  for (const ch of changes) {
    try { applied.push(applyChange(ch || {}, store)); }
    catch (e) { failed.push({ type: String((ch || {}).type ?? "?"), detail: (e as Error).message }); }
  }
  try { writeStore(store); }
  catch (e) {
    return NextResponse.json(
      { ok: false, detail: `store قابل نوشتن نیست: ${(e as Error).message}` }, { status: 500 });
  }
  // کش ISR صفحاتِ عوض‌شده را باطل می‌کنیم تا متا/اسکیمای تازه همان لحظه روی
  // سایت زنده دیده شود؛ وگرنه تا revalidate بعدی (۱ ساعت) HTML قدیمی می‌ماند.
  if (applied.length) {
    try {
      const { revalidatePath } = await import("next/cache");
      const paths = new Set(
        changes.map((ch) => keyOf((ch || {}).target)).filter(Boolean));
      for (const p of paths) {
        try { revalidatePath(p); } catch { /* یک مسیر نشد، بقیه ادامه */ }
      }
      revalidatePath("/", "layout");
    } catch { /* revalidate در دسترس نبود؛ کشِ ISR خودش تازه می‌شود */ }
  }
  return NextResponse.json({ ok: !failed.length, applied, failed },
    { status: failed.length ? 207 : 200 });
}
