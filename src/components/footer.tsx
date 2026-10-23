import Link from "next/link";
import { ShieldCheck, Headset, Truck, MapPin, Phone, Award, Download, Instagram, MessageCircle, Send } from "lucide-react";
import { RouteSheet } from "@/components/route-sheet";
import { siteConfig, type SiteConfig } from "@/config/site";
import type { Category } from "@/data/catalog";
import { sections } from "@/data/catalog";

const socialIcons: Record<string, any> = {
  Instagram,
  MessageCircle,
  Send,
};

export function Footer({ categories, cfg = siteConfig }: { categories: Category[]; cfg?: SiteConfig }) {
  const { brand, contact, footer } = cfg;

  return (
    <footer className="mt-20 border-t bg-primary-deep text-primary-fg">
      {/* نوار اعتماد */}
      <div className="border-b border-white/10">
        <div className="container-lux grid gap-6 py-8 sm:grid-cols-2 md:grid-cols-4">
          {footer.trust.map((t, i) => {
            const Icon = [ShieldCheck, Truck, Headset, Phone][i] ?? ShieldCheck;
            return (
              <div key={t.title} className="flex items-center gap-3">
                <Icon className="h-8 w-8 opacity-90" />
                <span className="text-[15px] font-medium">{t.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-lux grid gap-8 py-12 md:grid-cols-12">
        {/* درباره + آدرس */}
        <div className="md:col-span-4">
          <div className="mb-3 text-2xl font-black">{brand.name}</div>
          <p className="text-sm leading-relaxed opacity-80">{brand.tagline}</p>
          <div className="mt-4 flex items-start gap-2 text-[15px] opacity-80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{contact.address}</span>
          </div>
          {/* لوکیشن + انتخاب اپ مسیریابی گوشی */}
          {contact.mapUrl && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RouteSheet address={contact.address} mapUrl={contact.mapUrl} />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 opacity-80" />
            <a href={`tel:${contact.phone}`} className="font-black hover:opacity-100" dir="ltr">
              {contact.phone}
            </a>
          </div>
          {/* شبکه‌های اجتماعی */}
          <div className="mt-4 flex items-center gap-2">
            {cfg.social.map((s) => {
              const Icon = socialIcons[s.icon] ?? Send;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 transition-colors hover:border-white/60 hover:bg-white/10"
                >
                  <Icon className="h-4.5 w-4.5" />
                </a>
              );
            })}
          </div>
        </div>

        {/* بخش‌های اصلی محصولات (فقط دو بخش) */}
        <div className="md:col-span-3">
          <h4 className="mb-4 text-sm font-bold">دسته‌بندی محصولات</h4>
          <ul className="grid gap-2.5 text-[15px] opacity-85">
            {sections.map((s) => (
              <li key={s.id}>
                <Link href={`/products?section=${s.id}`} className="transition-opacity hover:opacity-100">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* مجوزها */}
        <div className="md:col-span-3">
          <h4 className="mb-4 flex items-center gap-1.5 text-sm font-bold">
            <Award className="h-4 w-4" /> مجوزها
          </h4>
          <ul className="grid gap-2.5 text-[15px] opacity-85">
            {footer.certifications.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-100 hover:underline"
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
          {footer.catalogUrl && (
            <a
              href={footer.catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold transition-colors hover:border-white/60 hover:bg-white/10"
            >
              <Download className="h-4 w-4" /> دانلود کاتالوگ
            </a>
          )}
        </div>

        {/* تماس و سفارش */}
        <div className="md:col-span-2">
          <h4 className="mb-4 text-sm font-bold">تماس و سفارش</h4>
          <ul className="grid gap-2 text-[15px] opacity-85">
            {contact.sales.map((s) => (
              <li key={s.phone} className="flex flex-col gap-0.5">
                <span>{s.name}</span>
                <a href={`tel:${s.phone}`} dir="ltr" className="font-semibold hover:opacity-100">
                  {s.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-lux flex flex-col items-center justify-between gap-2 py-5 text-xs opacity-75 sm:flex-row">
          <span>© {new Date().getFullYear()} {brand.name} — تمامی حقوق محفوظ است.</span>
          <span className="tracking-[0.3em]">{brand.latin}</span>
        </div>
      </div>
    </footer>
  );
}
