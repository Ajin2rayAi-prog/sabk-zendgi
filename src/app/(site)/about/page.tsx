import { ShieldCheck, Target, Eye, Users, Award, Truck, Headset } from "lucide-react";
import { getSiteConfig, getPageContent } from "@/lib/site-content";
import { toFa } from "@/lib/utils";

export const metadata = { title: "درباره ما" };
export const revalidate = 3600;

const CARD_ICONS = [Target, Eye, Users];
const WHY_ICONS = [ShieldCheck, Award, Truck, Headset];

export default async function AboutPage() {
  const [cfg, pages] = await Promise.all([getSiteConfig(), getPageContent()]);
  const { brand, contact } = cfg;
  const about = pages.about;

  const stats = about.stats;

  return (
    <div className="container-lux py-12">
      {/* بنر */}
      <section className="card overflow-hidden bg-brand-soft p-8 text-center md:p-14">
        <span className="chip bg-primary-soft text-primary">{brand.industry}</span>
        <h1 className="mt-4 text-3xl font-black leading-relaxed sm:text-4xl">
          دربارهٔ {brand.name}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted">
          {about.intro}
        </p>
      </section>

      {/* آمار */}
      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <div className="text-3xl font-black text-primary">{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ماموریت و چشم‌انداز */}
      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {about.cards.map((c, i) => {
          const Icon = CARD_ICONS[i] ?? Target;
          return (
            <div key={c.title} className="card p-6">
              <Icon className="h-8 w-8 text-primary" />
              <h2 className="mt-3 text-lg font-bold">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
            </div>
          );
        })}
      </section>

      {/* مزایا */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-black">چرا {brand.name}؟</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {about.why.map((w, i) => {
            const Icon = WHY_ICONS[i] ?? ShieldCheck;
            return (
              <div key={w.title} className="card p-5">
                <Icon className="h-7 w-7 text-primary" />
                <h3 className="mt-3 text-sm font-bold">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{w.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* اطلاعات تماس */}
      <section className="mt-12 card bg-elev p-8 text-center">
        <h2 className="text-xl font-black">با ما در تماس باشید</h2>
        <p className="mt-2 text-sm text-muted">کارشناسان ما آمادهٔ پاسخ‌گویی به سوالات شما هستند.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a href={`tel:${contact.phone}`} className="btn-primary">
            <Headset className="h-4.5 w-4.5" /> {contact.phone}
          </a>
          <span className="text-sm text-muted">{contact.address}</span>
        </div>
      </section>
    </div>
  );
}
