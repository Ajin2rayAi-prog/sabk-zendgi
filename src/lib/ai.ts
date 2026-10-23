import "server-only";
import { getAiConfig, type AiConfig } from "@/lib/settings";

// ============================================================
//  کلاینت مستقل از ارائه‌دهنده (Provider-agnostic) برای هوش مصنوعی.
//  با fetch ساده و بدون stream کار می‌کند تا در برابر پروکسی مقاوم باشد.
//  پشتیبانی: anthropic / openai / openai-compatible.
// ============================================================

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** خطای قابل‌شناسایی که مسیرهای API به پیام فارسیِ دوستانه تبدیل می‌کنند. */
export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

/** آیا AI فعال و دارای کلید است؟ */
export async function isAiReady(): Promise<boolean> {
  const cfg = await getAiConfig();
  return cfg.enabled && !!cfg.apiKey;
}

const DEFAULT_MODELS: Record<AiConfig["provider"], string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o-mini",
  "openai-compatible": "gpt-4o-mini",
};

function trimTrailingSlash(u: string) {
  return u.replace(/\/+$/, "");
}

type ChatArgs = { system: string; messages: ChatMessage[]; maxTokens?: number };

/** یک دور گفتگو با ارائه‌دهندهٔ پیکربندی‌شده. خروجی = متن پاسخ دستیار. */
export async function aiChat({ system, messages, maxTokens = 1024 }: ChatArgs): Promise<string> {
  const cfg = await getAiConfig();
  if (!cfg.enabled) throw new AiError("هوش مصنوعی غیرفعال است.");
  if (!cfg.apiKey) throw new AiError("کلید API تنظیم نشده است.");

  const model = cfg.model || DEFAULT_MODELS[cfg.provider];

  try {
    if (cfg.provider === "anthropic") {
      return await callAnthropic(cfg, model, system, messages, maxTokens);
    }
    return await callOpenAiCompatible(cfg, model, system, messages, maxTokens);
  } catch (e) {
    if (e instanceof AiError) throw e;
    // خطای شبکه/پروکسی/زمان‌بندی
    throw new AiError(`ارتباط با سرویس هوش مصنوعی ممکن نشد: ${(e as Error).message}`);
  }
}

async function callAnthropic(
  cfg: AiConfig,
  model: string,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const base = trimTrailingSlash(cfg.baseUrl || "https://api.anthropic.com");
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    cache: "no-store",
  });
  if (!res.ok) throw new AiError(await providerErr(res));
  const data = await readJson(res);
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string") throw new AiError("پاسخ نامعتبر از سرویس Anthropic.");
  return text.trim();
}

async function callOpenAiCompatible(
  cfg: AiConfig,
  model: string,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const base = trimTrailingSlash(cfg.baseUrl || "https://api.openai.com/v1");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new AiError(await providerErr(res));
  const data = await readJson(res);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new AiError("پاسخ نامعتبر از سرویس OpenAI.");
  return text.trim();
}

/** بدنهٔ پاسخ را می‌خواند؛ اگر HTML/غیر‌JSON باشد پیام روشن می‌دهد (خطای رایجِ Base URL). */
async function readJson(res: Response): Promise<any> {
  const raw = await res.text();
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("<") || /^text\/html/i.test(res.headers.get("content-type") || "")) {
    throw new AiError(
      "سرویس به‌جای پاسخ معتبر یک صفحهٔ HTML برگرداند. یعنی «آدرس پایه (Base URL)» درست نیست " +
        "یا سرویس پشت فایروال/کلودفلر است. معمولاً باید انتهای آدرس /v1 داشته باشد " +
        "(مثلاً https://gorouter.app/v1).",
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new AiError("پاسخ سرویس قابل‌خواندن نبود (JSON نامعتبر). آدرس پایه و مدل را بررسی کنید.");
  }
}

async function providerErr(res: Response): Promise<string> {
  const raw = await res.text();
  const trimmed = raw.trimStart();
  // صفحهٔ HTML (مثلاً چالش کلودفلر یا آدرس اشتباه)
  if (trimmed.startsWith("<") || /^text\/html/i.test(res.headers.get("content-type") || "")) {
    return `سرویس به‌جای پاسخ، صفحهٔ HTML با کد ${res.status} برگرداند — احتمالاً «آدرس پایه» اشتباه است یا سرویس مسدود/پشت کلودفلر است (اغلب باید /v1 در انتهای آدرس باشد).`;
  }
  let detail = "";
  try {
    const body = JSON.parse(raw);
    detail = body?.error?.message || body?.error?.type || "";
  } catch {
    detail = raw.slice(0, 120);
  }
  return `سرویس هوش مصنوعی خطا برگرداند (${res.status})${detail ? `: ${detail}` : ""}`;
}

// ============================================================
//  حالت استریم (تایپ زنده) — متن پاسخ را تکه‌تکه yield می‌کند.
//  aiChat (بالا) برای مواردی که به متن کامل نیاز است (مثل جستجو) می‌ماند.
// ============================================================

/** خواندن خط‌به‌خط بدنهٔ SSE. */
async function* sseLines(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (line) yield line;
    }
  }
  const last = buf.trim();
  if (last) yield last;
}

function ensureNotHtml(res: Response) {
  if (/text\/html/i.test(res.headers.get("content-type") || "")) {
    throw new AiError(
      "سرویس به‌جای پاسخ معتبر یک صفحهٔ HTML برگرداند. «آدرس پایه (Base URL)» را بررسی کنید (معمولاً باید /v1 داشته باشد).",
    );
  }
}

/** یک دور گفتگوی استریمی؛ تکه‌های متن را yield می‌کند. */
export async function* aiChatStream({
  system,
  messages,
  maxTokens = 1024,
}: ChatArgs): AsyncGenerator<string> {
  const cfg = await getAiConfig();
  if (!cfg.enabled) throw new AiError("هوش مصنوعی غیرفعال است.");
  if (!cfg.apiKey) throw new AiError("کلید API تنظیم نشده است.");
  const model = cfg.model || DEFAULT_MODELS[cfg.provider];

  try {
    if (cfg.provider === "anthropic") {
      yield* streamAnthropic(cfg, model, system, messages, maxTokens);
    } else {
      yield* streamOpenAiCompatible(cfg, model, system, messages, maxTokens);
    }
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError(`ارتباط با سرویس هوش مصنوعی ممکن نشد: ${(e as Error).message}`);
  }
}

async function* streamAnthropic(
  cfg: AiConfig,
  model: string,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
): AsyncGenerator<string> {
  const base = trimTrailingSlash(cfg.baseUrl || "https://api.anthropic.com");
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, stream: true }),
    cache: "no-store",
  });
  if (!res.ok) throw new AiError(await providerErr(res));
  ensureNotHtml(res);
  for await (const line of sseLines(res)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") break;
    try {
      const j = JSON.parse(data);
      if (j.type === "content_block_delta" && typeof j.delta?.text === "string") yield j.delta.text;
    } catch {
      /* خطوط غیرداده نادیده */
    }
  }
}

async function* streamOpenAiCompatible(
  cfg: AiConfig,
  model: string,
  system: string,
  messages: ChatMessage[],
  maxTokens: number,
): AsyncGenerator<string> {
  const base = trimTrailingSlash(cfg.baseUrl || "https://api.openai.com/v1");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new AiError(await providerErr(res));
  ensureNotHtml(res);
  for await (const line of sseLines(res)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") break;
    try {
      const j = JSON.parse(data);
      const delta = j.choices?.[0]?.delta?.content;
      if (typeof delta === "string") yield delta;
    } catch {
      /* خطوط غیرداده نادیده */
    }
  }
}
