"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { ImageEditor } from "./image-editor";

/** انتخاب عکس با پیش‌نمایش فوری + ویرایشگر (کراپ/افکت) */
export function ImagePicker({
  name,
  accept = "image/png,image/jpeg,image/webp,image/gif",
  current,
  label,
}: {
  name: string;
  accept?: string;
  current?: string | null;
  label: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");
  const [editing, setEditing] = useState(false);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) {
      setPreview(null);
      setEditSrc(null);
      return;
    }
    setFileName(f.name);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setEditSrc(url);
  }

  function applyEdit(file: File) {
    const input = inputRef.current;
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    }
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setEditing(false);
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border bg-elev">
          {preview || current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview ?? current ?? ""}
              alt="پیش‌نمایش"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-[11px] text-muted">بدون عکس</span>
          )}
        </div>
        <div className="min-w-[220px] flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              name={name}
              accept={accept}
              onChange={(e) => pick(e.target.files?.[0])}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-fg hover:file:opacity-90"
            />
            {editSrc && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:border-primary hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" /> ویرایش عکس
              </button>
            )}
          </div>
          <p className="text-xs text-muted">
            {preview
              ? "✅ پیش‌نمایش زنده است — می‌توانی ویرایشش کنی، بعد ذخیره بزن"
              : "با انتخاب فایل، همین‌جا پیش‌نمایش می‌بینی"}
          </p>
        </div>
      </div>
      {editing && editSrc && (
        <ImageEditor
          src={editSrc}
          fileName={fileName}
          onDone={applyEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
