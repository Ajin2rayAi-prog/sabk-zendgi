import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "مقالهٔ جدید" };

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">مقالهٔ جدید</h1>
      <PostForm />
    </div>
  );
}
