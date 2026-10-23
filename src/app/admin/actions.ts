"use server";

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveVideoFile } from "@/lib/upload";
import { isAdmin, signIn, signOut, requireOwner, requireAdmin, getCurrentAdmin } from "@/lib/admin";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { saveAiConfig, type AiProvider, arePricesVisible, setPricesVisible, setFeaturedVisible, setHomePriceListVisible } from "@/lib/settings";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

function toIntOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s === "" ? null : parseInt(s, 10);
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 *  آپلود عکس محصول به public/uploads و بازگرداندن مسیر عمومی آن.
 *  آپلودها به public/uploads می‌روند — این مسیر در تولید روی یک Docker volume
 *  سوار می‌شود تا عکس‌ها با دیپلوی‌های بعدی از بین نروند (برخلاف public/products
 *  که فقط عکس‌های ثابت کاتالوگ را دارد و داخل ایمیج پخته می‌شود).
 */
async function saveUpload(file: FormDataEntryValue | null, sku: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw new Error("فرمت تصویر نامعتبر است (فقط jpg/png/webp/gif)");
  if (file.size > 5 * 1024 * 1024) throw new Error("حجم تصویر بیش از ۵ مگابایت است");
  const safeSku = (sku || "product").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const name = `${safeSku || "product"}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

/** پاک‌سازی کش صفحات عمومی فروشگاه بعد از هر تغییر در پنل.
 *  صفحات با ISR کش شده‌اند (revalidate=3600)؛ این فراخوانی کش را
 *  بی‌درنگ نوسازه می‌کند تا تغییرات پنل فوراً روی سایت دیده شوند. */
function revalidateShop() {
  revalidatePath("/", "layout");
  revalidatePath("/products");
  revalidatePath("/price-list");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

/* ---------- احراز هویت ---------- */
export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await signIn(username, password);
  if (!user) redirect("/admin/login?e=1");
  redirect("/admin");
}

export async function logoutAction() {
  signOut();
  redirect("/admin/login");
}

/* ---------- محصولات ---------- */
export async function saveProduct(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const sku = String(formData.get("sku") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean);

  // اگر فایلی آپلود شده باشد، جایگزین مسیر متنی می‌شود
  const uploaded = await saveUpload(formData.get("imageFile"), sku);
  const image = uploaded ?? (String(formData.get("image") ?? "").trim() || null);
  // کاور ویدیو هم آپلود یا مسیر متنی
  const coverUploaded = await saveUpload(formData.get("videoCoverFile"), sku);
  const videoCover = coverUploaded ?? (String(formData.get("videoCover") ?? "").trim() || null);
  // ویدیو: آپلود فایل (ورودی قدیمی فرم)، وگرنه مسیر آپلودشدهٔ جدا یا لینک متنی
  const videoUploaded = await saveVideoFile(formData.get("videoFile"), sku);
  const videoViaUploader =
    String(formData.get("uploadedVideo") ?? "").trim() || null;
  const video = videoUploaded ?? videoViaUploader ?? (String(formData.get("video") ?? "").trim() || null);

  const data = {
    sku,
    slug: sku.toLowerCase(),
    title: String(formData.get("title") ?? "").trim(),
    brand: String(formData.get("brand") ?? "سبک زندگی").trim(),
    categorySlug: String(formData.get("categorySlug") ?? "").trim(),
    price: toIntOrNull(formData.get("price")),
    priceBefore: toIntOrNull(formData.get("priceBefore")),
    image,
    video,
    videoCover,
    description: String(formData.get("description") ?? "").trim() || null,
    inStock: formData.get("inStock") === "on",
    visible: formData.get("visible") === "on",
    featured: formData.get("featured") === "on",
    tags,
  };

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    await prisma.product.create({ data });
  }
  revalidatePath("/admin/products");
  revalidateShop();
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await assertAdmin();
  await prisma.product.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/products");
  revalidateShop();
}

/** ویرایش سریع قیمت/موجودی از داخل جدول */
export async function quickUpdateProduct(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.product.update({
    where: { id },
    data: {
      price: toIntOrNull(formData.get("price")),
      inStock: formData.get("inStock") === "on",
    },
  });
  revalidatePath("/admin/products");
  revalidateShop();
}

/** چشم 👁️ — نمایش/مخفی کردن محصول در سایت */
export async function toggleProductVisible(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("شناسهٔ محصول الزامی است");
  const p = await prisma.product.findUnique({ where: { id }, select: { visible: true } });
  if (!p) throw new Error("محصول یافت نشد");
  await prisma.product.update({ where: { id }, data: { visible: !p.visible } });
  revalidatePath("/admin/products");
  revalidateShop();
}

/* ---------- دسته‌ها ---------- */
export async function saveCategory(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const data = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    title: String(formData.get("title") ?? "").trim(),
    icon: String(formData.get("icon") ?? "Package").trim() || "Package",
    description: String(formData.get("description") ?? "").trim() || null,
    order: toIntOrNull(formData.get("order")) ?? 0,
  };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  revalidatePath("/admin/categories");
  revalidateShop();
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await assertAdmin();
  await prisma.category.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/categories");
  revalidateShop();
}

/* ---------- سفارش‌ها ---------- */
export async function updateOrderStatusAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status") ?? "") as any;
  const paymentStatus = String(formData.get("paymentStatus") ?? "") as any;
  await prisma.order.update({
    where: { id },
    data: { status, paymentStatus },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account", "layout");
}

/* ---------- نظرات ---------- */
export async function moderateReview(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const action = String(formData.get("action") ?? "");
  if (action === "delete") {
    await prisma.review.delete({ where: { id } });
  } else if (action === "approve" || action === "reject") {
    await prisma.review.update({
      where: { id },
      data: { status: action === "approve" ? "APPROVED" : "REJECTED" },
    });
  }
  revalidatePath("/admin/reviews");
  revalidateShop();
}

/* ---------- کد تخفیف ---------- */
export async function saveCoupon(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) throw new Error("کد تخفیف الزامی است");
  const type = String(formData.get("type") ?? "PERCENT") === "FIXED" ? "FIXED" : "PERCENT";
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const data = {
    code,
    type: type as "PERCENT" | "FIXED",
    value: toIntOrNull(formData.get("value")) ?? 0,
    active: formData.get("active") === "on",
    minTotal: toIntOrNull(formData.get("minTotal")),
    maxUses: toIntOrNull(formData.get("maxUses")),
    expiresAt: expiresRaw ? new Date(expiresRaw) : null,
  };
  if (id) await prisma.coupon.update({ where: { id }, data });
  else await prisma.coupon.create({ data });
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await assertAdmin();
  await prisma.coupon.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/coupons");
}

/* ---------- بلاگ ---------- */
export async function savePost(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const cover = await saveUpload(formData.get("coverFile"), "post");
  const data = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase().replace(/\s+/g, "-"),
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim(),
    cover: cover ?? (String(formData.get("cover") ?? "").trim() || null),
    published: formData.get("published") === "on",
  };
  if (!data.slug || !data.title) throw new Error("نامک و عنوان الزامی است");
  if (id) await prisma.post.update({ where: { id }, data });
  else await prisma.post.create({ data });
  revalidatePath("/admin/blog");
  revalidatePath("/blog", "layout");
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  await assertAdmin();
  await prisma.post.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog", "layout");
}

/* ---------- تنظیمات هوش مصنوعی — فقط مالک (هزینهٔ سرویس با تأیید کارفرما) ---------- */
export async function saveAiSettings(formData: FormData) {
  await requireOwner();
  const provider = String(formData.get("provider") ?? "anthropic") as AiProvider;
  await saveAiConfig({
    enabled: formData.get("enabled") === "on",
    provider,
    baseUrl: String(formData.get("baseUrl") ?? ""),
    model: String(formData.get("model") ?? ""),
    streaming: String(formData.get("streaming") ?? "stream") !== "instant",
    // خالی = کلید قبلی حفظ می‌شود (فرم هرگز کلید را پیش‌پر نمی‌کند)
    apiKey: String(formData.get("apiKey") ?? ""),
  });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

/* ---------- نمایش قیمت‌ها (نوسانات ارز) ---------- */
export async function savePricesVisible(formData: FormData) {
  await assertAdmin();
  const visible = formData.get("pricesVisible") === "on";
  await setPricesVisible(visible);
  // کل سایت کش می‌شود — همهٔ صفحات باید نوسازی شوند
  revalidatePath("/", "layout");
  revalidateShop();
  redirect("/admin/settings?saved=1");
}

/* ---------- نمایش سکشن محصولات منتخب در صفحهٔ اول ---------- */
export async function saveFeaturedVisible(formData: FormData) {
  await assertAdmin();
  const visible = formData.get("featuredVisible") === "on";
  await setFeaturedVisible(visible);
  revalidatePath("/", "layout");
  revalidateShop();
  redirect("/admin/settings?saved=1");
}

/* ---------- نمایش پیش‌نمایش لیست قیمت در صفحهٔ اول ---------- */
export async function saveHomePriceListVisible(formData: FormData) {
  await assertAdmin();
  const visible = formData.get("homePriceListVisible") === "on";
  await setHomePriceListVisible(visible);
  revalidatePath("/", "layout");
  revalidateShop();
  redirect("/admin/settings?saved=1");
}

/* ---------- محتوای سایت (متن‌های قابل ویرایش از پنل) ---------- */
export async function saveSiteContent(formData: FormData) {
  await assertAdmin();
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  // نگاشت کلید تنظیمات ← نام فیلد فرم. فقط فیلدهایی که در فرمِ ارسال‌شده
  // هستند ذخیره می‌شوند تا صفحات جدا، مقادیر همدیگر را پاک نکنند.
  const pairs: [string, string][] = [
    ["site.brand.name", "brandName"],
    ["site.brand.tagline", "tagline"],
    ["site.contact.phone", "phone"],
    ["site.contact.address", "address"],
    ["site.contact.mapUrl", "mapUrl"],
    ["site.social.instagram", "instagram"],
    ["site.social.whatsapp", "whatsapp"],
    ["site.social.telegram", "telegram"],
    ["site.hero.eyebrow", "heroEyebrow"],
    ["site.hero.title", "heroTitle"],
    ["site.hero.highlight", "heroHighlight"],
    ["site.hero.subtitle", "heroSubtitle"],
    ["site.hero.cta1label", "cta1label"],
    ["site.hero.cta1href", "cta1href"],
    ["site.hero.cta2label", "cta2label"],
    ["site.hero.cta2href", "cta2href"],
    ["site.footer.certs", "certs"],
    ["site.footer.links", "footerLinks"],
    ["site.footer.trust", "trust"],
    ["site.about.intro", "aboutIntro"],
    ["site.about.stats", "aboutStats"],
    ["site.about.cards", "aboutCards"],
    ["site.about.why", "aboutWhy"],
    ["site.services.fanni", "servicesFanni"],
    ["site.services.badaneh", "servicesBadaneh"],
    ["site.services.perks", "servicesPerks"],
  ];
  for (const [key, fieldName] of pairs) {
    if (!formData.has(fieldName)) continue;
    const value = str(fieldName);
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  const salesFields = ["sales1name", "sales1phone", "sales2name", "sales2phone"];
  if (salesFields.some((f) => formData.has(f))) {
    const sales = [
      { name: str("sales1name"), phone: str("sales1phone") },
      { name: str("sales2name"), phone: str("sales2phone") },
    ].filter((s) => s.name || s.phone);
    await prisma.setting.upsert({
      where: { key: "site.contact.sales" },
      update: { value: JSON.stringify(sales) },
      create: { key: "site.contact.sales", value: JSON.stringify(sales) },
    });
  }
  revalidatePath("/admin/content");
  revalidateShop();
  const back = String(formData.get("returnTo") ?? "");
  const dest = back.startsWith("/admin/content") ? back : "/admin/content";
  redirect(`${dest}?saved=1`);
}

/* ============================================================
   مدیریت حساب‌های ادمین — فقط مالک (OWNER)
   ایجاد/ویرایش مدیران، تغییر نام کاربری و رمز عبور،
   غیرفعال‌سازی و حذف. مالک هرگز نمی‌تواند خود را حذف کند.
   ============================================================ */

/** نرمال‌سازی نام کاربری: حروف کوچک، بدون فاصله */
function normalizeUsername(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, "");
}

/** ساخت یک مدیر جدید */
export async function createAdmin(formData: FormData) {
  await requireOwner();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "MANAGER") === "OWNER" ? "OWNER" : "MANAGER";

  if (!username || !name) throw new Error("نام کاربری و نام نمایشی الزامی است");
  if (password.length < 6) throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد");

  const exists = await prisma.adminUser.findUnique({ where: { username } });
  if (exists) throw new Error("این نام کاربری قبلاً استفاده شده است");

  await prisma.adminUser.create({
    data: { username, name, passwordHash: hashPassword(password), role },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/** ویرایش نام نمایشی/نام کاربری/نقش یک مدیر */
export async function updateAdmin(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "MANAGER") === "OWNER" ? "OWNER" : "MANAGER";

  if (!id) throw new Error("شناسهٔ کاربر الزامی است");
  if (!username || !name) throw new Error("نام کاربری و نام نمایشی الزامی است");

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) throw new Error("کاربر یافت نشد");

  // جلوگیری از تغییر خودِ مالکِ جاری (از طریق این فرم)
  const me = await getCurrentAdmin();
  if (me?.id === id) throw new Error("برای تغییر حساب خود از بخش «حساب من» استفاده کنید");

  // اگر نام کاربری تغییر کرده، یکتایی بررسی شود
  if (username !== target.username) {
    const clash = await prisma.adminUser.findUnique({ where: { username } });
    if (clash) throw new Error("این نام کاربری قبلاً استفاده شده است");
  }

  await prisma.adminUser.update({
    where: { id },
    data: { username, name, role },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/** فعال/غیرفعال‌سازی دسترسی یک مدیر */
export async function toggleAdminActive(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("شناسهٔ کاربر الزامی است");

  const me = await getCurrentAdmin();
  if (me?.id === id) throw new Error("غیرفعال‌سازی حساب خود ممکن نیست");

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) throw new Error("کاربر یافت نشد");

  await prisma.adminUser.update({
    where: { id },
    data: { active: !target.active },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/** تغییر رمز عبور یک مدیر توسط مالک */
export async function resetAdminPassword(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id) throw new Error("شناسهٔ کاربر الزامی است");
  if (password.length < 6) throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد");

  const me = await getCurrentAdmin();
  if (me?.id === id) throw new Error("برای تغییر رمز خود از بخش «حساب من» استفاده کنید");

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: hashPassword(password) },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/** حذف یک مدیر (مالک نمی‌تواند خود را حذف کند) */
export async function deleteAdmin(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("شناسهٔ کاربر الزامی است");

  const me = await getCurrentAdmin();
  if (me?.id === id) throw new Error("حذف حساب خودِ مالک ممکن نیست");

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/users");
}

/* ---------- حساب کاربریِ خودِ شخص (هر ادمین) ---------- */
/** تغییر رمز عبور حساب جاری */
export async function changeOwnPassword(formData: FormData) {
  const me = await requireAdmin();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  if (next.length < 6) throw new Error("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
  if (!verifyPassword(current, me.passwordHash)) {
    throw new Error("رمز عبور فعلی نادرست است");
  }
  await prisma.adminUser.update({
    where: { id: me.id },
    data: { passwordHash: hashPassword(next) },
  });
  revalidatePath("/admin/account");
  redirect("/admin/account?pw=1");
}

/* ---------- بنرهای اسلایدی صفحهٔ اول ---------- */
export async function saveBanner(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");

  // عکس بنر: آپلود از سیستم، وگرنه مسیر متنی
  const uploaded = await saveUpload(formData.get("imageFile"), "banner");
  const image = uploaded ?? String(formData.get("image") ?? "").trim();
  if (!image) throw new Error("عکس بنر الزامی است (آپلود کنید یا مسیر بدهید)");

  // عکس موبایل (عمودی): آپلود از سیستم، وگرنه مسیر متنی؛ خالی = همان عکس دسکتاپ
  const mobileUploaded = await saveUpload(formData.get("imageMobileFile"), "banner-mobile");
  const imageMobile = mobileUploaded ?? (String(formData.get("imageMobile") ?? "").trim() || null);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("عنوان بنر الزامی است");

  const data = {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    image,
    imageMobile,
    link: String(formData.get("link") ?? "").trim() || null,
    order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    active: formData.get("active") === "on",
  };

  if (id) {
    await prisma.bannerSlide.update({ where: { id }, data });
  } else {
    await prisma.bannerSlide.create({ data });
  }
  revalidatePath("/admin/banners");
  revalidateShop();
  redirect("/admin/banners");
}

export async function deleteBanner(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.bannerSlide.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidateShop();
}

/* ---------- درخواست‌های همکاری (استخدام + توزیعی) ---------- */
export async function updateFormStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "READ");
  if (!["NEW", "READ", "ARCHIVED"].includes(status)) throw new Error("وضعیت نامعتبر است");
  await prisma.formSubmission.update({ where: { id }, data: { status: status as "NEW" | "READ" | "ARCHIVED" } });
  revalidatePath("/admin/forms");
}

export async function deleteFormSubmission(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.formSubmission.delete({ where: { id } });
  revalidatePath("/admin/forms");
}
