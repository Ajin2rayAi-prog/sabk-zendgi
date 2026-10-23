import "server-only";
import { prisma } from "@/lib/prisma";
import { NO_DB } from "@/lib/db";
import { siteConfig, type SiteConfig } from "@/config/site";

// ============================================================
//  محتوای سایت — مدیریت از پنل (/admin/content).
//  همه‌چیز در جدول Setting با پیشوند site. ذخیره می‌شود؛
//  هر کلیدِ ذخیره‌نشده از siteConfig (پیش‌فرض کد) می‌آید.
//  تغییر از پنل با revalidateShop بلافاصله روی سایت می‌نشیند.
// ============================================================

function lines(v: string | undefined): string[] {
  return (v ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLinks(v: string | undefined, fallback: { label: string; href: string }[]) {
  const out = lines(v)
    .map((l) => {
      const i = l.indexOf("|");
      if (i < 0) return null;
      return { label: l.slice(0, i).trim(), href: l.slice(i + 1).trim() };
    })
    .filter((x): x is { label: string; href: string } => !!x && !!x.label && !!x.href);
  return out.length ? out : fallback;
}

// ============================================================
//  محتوای صفحات درباره ما و خدمات — متن‌ها از پنل، آیکون‌ها ثابت.
//  قالب هر خط: «عنوان | توضیح». تعداد از پیش‌فرض بیشتر/کمتر شود،
/// با پیش‌فرض‌ها پر/برش می‌خورد تا چیدمان صفحه به‌هم نریزد.
// ============================================================

export type TextItem = { title: string; desc: string };

function parsePaired(v: string | undefined, fallback: TextItem[]): TextItem[] {
  const rows = lines(v)
    .map((l) => {
      const i = l.indexOf("|");
      if (i < 0) return null;
      const title = l.slice(0, i).trim();
      const desc = l.slice(i + 1).trim();
      return title && desc ? { title, desc } : null;
    })
    .filter((x): x is TextItem => !!x);
  if (!rows.length) return fallback;
  return fallback.map((fb, i) => rows[i] ?? fb);
}

const ABOUT_DEFAULTS = {
  intro:
    "فروشگاه سبک زندگی با تمرکز بر پوشاک خانوادگی، برای زن‌ها، مردها و بچه‌ها لباس‌هایی با پارچهٔ باکیفیت و دوخت تمیز عرضه می‌کند. ما باور داریم یک خرید خوب یعنی سایز درست، جنس ماندگار و احترام به سلیقهٔ هر عضو خانواده.",
  stats: [
    { value: "+۱۲", label: "سال تجربه" },
    { value: "+۴۰", label: "قلم کالای منتخب" },
    { value: "+۲۰۰۰", label: "مشتری وفادار" },
    { value: "۲۴/۷", label: "پشتیبانی" },
  ],
  cards: [
    { title: "ماموریت ما", desc: "عرضهٔ پوشاک خانوادگی باکیفیت و خوش‌دوخت با قیمت منصفانه، همراه با مشاورهٔ رایگان انتخاب سایز برای همهٔ اعضای خانواده." },
    { title: "چشم‌انداز", desc: "تبدیل‌شدن به فروشگاه پوشاک خانوادگی محبوب خانواده‌های ایرانی و ارتقای تجربهٔ خرید آنلاین لباس." },
    { title: "ارزش‌های ما", desc: "کیفیت پارچه و دوخت، صداقت در قیمت، تعویض سایز بی‌دردسر و احترام به مشتری؛ اصولی که هرگز از آن‌ها کوتاه نمی‌آییم." },
  ],
  why: [
    { title: "کیفیت و دوخت تضمین‌شده", desc: "تمام لباس‌ها با ضمانت کیفیت پارچه و دوخت عرضه می‌شوند." },
    { title: "قیمت رقابتی", desc: "خرید مستقیم از تولیدکننده؛ بهترین قیمت بازار." },
    { title: "ارسال سراسر کشور", desc: "تحویل سریع و مطمئن به تمام نقاط ایران." },
    { title: "تعویض سایز آسان", desc: "اگر سایز مناسب نبود، تعویضش با ما؛ ساده و بی‌دردسر." },
  ],
};

const SERVICES_DEFAULTS = {
  women: [
    { title: "کالکشن زنانه", desc: "مانتو، شومیز، پیراهن، شلوار، دامن و ست‌های زنانه با پارچه‌های فصلی و دوخت تمیز." },
    { title: "مشاورهٔ انتخاب سایز", desc: "راهنمای دقیق سایز و فرم بدن؛ قبل از خرید با ما مشورت کنید تا بهترین فیت را بگیرید." },
    { title: "تعویض سایز", desc: "اگر سایز مناسب نبود، تا ۷ روز تعویض سایز بدون دردسر انجام می‌شود." },
    { title: "ارسال سراسر کشور", desc: "تحویل سریع و مطمئن به تمام نقاط ایران با بسته‌بندی شکیل." },
  ],
  men: [
    { title: "کالکشن مردانه", desc: "تی‌شرت، پیراهن، شلوار، هودی و کت مردانه؛ از استایل روزمره تا رسمی." },
    { title: "مشاورهٔ استایل و سایز", desc: "کمک برای انتخاب سایز و ست‌کردن لباس‌ها بر اساس فرم بدن و سلیقهٔ شما." },
    { title: "ضمانت دوخت", desc: "همهٔ لباس‌های مردانه با ضمانت کیفیت دوخت و ثبات رنگ عرضه می‌شوند." },
    { title: "پشتیبانی پس از فروش", desc: "پیگیری سفارش و پاسخ‌گویی سریع پس از خرید." },
  ],
  kids: [
    { title: "کالکشن بچگانه", desc: "لباس دخترانه و پسرانه و نوزادی؛ لطیف، راحت و مقاوم در برابر بازی و شست‌وشو." },
    { title: "مشاورهٔ سایز کودک", desc: "جدول سایز بر اساس سن و قد کودک؛ برای انتخاب درست کنارتان هستیم." },
    { title: "پارچهٔ ضدحساسیت", desc: "برای نوزادان و کودکان از پارچه‌های نرم و ضدحساسیت استفاده می‌شود." },
    { title: "تعویض سایز رشد", desc: "اگر سایز کوچک یا بزرگ بود، تعویض سایز به‌سادگی انجام می‌شود." },
  ],
  perks: [
    { title: "کیفیت و دوخت", desc: "تمام محصولات با ضمانت کیفیت پارچه و دوخت هستند." },
    { title: "تحویل سریع", desc: "ارسال به سراسر کشور در کوتاه‌ترین زمان." },
    { title: "پشتیبانی دائمی", desc: "پاسخ‌گویی و مشاورهٔ انتخاب سایز پس از خرید." },
  ],
};

export type AboutContent = typeof ABOUT_DEFAULTS;
export type ServicesContent = typeof SERVICES_DEFAULTS;

function parseStats(v: string | undefined, fallback: { value: string; label: string }[]) {
  const rows = lines(v)
    .map((l) => {
      const i = l.indexOf("|");
      if (i < 0) return null;
      const value = l.slice(0, i).trim();
      const label = l.slice(i + 1).trim();
      return value && label ? { value, label } : null;
    })
    .filter((x): x is { value: string; label: string } => !!x);
  if (!rows.length) return fallback;
  return fallback.map((fb, i) => rows[i] ?? fb);
}

/** محتوای صفحات درباره ما و خدمات (با پیش‌فرض‌های فعلی) */
export async function getPageContent(): Promise<{ about: AboutContent; services: ServicesContent }> {
  if (NO_DB) return { about: ABOUT_DEFAULTS, services: SERVICES_DEFAULTS };
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: "site." } } });
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const g = (k: string, fb: string) => {
    const v = m.get(k)?.trim();
    return v ? v : fb;
  };
  return {
    about: {
      intro: g("site.about.intro", ABOUT_DEFAULTS.intro),
      stats: parseStats(m.get("site.about.stats"), ABOUT_DEFAULTS.stats),
      cards: parsePaired(m.get("site.about.cards"), ABOUT_DEFAULTS.cards),
      why: parsePaired(m.get("site.about.why"), ABOUT_DEFAULTS.why),
    },
    services: {
      // کلیدهای ذخیره‌سازی پنل همان fanni/badaneh قبلی‌اند و به‌ترتیب روی
      // بخش‌های زنانه/مردانه نگاشت می‌شوند؛ بخش بچگانه پیش‌فرض کدی دارد.
      women: parsePaired(m.get("site.services.fanni"), SERVICES_DEFAULTS.women),
      men: parsePaired(m.get("site.services.badaneh"), SERVICES_DEFAULTS.men),
      kids: SERVICES_DEFAULTS.kids,
      perks: parsePaired(m.get("site.services.perks"), SERVICES_DEFAULTS.perks),
    },
  };
}

/** قالب نمایشی «عنوان | توضیح» برای فرم پنل */
export function toPairedLines(items: TextItem[]): string {
  return items.map((i) => `${i.title} | ${i.desc}`).join("\n");
}

/** پیکربندی نهایی سایت: پیش‌فرض‌های کد + رونویسی پنل */
export async function getSiteConfig(): Promise<SiteConfig> {
  if (NO_DB) return siteConfig;
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: "site." } } });
  if (!rows.length) return siteConfig;
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const g = (k: string, fb: string) => {
    const v = m.get(k)?.trim();
    return v ? v : fb;
  };

  let sales = siteConfig.contact.sales;
  try {
    const raw = m.get("site.contact.sales")?.trim();
    if (raw) {
      const arr = JSON.parse(raw) as { name: string; phone: string }[];
      if (Array.isArray(arr) && arr.length) sales = arr;
    }
  } catch {}

  const social = [...siteConfig.social];
  const ig = m.get("site.social.instagram")?.trim();
  const wa = m.get("site.social.whatsapp")?.trim();
  const tg = m.get("site.social.telegram")?.trim();
  for (const s of social) {
    if (s.icon === "Instagram" && ig) s.href = ig;
    if (s.icon === "MessageCircle" && wa) s.href = wa;
    if (s.icon === "Send" && tg) s.href = tg;
  }

  return {
    ...siteConfig,
    brand: {
      ...siteConfig.brand,
      name: g("site.brand.name", siteConfig.brand.name),
      tagline: g("site.brand.tagline", siteConfig.brand.tagline),
    },
    contact: {
      phone: g("site.contact.phone", siteConfig.contact.phone),
      sales,
      address: g("site.contact.address", siteConfig.contact.address),
      mapUrl: g("site.contact.mapUrl", siteConfig.contact.mapUrl ?? ""),
    },
    hero: {
      eyebrow: g("site.hero.eyebrow", siteConfig.hero.eyebrow),
      title: g("site.hero.title", siteConfig.hero.title),
      highlight: g("site.hero.highlight", siteConfig.hero.highlight),
      subtitle: g("site.hero.subtitle", siteConfig.hero.subtitle),
      ctaPrimary: {
        label: g("site.hero.cta1label", siteConfig.hero.ctaPrimary.label),
        href: g("site.hero.cta1href", siteConfig.hero.ctaPrimary.href),
      },
      ctaSecondary: {
        label: g("site.hero.cta2label", siteConfig.hero.ctaSecondary.label),
        href: g("site.hero.cta2href", siteConfig.hero.ctaSecondary.href),
      },
    },
    social,
    footer: {
      certifications: parseLinks(m.get("site.footer.certs"), siteConfig.footer.certifications),
      links: parseLinks(m.get("site.footer.links"), siteConfig.footer.links),
      catalogUrl: siteConfig.footer.catalogUrl,
      trust: (() => {
        const titles = lines(m.get("site.footer.trust"));
        if (!titles.length) return siteConfig.footer.trust;
        return siteConfig.footer.trust.map((fb, i) => ({ title: titles[i] ?? fb.title, desc: "" }));
      })(),
    },
  };
}
