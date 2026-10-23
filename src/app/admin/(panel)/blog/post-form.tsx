import Link from "next/link";
import { Save, ArrowRight } from "lucide-react";
import { savePost } from "../../actions";
import { ImagePicker } from "@/components/image-picker";

type PostData = {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  body?: string;
  cover?: string | null;
  published?: boolean;
};

const inputCls = "w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary";

/** فرم ساخت/ویرایش مقالهٔ بلاگ. */
export function PostForm({ post }: { post?: PostData }) {
  return (
    <form action={savePost} className="max-w-2xl space-y-5">
      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">عنوان</label>
        <input name="title" defaultValue={post?.title} required className={inputCls} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">نامک (در آدرس)</label>
        <input
          name="slug"
          defaultValue={post?.slug}
          dir="ltr"
          required
          placeholder="raahnamaye-filter-hme"
          className={`${inputCls} text-left`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">خلاصه (اختیاری)</label>
        <textarea name="excerpt" defaultValue={post?.excerpt ?? ""} rows={2} className={inputCls} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">متن مقاله</label>
        <textarea name="body" defaultValue={post?.body} rows={12} required className={inputCls} />
        <p className="mt-1 text-xs text-muted">پاراگراف‌ها را با یک خط خالی از هم جدا کنید.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">عکس کاور</label>
        {/* مسیر فعلی نگه داشته می‌شود تا ذخیره بدون انتخاب دوباره، کاور را پاک نکند */}
        <input type="hidden" name="cover" value={post?.cover ?? ""} />
        <ImagePicker name="coverFile" current={post?.cover ?? null} label="کاور مقاله (jpg/png/webp)" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published} className="h-5 w-5 accent-[rgb(var(--primary))]" />
        منتشر شود
      </label>

      <div className="flex gap-2">
        <button className="btn-primary justify-center">
          <Save className="h-4 w-4" /> ذخیره
        </button>
        <Link href="/admin/blog" className="btn-ghost justify-center">
          <ArrowRight className="h-4 w-4" /> بازگشت
        </Link>
      </div>
    </form>
  );
}
