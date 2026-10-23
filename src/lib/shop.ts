import "server-only";
import { prisma } from "@/lib/prisma";
import { NO_DB, dbRead } from "@/lib/db";
import type { Category, Product, Section, Group } from "@/data/catalog";
import { categories as staticCategories, products as staticProducts } from "@/data/catalog";

// نگاشت بخش (women/men/kids) از روی کاتالوگ استاتیک — تک‌منبع در catalog.ts.
// دسته‌هایی که در کاتالوگ نیستند (مثلاً ساخته‌شده از پنل) پیش‌فرض زنانه‌اند.
const sectionBySlug = new Map(staticCategories.map((c) => [c.slug, c.section]));
const groupBySlug = new Map(staticCategories.map((c) => [c.slug, c.group]));
const groupTitleBySlug = new Map(staticCategories.map((c) => [c.slug, c.groupTitle]));
const sectionTitleBySlug = new Map(staticCategories.map((c) => [c.slug, c.sectionTitle]));

// ============================================================
//  لایهٔ دادهٔ فروشگاه از روی دیتابیس (Prisma/Postgres).
//  صفحات فروشگاه از این توابع می‌خوانند تا هر تغییری که در پنل
//  مدیریت اعمال می‌شود، بلافاصله روی سایت دیده شود.
//  خروجی‌ها دقیقاً هم‌شکل تایپ‌های catalog هستند.
// ============================================================

function toProduct(r: {
  sku: string; slug: string; title: string; brand: string; categorySlug: string;
  price: number | null; priceBefore: number | null; image: string | null;
  video: string | null; videoCover: string | null;
  inStock: boolean; featured: boolean; tags: string[]; description: string | null;
  visible: boolean;
}): Product {
  return {
    sku: r.sku,
    slug: r.slug,
    title: r.title,
    brand: r.brand,
    categorySlug: r.categorySlug,
    price: r.price,
    priceBefore: r.priceBefore ?? undefined,
    image: r.image ?? undefined,
    video: r.video ?? undefined,
    videoCover: r.videoCover ?? undefined,
    inStock: r.inStock,
    visible: r.visible,
    featured: r.featured,
    tags: r.tags,
    description: r.description ?? undefined,
  };
}

function toCategory(r: {
  slug: string;
  title: string;
  icon: string;
  description: string | null;
}): Category {
  const section: Section = sectionBySlug.get(r.slug) ?? "women";
  const group: Group =
    groupBySlug.get(r.slug) ??
    (section === "kids" ? "kids-girls" : section === "men" ? "men-tops" : "women-tops");
  const GROUP_TITLES: Record<Group, string> = {
    "women-outer": "مانتو و پالتو",
    "women-tops": "شومیز و بلوز",
    "women-bottoms": "شلوار و دامن",
    "men-tops": "تی‌شرت و پیراهن",
    "men-bottoms": "شلوار و کت",
    "kids-girls": "دخترانه و پسرانه",
    "kids-baby": "نوزادی و ست",
  };
  return {
    slug: r.slug,
    title: r.title,
    icon: r.icon,
    section,
    sectionTitle:
      sectionTitleBySlug.get(r.slug) ??
      (section === "kids" ? "پوشاک بچگانه" : section === "men" ? "پوشاک مردانه" : "پوشاک زنانه"),
    group,
    groupTitle: groupTitleBySlug.get(r.slug) ?? GROUP_TITLES[group],
    description: r.description ?? undefined,
  };
}

export async function getCategories(): Promise<Category[]> {
  return dbRead(
    async () => (await prisma.category.findMany({ orderBy: { order: "asc" } })).map(toCategory),
    staticCategories
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return dbRead(async () => {
    const r = await prisma.category.findUnique({ where: { slug } });
    return r ? toCategory(r) : undefined;
  }, staticCategories.find((c) => c.slug === slug));
}

export async function getCategoriesBySection(section: Section): Promise<Category[]> {
  const all = await getCategories();
  return all.filter((c) => c.section === section);
}

export async function getProducts(): Promise<Product[]> {
  return dbRead(
    async () => (await prisma.product.findMany({ where: { visible: true }, orderBy: { sku: "asc" } })).map(toProduct),
    staticProducts.filter((p) => p.visible)
  );
}

export async function getFeaturedProducts(take = 8): Promise<Product[]> {
  return dbRead(
    async () => (await prisma.product.findMany({ where: { featured: true, visible: true }, orderBy: { sku: "asc" }, take })).map(toProduct),
    staticProducts.filter((p) => p.featured && p.visible).slice(0, take)
  );
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return dbRead(
    async () => (await prisma.product.findMany({ where: { categorySlug: slug, visible: true }, orderBy: { sku: "asc" } })).map(toProduct),
    staticProducts.filter((p) => p.categorySlug === slug && p.visible)
  );
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return dbRead(async () => {
    const r = await prisma.product.findUnique({ where: { slug } });
    if (!r || !r.visible) return undefined;
    return toProduct(r);
  }, staticProducts.find((p) => p.slug === slug && p.visible));
}

export type BannerSlideItem = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  imageMobile: string | null;
  link: string | null;
  order: number;
  active: boolean;
};

/** بنرهای فعال اسلایدر صفحهٔ اول — به‌ترتیب order. خالی یعنی هیروی پیش‌فرض. */
export async function getActiveBanners(): Promise<BannerSlideItem[]> {
  return dbRead(
    async () =>
      prisma.bannerSlide.findMany({
        where: { active: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
    []
  );
}

export async function getBrands(): Promise<string[]> {
  return dbRead(
    async () =>
      (
        await prisma.product.findMany({ where: { visible: true }, select: { brand: true }, distinct: ["brand"] })
      )
        .map((r) => r.brand)
        .filter(Boolean)
        .sort(),
    [...new Set(staticProducts.filter((p) => p.visible && p.brand).map((p) => p.brand))].sort()
  );
}

export async function getCategoriesByGroup(group: Group): Promise<Category[]> {
  const all = await getCategories();
  return all.filter((c) => c.group === group);
}
