"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

type Shape = "free" | "square" | "wide" | "round";

const SHAPES: { id: Shape; label: string; aspect?: number; round?: boolean }[] = [
  { id: "free", label: "آزاد" },
  { id: "square", label: "مربع", aspect: 1 },
  { id: "wide", label: "عریض ۱۶:۹", aspect: 16 / 9 },
  { id: "round", label: "دایره‌ای", aspect: 1, round: true },
];

/** ویرایشگر عکس: کراپ (آزاد/مربع/عریض/دایره) + زوم + روشنایی/کنتراست/غلظت رنگ */
export function ImageEditor({
  src,
  fileName,
  onDone,
  onClose,
}: {
  src: string;
  fileName: string;
  onDone: (file: File) => void;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [shape, setShape] = useState<Shape>("free");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const active = SHAPES.find((s) => s.id === shape)!;
  const liveFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

  const onCropComplete = useCallback((_a: Area, pixels: Area) => setArea(pixels), []);

  async function apply() {
    if (!area) return;
    setBusy(true);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = src;
      });
      const canvas = document.createElement("canvas");
      const w = Math.round(area.width);
      const h = Math.round(area.height);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      if (active.round) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);
      const type = active.round ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, type, 0.88)
      );
      if (!blob) throw new Error("export");
      const base = fileName.replace(/\.[a-z]+$/i, "") || "edited";
      onDone(new File([blob], `${base}-edited-${Date.now()}.${active.round ? "png" : "jpg"}`, { type }));
    } finally {
      setBusy(false);
    }
  }

  const slider = "w-full accent-[rgb(var(--c-primary))]";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="surface flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-sm font-black">ویرایش عکس</span>
          <button onClick={onClose} aria-label="بستن" className="text-xl leading-none text-muted hover:text-fg">×</button>
        </div>

        <div className="relative h-80 bg-black/80">
          <p className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
            بکش تا جابه‌جا شود • گوشه‌ها را بکش تا کراپ شود
          </p>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={active.aspect}
            cropShape={active.round ? "round" : "rect"}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              mediaStyle: { filter: liveFilter },
              cropAreaStyle: { filter: liveFilter },
            }}
          />
        </div>

        <div className="space-y-3 overflow-y-auto p-4 text-xs">
          <div className="flex flex-wrap gap-2">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                className={`rounded-full px-3 py-1.5 font-bold transition-colors ${
                  shape === s.id ? "bg-brand-grad text-primary-fg" : "border hover:border-primary hover:text-primary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 flex justify-between text-muted"><span>بزرگ‌نمایی</span><span>{Math.round(zoom * 100)}٪</span></span>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className={slider} />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-muted"><span>روشنایی</span><span>{brightness}٪</span></span>
            <input type="range" min={40} max={160} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className={slider} />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-muted"><span>کنتراست</span><span>{contrast}٪</span></span>
            <input type="range" min={40} max={160} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className={slider} />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-muted"><span>غلظت رنگ</span><span>{saturate}٪</span></span>
            <input type="range" min={0} max={200} value={saturate} onChange={(e) => setSaturate(Number(e.target.value))} className={slider} />
          </label>
        </div>

        <div className="flex gap-2 border-t p-4">
          <button type="button" onClick={apply} disabled={busy || !area} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? "در حال اعمال…" : "اعمال ویرایش"}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">انصراف</button>
        </div>
        <p className="border-t bg-primary-soft/40 px-4 py-2 text-center text-[11px] text-muted">
          بعد از «اعمال»، حتماً دکمه «ذخیرهٔ تغییرات» پایین فرم را بزن تا روی سایت بنشیند
        </p>
      </div>
    </div>
  );
}
