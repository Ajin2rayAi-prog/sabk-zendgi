import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** ذخیرهٔ فایل عکس در public/uploads (jpg/png/webp/gif — حداکثر ۵ مگابایت) */
const IMAGE_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function saveImageFile(
  file: FormDataEntryValue | null,
  prefix: string,
  maxMb = 5
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_BY_TYPE[file.type];
  if (!ext) throw new Error("فرمت تصویر نامعتبر است (فقط jpg/png/webp/gif)");
  if (file.size > maxMb * 1024 * 1024) throw new Error(`حجم تصویر بیش از ${maxMb} مگابایت است`);
  const safe = (prefix || "file").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const name = `${safe || "file"}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** ذخیرهٔ فایل ویدیو در public/uploads (mp4/webm — حداکثر ۱۰۰ مگابایت) */
const VIDEO_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/x-m4v": "m4v",
};

export async function saveVideoFile(
  file: FormDataEntryValue | null,
  prefix: string,
  maxMb = 100
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = VIDEO_BY_TYPE[file.type];
  if (!ext) throw new Error("فرمت ویدیو نامعتبر است (فقط mp4/webm)");
  if (file.size > maxMb * 1024 * 1024) throw new Error(`حجم ویدیو بیش از ${maxMb} مگابایت است`);
  const safe = (prefix || "file").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const name = `${safe || "file"}-video-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
