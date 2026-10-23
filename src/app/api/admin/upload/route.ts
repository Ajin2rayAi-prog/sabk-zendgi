import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { saveVideoFile } from "@/lib/upload";

/** آپلود تکی فایل ویدیو از پنل (با نوار درصد در فرانت) — فقط ادمین.
 *  ورودی: FormData با فیلد file. خروجی: { url } */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  try {
    const form = await req.formData();
    const url = await saveVideoFile(form.get("file"), "upload");
    if (!url) return NextResponse.json({ error: "فایلی دریافت نشد" }, { status: 400 });
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطا در آپلود";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
