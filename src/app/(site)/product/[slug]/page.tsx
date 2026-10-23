import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Check, Phone, ChevronLeft, MessageSquare } from "lucide-react";
import { getProducts, getProductBySlug, getCategoryBySlug, getProductsByCategory } from "@/lib/shop";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews";
import { ProductCard } from "@/components/product-card";
import { ProductThumb } from "@/components/product-thumb";
import { ProductVideo } from "@/components/product-video";
import { AddToCart } from "@/components/add-to-cart";
import { Stars } from "@/components/stars";
import { ReviewForm } from "@/components/review-form";
import { ReviewSummary } from "@/components/review-summary";
import { siteConfig } from "@/config/site";
import { arePricesVisible } from "@/lib/settings";
import { absoluteUrl } from "@/lib/seo";
import { formatPrice, discountPercent, toFa } from "@/lib/utils";

// صفحهٔ محصول عمومی است و کش می‌شود (ISR). نام کاربر برای فرم نظر،
// سمت کلاینت توسط ReviewForm از سرور گرفته می‌شود تا این صفحه static بماند.
export const revalidate = 120; // کش کوتاه + بیطلسی مجدد با تغییر محصول/نظر

export async function generateStaticParams() {
  // در زمان build ممکناً دیتابیس در دسترس نباشد؛ در آن صورت چیزی
  // پیش‌ساخته نمی‌شود و صفحات با ISR روی اولین بازدید ساخته و کش می‌شوند.
  try {
    const products = await getProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// متاهای بهینه‌شدهٔ ایجنت سئو برای این محصول (اگر ذخیره شده باشد).
import { seoAgentMetadata } from "@/lib/seo-agent";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return seoAgentMetadata(`/product/${params.slug}`);
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const cat = await getCategoryBySlug(product.categorySlug);
  const pricesVisible = await arePricesVisible();
  const off = product.priceBefore && product.price ? discountPercent(product.priceBefore, product.price) : 0;
  // اگر قیمت‌ها موقتاً مخفی‌اند (نوسانات ارز)، این صفحه هم استعلام نشان می‌دهد
  const isInquiry = product.price == null || !pricesVisible;
  const related = (await getProductsByCategory(product.categorySlug)).filter((p) => p.sku !== product.sku).slice(0, 4);

  const [reviews, stats] = await Promise.all([
    getApprovedReviews(product.slug),
    getReviewStats(product.slug),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    category: cat?.title,
    ...(product.image ? { image: absoluteUrl(product.image) } : {}),
    description: product.description ?? cat?.description ?? siteConfig.brand.tagline,
    ...(product.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "IRR",
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/product/${product.slug}`),
          },
        }
      : {}),
    ...(stats.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: stats.avg,
            reviewCount: stats.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  // اسکیمای ایجنت سئو برای این محصول (اگر ذخیره شده باشد، وگرنه هیچی).
  const { seoAgentSchema } = await import("@/lib/seo-agent");
  const agentSchema = seoAgentSchema(`/product/${product.slug}`);

  return (
    <div className="container-lux py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {agentSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: agentSchema }}
        />
      ) : null}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <Link href={`/category/${product.categorySlug}`} className="hover:text-primary">{cat?.title}</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-fg">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* تصویر */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="relative aspect-square">
              <ProductThumb categorySlug={product.categorySlug} image={product.image} alt={product.title} />
              {off > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-sm font-bold text-white">
                  {toFa(off)}٪ تخفیف
                </span>
              )}
            </div>
          </div>

          {/* ویدیوی معرفی محصول */}
          {product.video && (
            <ProductVideo video={product.video} cover={product.videoCover} title={product.title} />
          )}
        </div>

        {/* اطلاعات */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="rounded-md bg-primary-soft px-2 py-0.5 font-semibold text-primary-deep dark:text-primary">
              {product.brand}
            </span>
            <span className="text-muted">کد: {product.sku}</span>
          </div>

          <h1 className="text-2xl font-black leading-relaxed sm:text-3xl">{product.title}</h1>

          {stats.count > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm">
              <Stars value={stats.avg} />
              <span className="font-bold text-fg">{toFa(stats.avg)}</span>
              <span className="text-muted">({toFa(stats.count)} نظر)</span>
            </a>
          )}

          <p className="mt-3 leading-relaxed text-muted">
            {cat?.description ?? siteConfig.brand.tagline}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="chip text-muted">{t}</span>
              ))}
            </div>
          )}

          {product.description && (
            <div className="card mt-4 p-5">
              <h3 className="mb-3 text-sm font-bold">توضیحات محصول</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{product.description}</p>
            </div>
          )}

          {/* قیمت و اقدام */}
          <div className="card mt-6 p-5">
            <div className="flex items-end justify-between">
              <div>
                {isInquiry ? (
                  <span className="text-2xl font-black text-muted">استعلام قیمت</span>
                ) : (
                  <>
                    {product.priceBefore && (
                      <span className="block text-sm text-muted line-through">{formatPrice(product.priceBefore)}</span>
                    )}
                    <span className="text-2xl font-black text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <span className="mr-1 text-xs text-muted">قیمت به {siteConfig.currency.unit}</span>
                  </>
                )}
              </div>
              <span className={`text-sm font-semibold ${product.inStock ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                {product.inStock ? "موجود" : "ناموجود"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {isInquiry ? (
                <div className="flex flex-1 flex-col gap-2">
                  <a href={`tel:${siteConfig.contact.phone}`} className="btn-primary w-full justify-center">
                    <Phone className="h-5 w-5" /> استعلام قیمت و سفارش
                  </a>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted">شماره تماس:</span>
                    <a href={`tel:${siteConfig.contact.phone}`} dir="ltr" className="font-black text-primary">
                      {siteConfig.contact.phone}
                    </a>
                  </div>
                  {siteConfig.contact.sales.length > 0 && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                      {siteConfig.contact.sales.map((s) => (
                        <span key={s.phone} className="flex items-center gap-1.5">
                          <span>{s.name}</span>
                          <a href={`tel:${s.phone}`} dir="ltr" className="font-bold text-primary-deep dark:text-primary">
                            {s.phone}
                          </a>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <AddToCart product={product} />
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center text-xs">
              {[[ShieldCheck, "ضمانت اصالت"], [Truck, "ارسال سراسر کشور"], [RotateCcw, "مشاورهٔ تخصصی"]].map(
                ([I, t], i) => (
                  <div key={i} className="flex flex-col items-center gap-1 text-muted">
                    <I className="h-5 w-5 text-primary" /> {t as string}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ویژگی‌ها */}
          <div className="card mt-4 p-5">
            <h3 className="mb-3 text-sm font-bold">مشخصات کلی</h3>
            <ul className="grid gap-2 text-sm">
              {[
                `دستهٔ محصول: ${cat?.title}`,
                `برند: ${product.brand}`,
                "کیفیت استاندارد و مناسب مصارف درمانی",
                "قابل ارائه به‌صورت عمده برای تعمیرگاه‌ها",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted">
                  <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* نظرات و امتیازها */}
      <section id="reviews" className="scroll-mt-24 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <MessageSquare className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-2xl font-black">نظرات کاربران</h2>
            {stats.count > 0 ? (
              <span className="flex items-center gap-2 text-sm text-muted">
                <Stars value={stats.avg} size={14} /> میانگین {toFa(stats.avg)} از ۵ ({toFa(stats.count)} نظر)
              </span>
            ) : (
              <span className="text-sm text-muted">اولین نفری باشید که نظر می‌دهد.</span>
            )}
          </div>
        </div>

        {reviews.length > 0 && <ReviewSummary slug={product.slug} />}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="card p-5 text-sm text-muted">هنوز نظری ثبت نشده است.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold">{r.authorName}</span>
                    <Stars value={r.rating} size={14} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{r.comment}</p>
                </div>
              ))
            )}
          </div>

          <div>
            <h3 className="mb-3 text-lg font-black">نظر خود را بنویسید</h3>
            <ReviewForm slug={product.slug} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-12">
          <h2 className="mb-6 text-2xl font-black">محصولات مرتبط</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.sku} product={p} index={i} priceHidden={!pricesVisible} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
