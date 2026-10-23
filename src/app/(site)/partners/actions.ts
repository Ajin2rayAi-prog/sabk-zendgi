"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/** ذخیرهٔ رزومه در public/uploads (فقط pdf/doc — حداکثر ۱۰ مگابایت) */
async function saveResume(file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = RESUME_TYPES[file.type];
  if (!ext) throw new Error("فرمت رزومه نامعتبر است (فقط pdf یا word)");
  if (file.size > 10 * 1024 * 1024) throw new Error("حجم رزومه بیش از ۱۰ مگابایت است");
  const name = `resume-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** نرمال‌سازی موبایل: ارقام فارسی→انگلیسی، فقط 09xxxxxxxxx قبول است */
function normMobile(v: FormDataEntryValue | null): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  let s = String(v ?? "").replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  s = s.replace(/[^\d]/g, "");
  if (!/^09\d{9}$/.test(s)) throw new Error("شماره موبایل معتبر نیست (مثل 09123456789)");
  return s;
}

/** ثبت فرم استخدام (عمومی — بدون ورود) */
export async function submitJobForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("نام را کامل وارد کنید");
  const mobile = normMobile(formData.get("mobile"));
  const position = String(formData.get("position") ?? "").trim() || null;
  // ضدتکراری: همون موبایل برای همون حوزه قبلاً ثبت کرده باشد، دوباره صندوق را پر نمی‌کند
  const dup = await prisma.formSubmission.findFirst({
    where: { type: "JOB", mobile, position },
    select: { id: true },
  });
  if (dup) redirect("/partners?sent=duplicate#apply");
  const fileUrl = await saveResume(formData.get("resumeFile"));
  await prisma.formSubmission.create({
    data: {
      type: "JOB",
      name,
      mobile,
      city: String(formData.get("city") ?? "").trim() || null,
      position,
      message: String(formData.get("message") ?? "").trim() || null,
      fileUrl,
    },
  });
  redirect("/partners?sent=job#apply");
}
