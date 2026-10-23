import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { getPostBySlug } from "@/lib/posts";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic"; // همیشه زنده از دیتابیس (بدون پرش بعد دیپلوی)

export async function generateStaticParams() {
  // فقط مقالات منتشرشده پیش‌ساخته می‌شوند؛ اگر دیتابیس در زمان build
  // در دسترس نباشد، صفحات با ISR روی اولین بازدید ساخته می‌شوند.
  try {
    const { getPublishedPosts } = await import("@/lib/posts");
    const posts = await getPublishedPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post || !post.published) return { title: "مقاله یافت نشد" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover ? [post.cover] : undefined,
      type: "article",
    },
  };
}

/** لینک‌های داخل متن (http...) را کلیک‌پذیر می‌کند */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//i.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="link-primary break-all"
        dir="ltr"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post || !post.published) notFound();

  return (
    <article className="container-lux max-w-3xl py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-primary">بلاگ</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-fg">{post.title}</span>
      </nav>

      <h1 className="text-3xl font-black leading-relaxed">{post.title}</h1>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        {toFa(new Date(post.createdAt).toLocaleDateString("fa-IR"))}
      </div>

      {post.cover && (
        <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-6 space-y-4 leading-loose text-fg/90">
        {post.body.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="whitespace-pre-wrap">{linkify(para)}</p>
        ))}
      </div>
    </article>
  );
}
