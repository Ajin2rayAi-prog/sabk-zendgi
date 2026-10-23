import { cn } from "@/lib/utils";

/**
 * تصویرسازی برداری محصول — همیشه و کاملاً آفلاین لود می‌شود (بدون آدرس خارجی).
 * برای هر دستهٔ پوشاک یک طرح اختصاصی رسم می‌شود؛ اگر عکس واقعی
 * (product.image) موجود باشد، در ProductThumb همان اولویت دارد.
 * تنوع رنگ/چرخش بر اساس seed تا کارت‌ها یکنواخت به نظر نرسند.
 */
export function ProductArt({
  categorySlug,
  seed = 0,
  className,
}: {
  categorySlug: string;
  seed?: number;
  className?: string;
}) {
  const tint = 6 - (seed % 5); // اختلاف جزئی روشنایی بین کارت‌ها

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-brand-soft", className)}>
      {/* هالهٔ نور و بافت نقطه‌ای */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgb(var(--c-primary) / 0.10) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <svg
        viewBox="0 0 240 240"
        className="relative h-full w-full"
        role="img"
        aria-hidden="true"
        style={{ filter: `saturate(${100 + tint}%)` }}
      >
        <defs>
          <linearGradient id="pa-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9dee3" />
          </linearGradient>
          <linearGradient id="pa-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgb(var(--c-primary))" />
            <stop offset="1" stopColor="rgb(var(--c-primary-deep))" />
          </linearGradient>
          <radialGradient id="pa-glass" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#cfdce8" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        {/* سایهٔ کف */}
        <ellipse cx="120" cy="205" rx="70" ry="12" fill="rgb(var(--c-primary) / 0.14)" />
        {renderArt(categorySlug)}
      </svg>
    </div>
  );
}

function renderArt(slug: string) {
  switch (slug) {
    // زنانه: مانتو و شومیز
    case "manteau":
    case "shomiz":
    case "pirahan-zanane":
      return ART_FILTER;
    // زنانه: شلوار و ست
    case "shalvar-zanane":
    case "set-zanane":
      return ART_CLUTCH;
    // مردانه: تی‌شرت و پیراهن
    case "tshirt":
    case "pirahan-mardane":
      return ART_FAN;
    // مردانه: شلوار، هودی و کت
    case "shalvar-mardane":
    case "hoodie":
    case "kat-mardane":
      return ART_SHOCK;
    // بچگانه
    case "dokhtarane":
    case "pesarane":
    case "nozadi":
      return ART_BATTERY;
    default:
      return ART_GEAR;
  }
}

/* ---------- فیلتر روغن/هوا: استوانه ---------- */
const ART_FILTER = (
  <g>
    <rect x="82" y="62" width="76" height="116" rx="18" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.35)" strokeWidth="3" />
    <rect x="82" y="100" width="76" height="30" fill="url(#pa-red)" opacity="0.9" />
    <rect x="96" y="62" width="48" height="16" rx="6" fill="url(#pa-red)" />
    <circle cx="120" cy="150" r="10" fill="rgb(var(--c-primary) / 0.25)" />
  </g>
);

/* ---------- چرخ‌دنده موتور ---------- */
const ART_GEAR = (
  <g>
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * Math.PI) / 4;
      const x1 = 120 + 52 * Math.cos(a);
      const y1 = 130 + 52 * Math.sin(a);
      const x2 = 120 + 68 * Math.cos(a);
      const y2 = 130 + 68 * Math.sin(a);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#pa-red)" strokeWidth="14" strokeLinecap="round" />;
    })}
    <circle cx="120" cy="130" r="52" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.4)" strokeWidth="3" />
    <circle cx="120" cy="130" r="22" fill="url(#pa-red)" />
    <circle cx="120" cy="130" r="8" fill="#fff" opacity="0.9" />
  </g>
);

/* ---------- دیسک ترمز ---------- */
const ART_BRAKE_DISC = (
  <g>
    <circle cx="120" cy="130" r="66" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.4)" strokeWidth="3" />
    <circle cx="120" cy="130" r="44" fill="none" stroke="rgb(var(--c-primary) / 0.3)" strokeWidth="10" strokeDasharray="6 10" />
    <circle cx="120" cy="130" r="20" fill="url(#pa-red)" />
    {[0, 72, 144, 216, 288].map((a) => (
      <circle
        key={a}
        cx={120 + 33 * Math.cos((a * Math.PI) / 180)}
        cy={130 + 33 * Math.sin((a * Math.PI) / 180)}
        r="5"
        fill="rgb(var(--c-primary-deep))"
        opacity="0.55"
      />
    ))}
  </g>
);

/* ---------- کمک‌فنر ---------- */
const ART_SHOCK = (
  <g>
    <rect x="108" y="48" width="24" height="60" rx="10" fill="url(#pa-red)" />
    <rect x="112" y="108" width="16" height="70" rx="8" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.4)" strokeWidth="3" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x="96" y={118 + i * 16} width="48" height="8" rx="4" fill="none" stroke="rgb(var(--c-primary) / 0.45)" strokeWidth="4" />
    ))}
    <rect x="104" y="178" width="32" height="16" rx="6" fill="url(#pa-red)" />
  </g>
);

/* ---------- باتری ---------- */
const ART_BATTERY = (
  <g>
    <rect x="66" y="88" width="108" height="88" rx="12" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.4)" strokeWidth="3" />
    <rect x="66" y="88" width="108" height="30" rx="12" fill="url(#pa-red)" opacity="0.92" />
    <rect x="82" y="72" width="18" height="22" rx="5" fill="url(#pa-red)" />
    <rect x="140" y="72" width="18" height="22" rx="5" fill="#3f4750" />
    <text x="120" y="152" textAnchor="middle" fontSize="34" fontWeight="bold" fill="rgb(var(--c-primary-deep))">+</text>
  </g>
);

/* ---------- فن رادیاتور ---------- */
const ART_FAN = (
  <g>
    <circle cx="120" cy="130" r="68" fill="none" stroke="rgb(var(--c-primary) / 0.45)" strokeWidth="10" />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse
        key={a}
        cx="120"
        cy="130"
        rx="16"
        ry="42"
        fill="url(#pa-red)"
        opacity="0.85"
        transform={`rotate(${a} 120 130)`}
      />
    ))}
    <circle cx="120" cy="130" r="18" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.5)" strokeWidth="3" />
  </g>
);

/* ---------- دیسک کلاچ ---------- */
const ART_CLUTCH = (
  <g>
    <circle cx="120" cy="130" r="62" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.4)" strokeWidth="3" />
    <circle cx="120" cy="130" r="40" fill="none" stroke="url(#pa-red)" strokeWidth="14" strokeDasharray="10 8" />
    <circle cx="120" cy="130" r="14" fill="url(#pa-red)" />
    <circle cx="120" cy="130" r="5" fill="#fff" opacity="0.9" />
  </g>
);

/* ---------- چراغ جلو ---------- */
const ART_HEADLIGHT = (
  <g>
    <path d="M56 110 Q 120 92 184 110 L 184 160 Q 120 142 56 160 Z" fill="url(#pa-glass)" stroke="rgb(var(--c-primary) / 0.5)" strokeWidth="3" />
    <circle cx="120" cy="128" r="20" fill="url(#pa-red)" opacity="0.9" />
    <circle cx="120" cy="128" r="9" fill="#fff" opacity="0.95" />
    {[70, 100, 140, 170].map((x) => (
      <line key={x} x1={x} y1={120} x2={x - 18} y2={112} stroke="rgb(var(--c-primary) / 0.35)" strokeWidth="4" strokeLinecap="round" />
    ))}
  </g>
);

/* ---------- تیغه برف‌پاک‌کن ---------- */
const ART_WIPER = (
  <g>
    <rect x="52" y="122" width="136" height="14" rx="7" fill="url(#pa-metal)" stroke="rgb(var(--c-primary) / 0.45)" strokeWidth="3" />
    <rect x="52" y="136" width="136" height="8" rx="4" fill="url(#pa-red)" opacity="0.85" />
    <circle cx="188" cy="129" r="12" fill="url(#pa-red)" />
    <line x1="188" y1="129" x2="188" y2="180" stroke="rgb(var(--c-primary-deep))" strokeWidth="8" strokeLinecap="round" />
  </g>
);
