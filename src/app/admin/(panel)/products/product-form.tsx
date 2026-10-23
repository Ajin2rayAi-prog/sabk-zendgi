import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { saveProduct } from "../../actions";
import { VideoUploadField } from "./video-upload-field";
import { ImagePicker } from "@/components/image-picker";
import { SubmitButton } from "@/components/submit-button";
import { brands as brandList } from "@/data/catalog";

type Cat = { slug: string; title: string };
type ProductLike = {
  id: string;
  sku: string;
  title: string;
  brand: string;
  categorySlug: string;
  price: number | null;
  priceBefore: number | null;
  image: string | null;
  video: string | null;
  videoCover: string | null;
  description: string | null;
  inStock: boolean;
  visible: boolean;
  featured: boolean;
  tags: string[];
} | null;

const field = "w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary";

export function ProductForm({ product, categories }: { product: ProductLike; categories: Cat[] }) {
  const isEdit = !!product;
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/admin/products" className="hover:text-primary">محصولات</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-fg">{isEdit ? "ویرایش" : "محصول جدید"}</span>
      </div>

      <h1 className="mb-6 text-2xl font-black">{isEdit ? "ویرایش محصول" : "افزودن محصول"}</h1>

      <form action={saveProduct} encType="multipart/form-data" className="card space-y-5 p-6">
        {isEdit && <input type="hidden" name="id" value={product!.id} />}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">کد کالا (SKU)</span>
            <input name="sku" required defaultValue={product?.sku ?? ""} className={field} placeholder="AMT-101" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">برند</span>
            <input name="brand" list="brands" defaultValue={product?.brand ?? "سبک زندگی"} className={field} />
            <datalist id="brands">
              {brandList.map((b) => <option key={b} value={b} />)}
            </datalist>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">عنوان محصول</span>
          <input name="title" required defaultValue={product?.title ?? ""} className={field} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">توضیحات محصول</span>
          <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className={field} placeholder="ویژگی‌ها و توضیحات محصول..." />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">دسته‌بندی</span>
            <select name="categorySlug" defaultValue={product?.categorySlug ?? categories[0]?.slug} className={field}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">قیمت (ریال) — خالی = استعلام</span>
            <input name="price" inputMode="numeric" defaultValue={product?.price ?? ""} className={field} placeholder="9100000" dir="ltr" />
          </label>
        </div>

        {/* عکس محصول: انتخاب با پیش‌نمایش فوری + مسیر دستی */}
        <div className="rounded-xl border bg-elev/40 p-4">
          <span className="mb-3 block text-sm font-semibold">عکس محصول</span>
          <ImagePicker name="imageFile" current={product?.image ?? null} label="یک عکس از سیستم انتخاب کنید (jpg/png/webp، حداکثر ۵ مگابایت)" />
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-muted">یا مسیر عکس را دستی وارد کنید (اختیاری)</span>
            <input name="image" defaultValue={product?.image ?? ""} className={field} placeholder="/products/amt-101.jpg" dir="ltr" />
          </label>
        </div>

        {/* ویدیوی معرفی محصول — آپلود فایل یا لینک */}
        <div className="rounded-xl border bg-elev/40 p-4">
          <span className="mb-1.5 block text-sm font-semibold">ویدیوی معرفی محصول (اختیاری)</span>
          {product?.video && (
            <p className="mb-2 truncate text-xs text-muted" dir="ltr">
              فعلی: {product.video}
            </p>
          )}
          <VideoUploadField current={product?.video ?? null} />
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-muted">یا لینک ویدیو — یوتیوب، آپارات یا فایل mp4</span>
            <input
              name="video"
              defaultValue={product?.video ?? ""}
              className={field}
              placeholder="https://youtu.be/abc123 یا https://aparat.com/v/abc"
              dir="ltr"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            اگر فایل آپلود کنید جایگزین لینک می‌شود. ویدیوهای یوتیوب/آپارات فقط با لینک کار می‌کنند.
            کاور ویدیو را هم می‌توانید آپلود کنید، وگرنه تصویر پیش‌فرض خود پلتفرم نشان داده می‌شود.
          </p>
          <div className="mt-3">
            <ImagePicker name="videoCoverFile" current={product?.videoCover ?? null} label="عکس کاور ویدیو (jpg/png/webp، حداکثر ۵ مگابایت)" />
          </div>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-muted">یا مسیر کاور را دستی وارد کنید (اختیاری)</span>
            <input name="videoCover" defaultValue={product?.videoCover ?? ""} className={field} placeholder="/uploads/cover.jpg" dir="ltr" />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">قیمت قبل از تخفیف (اختیاری)</span>
            <input name="priceBefore" inputMode="numeric" defaultValue={product?.priceBefore ?? ""} className={field} dir="ltr" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">برچسب‌ها (با ویرگول جدا کنید)</span>
            <input name="tags" defaultValue={product?.tags?.join("، ") ?? ""} className={field} placeholder="بزرگسال، شفاف" />
          </label>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="inStock" defaultChecked={product?.inStock ?? true} className="accent-[rgb(var(--c-primary))]" />
            موجود در انبار
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="visible" defaultChecked={product?.visible ?? true} className="accent-[rgb(var(--c-primary))]" />
            نمایش در سایت
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="accent-[rgb(var(--c-primary))]" />
            محصول منتخب
          </label>
        </div>

        <div className="flex gap-3 border-t pt-5">
          <SubmitButton>{isEdit ? "ذخیرهٔ تغییرات" : "افزودن محصول"}</SubmitButton>
          <Link href="/admin/products" className="btn-ghost">انصراف</Link>
        </div>
      </form>
    </div>
  );
}
