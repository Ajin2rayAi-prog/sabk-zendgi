import "server-only";
import { prisma } from "@/lib/prisma";
import { NO_DB } from "@/lib/db";

// ============================================================
//  پیکربندی هوش مصنوعی — روی جدول Setting (کلید/مقدار) ذخیره می‌شود.
//  کلید API فقط سمت سرور خوانده می‌شود و هرگز به کلاینت برنمی‌گردد.
// ============================================================

export type AiProvider = "anthropic" | "openai" | "openai-compatible";

export type AiConfig = {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string; // خالی = پیش‌فرض هر ارائه‌دهنده
  apiKey: string;
  model: string;
  streaming: boolean; // true = پاسخ ذره‌ذره (تایپ زنده)، false = یک‌جا
};

const KEYS = {
  enabled: "ai.enabled",
  provider: "ai.provider",
  baseUrl: "ai.baseUrl",
  apiKey: "ai.apiKey",
  model: "ai.model",
  streaming: "ai.streaming",
  pricesVisible: "shop.pricesVisible",
  featuredVisible: "shop.featuredVisible",
  homePriceList: "shop.homePriceList",
} as const;

const DEFAULTS: AiConfig = {
  enabled: false,
  provider: "anthropic",
  baseUrl: "",
  apiKey: "",
  model: "",
  streaming: true,
};

function isProvider(v: string): v is AiProvider {
  return v === "anthropic" || v === "openai" || v === "openai-compatible";
}

/** خواندن پیکربندی AI از دیتابیس (با مقادیر پیش‌فرض امن). */
export async function getAiConfig(): Promise<AiConfig> {
  if (NO_DB) return { ...DEFAULTS, apiKey: process.env.AI_API_KEY || "" };
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const provider = map.get(KEYS.provider) ?? "";
  const apiKey = map.get(KEYS.apiKey) || process.env.AI_API_KEY || "";

  return {
    enabled: map.get(KEYS.enabled) === "true",
    provider: isProvider(provider) ? provider : DEFAULTS.provider,
    baseUrl: map.get(KEYS.baseUrl) ?? DEFAULTS.baseUrl,
    apiKey,
    model: map.get(KEYS.model) ?? DEFAULTS.model,
    // پیش‌فرض روشن؛ فقط وقتی صریحاً "false" ذخیره شده باشد خاموش می‌شود
    streaming: map.get(KEYS.streaming) !== "false",
  };
}

/** آیا در فرم ادمین کلیدی ذخیره شده است؟ (برای نمایش «تنظیم‌شده») */
export async function hasStoredApiKey(): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: KEYS.apiKey } });
  return !!row?.value || !!process.env.AI_API_KEY;
}

async function upsert(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * ذخیرهٔ پیکربندی AI. اگر `apiKey` از ورودی حذف/undefined باشد،
 * کلید قبلی دست‌نخورده می‌ماند (فرم ادمین هرگز کلید را پیش‌پر نمی‌کند).
 */
export async function saveAiConfig(partial: {
  enabled?: boolean;
  provider?: AiProvider;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  streaming?: boolean;
}): Promise<void> {
  if (partial.enabled !== undefined) await upsert(KEYS.enabled, partial.enabled ? "true" : "false");
  if (partial.provider !== undefined) await upsert(KEYS.provider, partial.provider);
  if (partial.baseUrl !== undefined) await upsert(KEYS.baseUrl, partial.baseUrl.trim());
  if (partial.model !== undefined) await upsert(KEYS.model, partial.model.trim());
  if (partial.streaming !== undefined)
    await upsert(KEYS.streaming, partial.streaming ? "true" : "false");
  // کلید فقط وقتی به‌روزرسانی می‌شود که مقدار غیرخالی داده شود
  if (partial.apiKey !== undefined && partial.apiKey.trim() !== "") {
    await upsert(KEYS.apiKey, partial.apiKey.trim());
  }
}

/* ============================================================
   نمایش قیمت‌ها — نوسانات ارز
   وقتی pricesVisible=false باشد، همهٔ محصولات در سایت
   «استعلام قیمت» نشان داده می‌شوند و شماره تماس عرضه می‌شود.
   وقتی true باشد، قیمت‌های ذخیره‌شده نمایش داده می‌شوند.
   ============================================================ */

/** آیا نمایش قیمت‌ها در سایت فعال است؟ (پیش‌فرض: فعال) */
export async function arePricesVisible(): Promise<boolean> {
  if (NO_DB) return true;
  const row = await prisma.setting.findUnique({ where: { key: KEYS.pricesVisible } });
  // فقط وقتی صریحاً "false" ذخیره شده باشد، قیمت‌ها مخفی می‌شوند
  return row?.value !== "false";
}

export async function setPricesVisible(visible: boolean): Promise<void> {
  await upsert(KEYS.pricesVisible, visible ? "true" : "false");
}

/** نام مستعار برای پنل ادمین (خواناتر) */
export const getPricesVisible = arePricesVisible;

/* ============================================================
   نمایش سکشن «محصولات منتخب» در صفحهٔ اول
   وقتی false باشد، کل سکشن از صفحهٔ اول حذف می‌شود.
   ============================================================ */

/** آیا سکشن محصولات منتخب نمایش داده شود؟ (پیش‌فرض: فعال) */
export async function areFeaturedVisible(): Promise<boolean> {
  if (NO_DB) return true;
  const row = await prisma.setting.findUnique({ where: { key: KEYS.featuredVisible } });
  return row?.value !== "false";
}

export async function setFeaturedVisible(visible: boolean): Promise<void> {
  await upsert(KEYS.featuredVisible, visible ? "true" : "false");
}

/** نام مستعار برای پنل ادمین (خواناتر) */
export const getFeaturedVisible = areFeaturedVisible;

/* ============================================================
   نمایش سکشن «لیست قیمت» در صفحهٔ اول (پیش‌نمایش)
   پیش‌فرض خاموش است؛ از پنل روشن می‌شود. صفحهٔ /price-list جدا می‌ماند.
   ============================================================ */

/** آیا پیش‌نمایش لیست قیمت در صفحهٔ اول نمایش داده شود؟ (پیش‌فرض: مخفی) */
export async function areHomePriceListVisible(): Promise<boolean> {
  if (NO_DB) return false;
  const row = await prisma.setting.findUnique({ where: { key: KEYS.homePriceList } });
  return row?.value === "true";
}

export async function setHomePriceListVisible(visible: boolean): Promise<void> {
  await upsert(KEYS.homePriceList, visible ? "true" : "false");
}

/** نام مستعار برای پنل ادمین (خواناتر) */
export const getHomePriceListVisible = areHomePriceListVisible;
