import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowLeft, Phone } from "lucide-react";
import { Hero } from "@/components/hero";
import { BannerSlider } from "@/components/banner-slider";
import { ProductCard } from "@/components/product-card";
import { AiAssistant } from "@/components/ai-assistant";
import { getProducts, getCategories, getActiveBanners } from "@/lib/shop";
import { arePricesVisible, areFeaturedVisible, areHomePriceListVisible } from "@/lib/settings";
import { isAiReady } from "@/lib/ai";
import { getSiteConfig } from "@/lib/site-content";
import { siteConfig } from "@/config/site";
import { formatPrice, toFa } from "@/lib/utils";

// صفحهٔ اصلی عمومی است و کش کوتاه‌مدت می‌شود (ISR ۱۲۰ ثانیه) تا ویرایش‌های
// پنل زود روی سایت بنشینند. تغییر مهم پنل با revalidatePath بی‌درنگ اعمال می‌شود.
export const revalidate = 120;

// متاهای بهینه‌شدهٔ ایجنت سئو (اگر برای "/" چیزی ذخیره شده باشد جایگزین
// متای پیش‌فرض می‌شود، وگرنه {} برمی‌گردد و چیزی عوض نمی‌شود).
import { seoAgentMetadata } from "@/lib/seo-agent";
export async function generateMetadata() {
  return seoAgentMetadata("/");
}

function SectionHead({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="link-primary flex shrink-0 items-center gap-1 text-sm">
          مشاهدهٔ همه <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [allProducts, categories, banners, pricesVisible, featuredVisible, homePriceListVisible, siteCfg, aiReady] = await Promise.all([
    getProducts(),
    getCategories(),
    getActiveBanners(),
    arePricesVisible(),
    areFeaturedVisible(),
    areHomePriceListVisible(),
    getSiteConfig(),
    isAiReady(),
  ]);
  // اسکیمای ایجنت سئو برای صفحهٔ اصلی (اگر ذخیره شده باشد، وگرنه هیچی).
  const { seoAgentSchema } = await import("@/lib/seo-agent");
  const agentSchema = seoAgentSchema("/");
  const featured = allProducts.filter((p) => p.featured).slice(0, 8);
  const heroFeatured = allProducts.filter((p) => p.featured).slice(0, 4);
  const priceRows = allProducts.filter((p) => p.categorySlug === "tshirt").slice(0, 8);
  const priceHidden = !pricesVisible;

  return (
    <>
      {agentSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: agentSchema }}
        />
      ) : null}
      {/* بنر فعال باشد اسلایدر تمام‌صفحه می‌آید، وگرنه هیروی پیش‌فرض */}
      {banners.length > 0 ? (
        <BannerSlider slides={banners} />
      ) : (
        <Hero featured={heroFeatured} categories={categories} cfg={siteCfg} />
      )}

      {/* دسته‌بندی‌ها — ۶ گروه اصلی */}
      <section className="container-lux py-12">
        <SectionHead title="دسته‌بندی محصولات" sub="دسترسی سریع به گروه‌های کالایی" href="/products" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {(
            [
              { id: "women-outer", title: "مانتو و پالتو", icon: "Sparkles", section: "women" },
              { id: "women-tops", title: "شومیز و بلوز", icon: "Flower2", section: "women" },
              { id: "women-bottoms", title: "شلوار و دامن", icon: "Scissors", section: "women" },
              { id: "men-tops", title: "تی‌شرت و پیراهن", icon: "Shirt", section: "men" },
              { id: "men-bottoms", title: "شلوار و کت", icon: "Footprints", section: "men" },
              { id: "kids-girls", title: "دخترانه و پسرانه", icon: "Heart", section: "kids" },
            ] as const
          ).map((g) => {
            const Icon = (Icons as any)[g.icon] ?? Icons.Package;
            const count = allProducts.filter((p) => {
              const cat = categories.find((c) => c.slug === p.categorySlug);
              return cat?.group === g.id;
            }).length;
            return (
              <Link
                key={g.id}
                href={`/products?section=${g.section}&group=${g.id}`}
                className="card glass-frame group flex flex-col items-center gap-3 p-5 text-center hover:-translate-y-1 hover:border-primary/40 hover:shadow-lux"
              >
                <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-brand-grad group-hover:text-primary-fg">
                  <Icon className="h-9 w-9" />
                </span>
                <div>
                  <div className="text-sm font-bold leading-tight">{g.title}</div>
                  <div className="mt-1 text-xs text-muted">{toFa(count)} کالا</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* محصولات منتخب — نمایش با کلید پنل */}
      {featuredVisible && (
        <section className="container-lux py-8">
          <SectionHead title="محصولات منتخب" sub="پرفروش‌ترین پوشاک زنانه، مردانه و بچگانه" href="/products" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.sku} product={p} index={i} priceHidden={priceHidden} />
            ))}
          </div>
        </section>
      )}

      {/* پیش‌نمایش لیست قیمت — نمایش با کلید پنل */}
      {homePriceListVisible && (
        <section className="container-lux py-12">
        <SectionHead
          title="لیست قیمت محصولات"
          sub="نمونه‌ای از قیمت‌ روز؛ برای لیست کامل و استعلام نهایی تماس بگیرید"
          href="/price-list"
        />
        <div className="card glass-frame overflow-hidden">
          <div className="flex items-center justify-between bg-brand-grad px-5 py-3.5 text-primary-fg">
            <span className="font-bold">تی‌شرت‌های مردانه</span>
            <span className="text-sm opacity-90">
              {priceHidden ? "استعلام قیمت" : `قیمت (${siteConfig.currency.unit})`}
            </span>
          </div>
          <ul>
            {priceRows.map((p, i) => (
              <li
                key={p.sku}
                className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${
                  i % 2 ? "bg-primary-soft/40" : ""
                }`}
              >
                <Link href={`/product/${p.slug}`} className="flex items-center gap-3 font-medium hover:text-primary">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-fg">
                    {toFa(i + 1)}
                  </span>
                  {p.title}
                </Link>
                {priceHidden ? (
                  <span className="shrink-0 font-black text-muted">استعلام قیمت</span>
                ) : (
                  <span className={`shrink-0 font-black ${p.price == null ? "text-muted" : "text-primary"}`}>
                    {formatPrice(p.price)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* خدمات — ویترین ویژه */}
      <section className="container-lux py-12">
        <SectionHead
          title="خدمات فروشگاه سبک زندگی"
          sub="پوشاک خانوادگی با مشاورهٔ انتخاب سایز و تعویض آسان"
          href="/services"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: "Flower2",
              title: "پوشاک زنانه و مردانه",
              desc: "مانتو، شومیز، پیراهن، شلوار و ست‌های شیک با پارچهٔ باکیفیت و ضمانت دوخت.",
            },
            {
              icon: "Baby",
              title: "پوشاک بچگانه و نوزادی",
              desc: "لباس دخترانه، پسرانه و نوزادی؛ لطیف، ضدحساسیت و راحت برای کوچولوها.",
            },
          ].map((s) => {
            const Icon = (Icons as any)[s.icon] ?? Icons.Wrench;
            return (
              <Link
                key={s.title}
                href="/services"
                className="group flex items-start gap-4 rounded-2xl bg-brand-grad p-6 text-primary-fg shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-lux"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <Icon className="h-7 w-7" />
                </span>
                <span>
                  <span className="block text-lg font-black">{s.title}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed opacity-90">{s.desc}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
                    مشاهدهٔ خدمات <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* نوار تماس */}
      <section className="container-lux pb-4">
        <div className="card glass-frame flex flex-col items-center justify-between gap-4 bg-brand-soft p-8 text-center md:flex-row md:text-right">
          <div>
            <h3 className="text-xl font-black">برای استعلام قیمت نهایی و ثبت سفارش تماس بگیرید</h3>
            <p className="mt-1 text-sm text-muted">کارشناسان ما آمادهٔ مشاورهٔ انتخاب سایز و استایل هستند.</p>
          </div>
          <a href={`tel:${siteCfg.contact.phone}`} className="btn-primary shrink-0 text-base">
            <Phone className="h-5 w-5" /> {siteCfg.contact.phone}
          </a>
        </div>
      </section>

      {/* مشاور خرید — فقط وقتی مالک فعالش کرده باشد (سرویس پولی) */}
      {aiReady && <AiAssistant />}
    </>
  );
}
