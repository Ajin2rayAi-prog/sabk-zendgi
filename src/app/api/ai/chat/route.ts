import { NextResponse } from "next/server";
import { aiChatStream, AiError, isAiReady, type ChatMessage } from "@/lib/ai";
import { getAiConfig, arePricesVisible } from "@/lib/settings";
import { getCategories, getProducts } from "@/lib/shop";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_LEN = 2000;

/** ساخت خلاصهٔ فشردهٔ کاتالوگ تا دستیار محصولات واقعی را پیشنهاد دهد. */
async function buildCatalogContext(): Promise<string> {
  const [categories, products, pricesVisible] = await Promise.all([
    getCategories(),
    getProducts(),
    arePricesVisible(),
  ]);
  const byCat = categories.map((c) => {
    const items = products
      .filter((p) => p.categorySlug === c.slug)
      .slice(0, 8)
      .map((p) => {
        const price = pricesVisible ? formatPrice(p.price) : "استعلام قیمت";
        return `  - ${p.title} (${p.brand}) — ${price} — /product/${p.slug}`;
      })
      .join("\n");
    return `دستهٔ «${c.title}» (/category/${c.slug}):\n${items || "  (بدون محصول)"}`;
  });
  return byCat.join("\n\n");
}

function buildSystemPrompt(catalog: string): string {
  return [
    `تو «مشاور خرید» فروشگاه «${siteConfig.brand.name}» هستی؛ ${siteConfig.brand.tagline}.`,
    `حوزهٔ فعالیت: ${siteConfig.brand.industry}. واحد پول: ${siteConfig.currency.unit}.`,
    "وظیفه: کمک به مشتری برای انتخاب محصول مناسب از میان محصولات موجود فروشگاه.",
    "قواعد:",
    "- فقط محصولاتی را پیشنهاد بده که در فهرست زیر آمده‌اند و لینک محصول را دقیقاً همان‌طور بیاور.",
    "- اگر محصولی در فهرست نیست، صادقانه بگو موجود نیست و پیشنهاد کن با شمارهٔ فروشگاه تماس بگیرند.",
    `- برای قیمت‌های «${siteConfig.features.inquiryLabel}» بگو با شمارهٔ ${siteConfig.contact.phone} تماس بگیرند.`,
    "- کوتاه، دقیق و به زبان فارسی و محترمانه پاسخ بده. توصیهٔ پزشکی نده.",
    "",
    "فهرست محصولات فروشگاه:",
    catalog,
  ].join("\n");
}

function sanitize(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages)) return null;
  const out: ChatMessage[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") return null;
    const role = (m as any).role;
    const content = (m as any).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const trimmed = content.trim().slice(0, MAX_LEN);
    if (trimmed) out.push({ role, content: trimmed });
  }
  return out.length ? out : null;
}

/** پاسخ متنی استریمی با هدرهای مناسب. */
function streamText(text: string): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    }),
    { headers: STREAM_HEADERS },
  );
}

const STREAM_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  }

  const messages = sanitize(body?.messages);
  if (!messages) return NextResponse.json({ error: "پیام نامعتبر" }, { status: 400 });

  if (!(await isAiReady())) {
    return streamText(
      `دستیار هوشمند هنوز فعال نشده است. برای مشاوره و سفارش لطفاً با شمارهٔ ${siteConfig.contact.phone} تماس بگیرید یا از بخش محصولات دیدن کنید.`,
    );
  }

  const system = buildSystemPrompt(await buildCatalogContext());
  const encoder = new TextEncoder();
  const { streaming } = await getAiConfig();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (streaming) {
          // ذره‌ذره (تایپ زنده): هر تکه بلافاصله فرستاده می‌شود
          for await (const chunk of aiChatStream({ system, messages })) {
            controller.enqueue(encoder.encode(chunk));
          }
        } else {
          // یک‌جا: کل پاسخ جمع می‌شود، بعد یک‌باره فرستاده می‌شود
          let full = "";
          for await (const chunk of aiChatStream({ system, messages })) full += chunk;
          controller.enqueue(encoder.encode(full));
        }
      } catch (e) {
        const msg = e instanceof AiError ? e.message : "خطای غیرمنتظره در دستیار هوشمند.";
        controller.enqueue(
          encoder.encode(
            `\n${msg}\nلطفاً بعداً دوباره تلاش کنید یا با ${siteConfig.contact.phone} تماس بگیرید.`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: STREAM_HEADERS });
}
