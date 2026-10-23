import { NextResponse } from "next/server";
import { aiChatStream, AiError, isAiReady } from "@/lib/ai";
import { getApprovedReviews } from "@/lib/reviews";
import { getProductBySlug } from "@/lib/shop";

export const dynamic = "force-dynamic";

const STREAM_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

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

/** خلاصهٔ نظرات یک محصول با هوش مصنوعی (استریمی). */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  }
  const slug = String(body?.slug ?? "").trim();
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });

  const reviews = await getApprovedReviews(slug);
  if (reviews.length === 0) return streamText("هنوز نظری برای خلاصه‌کردن ثبت نشده است.");
  if (!(await isAiReady())) return streamText("خلاصهٔ هوشمند در دسترس نیست.");

  const list = reviews
    .slice(0, 40)
    .map((r) => `- (${r.rating}/5) ${r.comment}`)
    .join("\n");

  const system = [
    "تو دستیار جمع‌بندی نظرات یک فروشگاه پوشاک خانوادگی هستی.",
    "بر اساس نظرات کاربران دربارهٔ یک محصول، یک خلاصهٔ کوتاه، منصفانه و فارسی بنویس:",
    "- ۲ تا ۳ جملهٔ کلی دربارهٔ برداشت کاربران.",
    "- سپس «نکات مثبت» و «نکات قابل‌بهبود» را در چند بولت کوتاه بیاور (اگر وجود داشت).",
    "- فقط بر پایهٔ همین نظرها بنویس و چیزی از خودت اضافه نکن.",
  ].join("\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of aiChatStream({
          system,
          messages: [{ role: "user", content: `محصول: ${product.title}\n\nنظرات:\n${list}` }],
          maxTokens: 500,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        const msg = e instanceof AiError ? e.message : "خطا در تهیهٔ خلاصه.";
        controller.enqueue(encoder.encode(`\n${msg}`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: STREAM_HEADERS });
}
