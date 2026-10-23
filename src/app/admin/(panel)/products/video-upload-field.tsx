"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";

/** آپلود ویدیو با نوار درصد — مسیر نهایی در input مخفی uploadedVideo می‌نشیند
 *  تا با «ذخیرهٔ تغییرات» فرم اصلی ثبت شود. */
export function VideoUploadField({ current }: { current?: string | null }) {
  const [pct, setPct] = useState<number | null>(null);
  const [doneUrl, setDoneUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startUpload(file: File) {
    setError(null);
    setDoneUrl(null);
    setPct(0);
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && res.url) {
          setDoneUrl(res.url as string);
          setPct(100);
        } else {
          setError(res.error ?? "خطا در آپلود");
          setPct(null);
        }
      } catch {
        setError("پاسخ نامعتبر از سرور");
        setPct(null);
      }
    };
    xhr.onerror = () => {
      setError("قطع ارتباط — دوباره تلاش کنید");
      setPct(null);
    };
    xhr.send(fd);
  }

  return (
    <div>
      {/* مسیر نهایی برای اکشن ذخیرهٔ محصول */}
      <input type="hidden" name="uploadedVideo" value={doneUrl ?? ""} />
      <span className="mb-1.5 block text-xs text-muted">آپلود فایل ویدیو (mp4/webm، حداکثر ۱۰۰ مگ)</span>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,.mp4,.webm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) startUpload(f);
        }}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-fg hover:file:opacity-90"
      />
      {current && !doneUrl && (
        <p className="mt-1.5 truncate text-xs text-muted" dir="ltr">
          فعلی: {current}
        </p>
      )}
      {pct !== null && doneUrl === null && !error && (
        <div className="mt-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted/20">
            <div
              className="h-full rounded-full bg-brand-grad transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-bold text-primary">
            در حال آپلود… {pct}٪ — لطفاً صبر کنید
          </p>
        </div>
      )}
      {doneUrl && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> آپلود تمام شد ✅ حالا «ذخیرهٔ تغییرات» را بزنید
        </p>
      )}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-500">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}
      {pct === null && !doneUrl && !error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Upload className="h-3.5 w-3.5" /> بعد از انتخاب فایل، درصد همین‌جا نشان داده می‌شود
        </p>
      )}
    </div>
  );
}
