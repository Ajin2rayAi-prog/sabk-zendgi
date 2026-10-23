import Link from "next/link";
import { Flower2, Shirt, Baby, Scissors, ShieldCheck, Truck, Headset, ArrowLeft } from "lucide-react";
import { sections } from "@/data/catalog";
import { siteConfig } from "@/config/site";
import { getPageContent } from "@/lib/site-content";

export const metadata = { title: "خدمات" };
export const revalidate = 3600;

const sectionIcons: Record<string, any> = {
  women: Flower2,
  men: Shirt,
  kids: Baby,
};

/** آیتم‌های ویژه (تیتر شامل «مشاوره») با نشان «خدمت ویژه» هایلایت می‌شوند */
function withHot(items: { title: string; desc: string }[]) {
  return items.map((item) => ({ ...item, hot: item.title.includes("مشاوره") }));
}

export default async function ServicesPage() {
  const pages = await getPageContent();
  const services = {
    women: withHot(pages.services.women),
    men: withHot(pages.services.men),
    kids: withHot(pages.services.kids),
  };
  return (
    <div className="container-lux py-12">
      <section className="text-center">
        <span className="chip bg-primary-soft text-primary">خدمات تخصصی</span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">خدمات ما</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          {siteConfig.brand.name} برای زنانه، مردانه و بچگانه،
          خدماتی کامل از مشاورهٔ انتخاب سایز تا تعویض آسان ارائه می‌دهد.
        </p>
      </section>

      {sections.map((s) => {
        const Icon = sectionIcons[s.id] ?? Flower2;
        const items = (services as any)[s.id] as { title: string; desc: string; hot?: boolean }[];
        return (
          <section key={s.id} className="mt-12">
            <div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{s.title}</h2>
                  <p className="text-sm text-muted">{s.subtitle}</p>
                </div>
              </div>
              <Link
                href={`/products?section=${s.id}`}
                className="btn-primary !py-2"
              >
                مشاهدهٔ محصولات <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.title}
                  className={`card glass-frame flex items-start gap-4 p-5 ${item.hot ? "!border-primary shadow-brand" : ""}`}
                >
                  {item.hot ? (
                    <Scissors className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  ) : (
                    <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  )}
                  <div>
                    <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold">
                      {item.title}
                      {item.hot && (
                        <span className="rounded-full bg-brand-grad px-2.5 py-0.5 text-[11px] font-bold text-primary-fg">
                          خدمت ویژه
                        </span>
                      )}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* مزایای کلی */}
      <section className="mt-16 card bg-elev p-8">
        <h2 className="text-center text-xl font-black">مزایای همکاری با ما</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {pages.services.perks.map((perk, i) => {
            const Icon = [ShieldCheck, Truck, Headset][i] ?? ShieldCheck;
            return (
              <div key={perk.title} className="text-center">
                <Icon className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-2 text-sm font-bold">{perk.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{perk.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
