import Link from "next/link";
import { Newspaper, Plus, Pencil, Trash2 } from "lucide-react";
import { listPosts } from "@/lib/posts";
import { deletePost } from "../../actions";
import { DeleteButton } from "../delete-button";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "بلاگ" };

export default async function AdminBlogPage() {
  const posts = await listPosts();

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black">بلاگ</h1>
        </div>
        <Link href="/admin/blog/new" className="btn-primary">
          <Plus className="h-4 w-4" /> مقالهٔ جدید
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="card p-6 text-sm text-muted">هنوز مقاله‌ای ثبت نشده است.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="font-bold">{p.title}</span>
              <span dir="ltr" className="text-xs text-muted">/blog/{p.slug}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  p.published
                    ? "bg-emerald-400/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-400/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {p.published ? "منتشرشده" : "پیش‌نویس"}
              </span>
              <span className="text-xs text-muted">
                {toFa(new Date(p.createdAt).toLocaleDateString("fa-IR"))}
              </span>
              <div className="mr-auto flex gap-2">
                <Link
                  href={`/admin/blog/${p.id}`}
                  className="flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary hover:opacity-80"
                >
                  <Pencil className="h-3.5 w-3.5" /> ویرایش
                </Link>
                <DeleteButton
                  action={deletePost}
                  id={p.id}
                  message="این مقاله حذف شود؟"
                  className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </DeleteButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
