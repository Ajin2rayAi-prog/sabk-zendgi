import Link from "next/link";
import { ChevronLeft, Newspaper, CalendarDays } from "lucide-react";
import { getPublishedPosts } from "@/lib/posts";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic"; // همیشه زنده از دیتابیس (بدون پرش بعد دیپلوی)
export const metadata = {
  title: "بلاگ و مقالات",
  description: "مقالات و راهنمای استایل و انتخاب لباس",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="container-lux py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-fg">بلاگ</span>
      </nav>

      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <Newspaper className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-black">بلاگ و مقالات</h1>
      </div>

      {posts.length === 0 ? (
        <p className="card p-6 text-sm text-muted">هنوز مقاله‌ای منتشر نشده است.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            // نامک خارجی (لینک کامل) مستقیم به همان آدرس می‌رود
            const external = /^https?:\/\//i.test(p.slug);
            return (
            <Link
              key={p.id}
              href={external ? p.slug : `/blog/${p.slug}`}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="card group overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-primary-soft">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center text-primary/40">
                    <Newspaper className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="mb-2 line-clamp-2 font-black leading-relaxed group-hover:text-primary">{p.title}</h2>
                {p.excerpt && <p className="mb-3 line-clamp-2 text-sm text-muted">{p.excerpt}</p>}
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {toFa(new Date(p.createdAt).toLocaleDateString("fa-IR"))}
                </span>
              </div>
            </Link>
          );
          })}
        </div>
      )}
    </div>
  );
}
