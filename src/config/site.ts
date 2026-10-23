/**
 * ============================================================
 *  پیکربندی مرکزی فروشگاه (White-Label)
 *  برای راه‌اندازی فروشگاه برای هر برند/حوزهٔ دیگر، فقط این فایل
 *  و داده‌های catalog تغییر می‌کند؛ کل طراحی و کد ثابت می‌ماند.
 * ============================================================
 */

export type SiteConfig = {
  url: string; // آدرس کامل سایت (برای سئو/نقشهٔ سایت) — با NEXT_PUBLIC_SITE_URL بازنویسی می‌شود
  brand: {
    name: string; // نام فارسی برند
    latin: string; // نام لاتین (فوتر/واترمارک)
    logoText: string; // حرف/متن لوگو
    tagline: string; // شعار کوتاه
    industry: string; // حوزهٔ فعالیت (قابل تغییر برای هر صنف)
  };
  /** رنگ‌ها به‌صورت «R G B» تا در CSS Variable تزریق شوند */
  theme: {
    primary: string;
    primaryDeep: string;
    primarySoft: string;
    primaryFg: string; // رنگ متن روی primary
    accent: string; // رنگ تأکیدی لوکس (طلایی/…)
  };
  currency: {
    unit: string; // واحد پول (ریال / تومان / …)
    locale: string;
  };
  contact: {
    phone: string; // شمارهٔ ثابت اصلی
    sales: { name: string; phone: string }[];
    address: string;
    mapUrl?: string; // لینک مسیریابی (گوگل‌مپ/نشان) — دکمه «مسیریابی» در فوتر و تماس
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
  };
  features: {
    ai: boolean;
    priceList: boolean;
    cart: boolean; // سبد خرید و افزودن محصول
    checkout: boolean; // ثبت سفارش آنلاین
    auth: boolean; // ورود مشتری با موبایل + کد
    inquiryLabel: string; // متن «استعلام» برای محصولات بدون قیمت
  };
  /** لینک‌های اصلی هدر */
  nav: {
    label: string;
    href: string;
  }[];
  /** شبکه‌های اجتماعی (فوتر + هدر) */
  social: {
    label: string;
    href: string;
    icon: string; // نام آیکون lucide
  }[];
  /** بخش‌های فوتر */
  footer: {
    certifications: { label: string; href: string }[];
    links: { label: string; href: string }[];
    catalogUrl?: string;
    trust: { title: string; desc: string }[]; // نوار اعتبار بالای فوتر
  };
};

/** --- نمونهٔ فعال: سبک زندگی (پوشاک خانوادگی) ---
 *  ⚠ PLACEHOLDER — شماره‌ها، آدرس، لینک‌های شبکه‌های اجتماعی و mapUrl
 *  باید با اطلاعات واقعی کارفرما جایگزین شوند. */
export const siteConfig: SiteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4320",
  brand: {
    name: "سبک زندگی",
    latin: "SABK ZENDGI",
    logoText: "س",
    tagline: "فروشگاه لباس خانوادگی — زنانه، مردانه، بچگانه",
    industry: "پوشاک",
  },
  theme: {
    primary: "147 197 114", // #93C572 سبز پسته‌ای
    primaryDeep: "94 140 74", // #5E8C4A سبز پسته‌ای تیره
    primarySoft: "228 240 218", // #E4F0DA سبز پسته‌ای روشن
    primaryFg: "255 255 255",
    accent: "197 160 84", // طلایی گرم
  },
  currency: {
    unit: "ریال",
    locale: "fa-IR",
  },
  contact: {
    phone: "۰۲۱-۰۰۰۰۰۰۰۰", // ⚠ PLACEHOLDER — شمارهٔ ثابت واقعی کارفرما
    sales: [
      // ⚠ PLACEHOLDER — نام و موبایل فروش واقعی کارفرما
      { name: "فروشگاه سبک زندگی", phone: "۰۹۰۰۰۰۰۰۰۰۰" },
    ],
    address: "تهران، خیابان ... (⚠ PLACEHOLDER — آدرس دقیق از کارفرما)",
    mapUrl: "", // ⚠ PLACEHOLDER — لینک مسیریابی گوگل‌مپ/نشان از کارفرما
  },
  hero: {
    eyebrow: "فروشگاه لباس خانوادگی",
    title: "استایل تازه برای",
    highlight: "همهٔ خانواده",
    subtitle:
      "پوشاک زنانه، مردانه و بچگانه با دوخت تمیز و پارچهٔ باکیفیت؛ از مانتو و شومیز تا تی‌شرت و لباس نوزادی — با تعویض سایز آسان و ارسال به سراسر کشور.",
    ctaPrimary: { label: "مشاهدهٔ محصولات", href: "/products" },
    ctaSecondary: { label: "پوشاک زنانه", href: "/products?section=women" },
  },
  features: {
    ai: false,
    priceList: false,
    cart: true,
    checkout: true,
    auth: true,
    inquiryLabel: "استعلام",
  },
  /** لینک‌های اصلی هدر — «محصولات» با مگامنو دو ستونه باز می‌شود */
  nav: [
    { label: "خانه", href: "/" },
    { label: "محصولات", href: "/products" },
    { label: "خدمات", href: "/services" },
    { label: "درباره ما", href: "/about" },
    { label: "دانشنامه", href: "/blog" },
    { label: "تماس با ما", href: "/contact" },
    { label: "همکاری با ما", href: "/partners" },
  ],
  /** شبکه‌های اجتماعی — ⚠ PLACEHOLDER: لینک‌های واقعی از کارفرما */
  social: [
    { label: "اینستاگرام", href: "#", icon: "Instagram" },
    { label: "واتساپ", href: "#", icon: "MessageCircle" },
    { label: "تلگرام", href: "#", icon: "Send" },
  ],
  /** بخش‌های فوتر */
  footer: {
    certifications: [
      { label: "ضمانت کیفیت و دوخت", href: "/about" },
      { label: "ارسال به سراسر کشور", href: "/about" },
      { label: "تعویض سایز آسان", href: "/about" },
    ],
    links: [
      { label: "قوانین فروش", href: "/about" },
      { label: "نحوه ارسال", href: "/about" },
      { label: "حریم خصوصی", href: "/about" },
    ],
    catalogUrl: undefined,
    trust: [
      { title: "ضمانت کیفیت و دوخت", desc: "" },
      { title: "ارسال به سراسر کشور", desc: "" },
      { title: "تعویض سایز آسان", desc: "" },
      { title: "پشتیبانی و مشاورهٔ انتخاب سایز", desc: "" },
    ],
  },
};
