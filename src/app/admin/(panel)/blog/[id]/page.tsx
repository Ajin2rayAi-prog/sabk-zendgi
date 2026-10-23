import { notFound } from "next/navigation";
import { getPostById } from "@/lib/posts";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ویرایش مقاله" };

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await getPostById(params.id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">ویرایش مقاله</h1>
      <PostForm post={post} />
    </div>
  );
}
