import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin";
import { aiChatStream, AiError, isAiReady, type ChatMessage } from "@/lib/ai";
import { getAiConfig } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_LEN = 4000;

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

async function buildContext(): Promise<string> {
  const [products, categories, orders, pending, customers] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.customer.count(),
  ]);
  return [
    `آمار فروشگاه «${siteConfig.brand.name}»:`,
    `- محصولات: ${products}`,
    `- دسته‌ها: ${categories}`,
    `- سفارش‌ها: ${orders} (در انتظار تأیید: ${pending})`,
    `- مشتریان: ${customers}`,
  ].join("\n");
}

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

export async function POST(req: Request) {
  // دستیار پنل هزینه دارد — فقط مالک
  try {
    await requireOwner();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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
      "دستیار هوشمند فعال نیست. از بخش «تنظیمات» پنل، هوش مصنوعی را فعال و کلید API را وارد کنید.",
    );
  }

  const system = [
    `تو دستیار هوشمند مدیر فروشگاه «${siteConfig.brand.name}» در پنل مدیریت هستی.`,
    "به مدیر در تحلیل فروشگاه، نگارش توضیحات محصول، ایده‌های فروش و راهنمایی کار با پنل کمک کن.",
    "پاسخ‌ها کوتاه، عملی و به زبان فارسی باشند.",
    "",
    await buildContext(),
  ].join("\n");

  const encoder = new TextEncoder();
  const { streaming } = await getAiConfig();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (streaming) {
          for await (const chunk of aiChatStream({ system, messages, maxTokens: 1500 })) {
            controller.enqueue(encoder.encode(chunk));
          }
        } else {
          let full = "";
          for await (const chunk of aiChatStream({ system, messages, maxTokens: 1500 })) full += chunk;
          controller.enqueue(encoder.encode(full));
        }
      } catch (e) {
        const msg = e instanceof AiError ? e.message : "خطای غیرمنتظره.";
        controller.enqueue(encoder.encode(`\n${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: STREAM_HEADERS });
}
