// سیدِ دیتابیس از روی کاتالوگ ثابت (src/data/catalog.ts)
// اجرا: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import { categories, products } from "../src/data/catalog";

const prisma = new PrismaClient();

/** هش رمز عبور (scrypt) — همان الگوریتم lib/auth.ts */
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** ساخت حساب مالک اولیه از متغیرهای محیطی (ADMIN_USERNAME/ADMIN_PASSWORD) */
async function seedOwner() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length === 0) {
    console.log("→ skip owner seed (ADMIN_PASSWORD not set)");
    return;
  }
  const username = (process.env.ADMIN_USERNAME || "owner").trim().toLowerCase();
  const existing = await prisma.adminUser.findFirst({
    where: { OR: [{ username }, { role: "OWNER" }] },
  });
  if (existing) {
    console.log(`→ owner exists (@${existing.username})`);
    return;
  }
  await prisma.adminUser.create({
    data: {
      username,
      name: "مالک سایت",
      passwordHash: hashPassword(password),
      role: "OWNER",
      active: true,
    },
  });
  console.log(`✓ owner seeded: @${username}`);
}

async function main() {
  // با SEED_PRUNE_REMOVED=1 رکوردهایی که دیگر در کاتالوگ نیستند حذف می‌شوند
  // (فقط برای برش نسخهٔ کاتالوگ، مثل بازسازی ساختار دسته‌ها — پیش‌فرض خاموش
  // تا اجرای تصادفی seed محصولات ساخته‌شده از پنل را پاک نکند).
  const prune = process.env.SEED_PRUNE_REMOVED === "1";

  console.log("→ seeding categories…");
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        icon: c.icon,
        description: c.description ?? null,
        order: i,
      },
      create: {
        slug: c.slug,
        title: c.title,
        icon: c.icon,
        description: c.description ?? null,
        order: i,
      },
    });
  }
  if (prune) {
    // حذف دسته‌هایی که دیگر در کاتالوگ نیستند
    const liveSlugs = categories.map((c) => c.slug);
    const gone = await prisma.category.deleteMany({ where: { slug: { notIn: liveSlugs } } });
    console.log(`→ pruned ${gone.count} stale categories`);
  }

  console.log("→ seeding products…");
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        price: p.price ?? null,
        description: p.description ?? null,
        priceBefore: p.priceBefore ?? null,
        image: p.image ?? null,
        inStock: p.inStock,
        featured: p.featured ?? false,
        tags: p.tags ?? [],
        categorySlug: p.categorySlug,
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        price: p.price ?? null,
        description: p.description ?? null,
        priceBefore: p.priceBefore ?? null,
        image: p.image ?? null,
        inStock: p.inStock,
        visible: p.visible,
        featured: p.featured ?? false,
        tags: p.tags ?? [],
        categorySlug: p.categorySlug,
      },
    });
  }
  if (prune) {
    // حذف محصولاتی که دیگر در کاتالوگ نیستند (SKU از بین رفته)
    const liveSkus = products.map((p) => p.sku);
    const goneP = await prisma.product.deleteMany({ where: { sku: { notIn: liveSkus } } });
    console.log(`→ pruned ${goneP.count} stale products`);
  }

  await seedOwner();

  const [nc, np] = await Promise.all([prisma.category.count(), prisma.product.count()]);
  console.log(`✓ done — categories: ${nc}, products: ${np}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
