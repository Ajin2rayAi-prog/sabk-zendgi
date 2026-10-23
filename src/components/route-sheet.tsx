"use client";

import { useState } from "react";
import { Navigation, MapPin, X } from "lucide-react";

/** دکمهٔ «مسیریابی» — با یک تپ، منوی انتخاب اپ مسیریاب گوشی باز می‌شود
 *  (گوگل‌مپ / ویز / نمایش روی نقشه). هرکدام را داشته باشد باز می‌شود. */
export function RouteSheet({ address, mapUrl }: { address: string; mapUrl: string }) {
  const [open, setOpen] = useState(false);
  const q = encodeURIComponent(address);

  const options = [
    {
      label: "مسیریابی با گوگل‌مپ",
      href: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    },
    {
      label: "مسیریابی با ویز",
      href: `https://waze.com/ul?q=${q}&navigate=yes`,
    },
    { label: "نمایش روی نقشه", href: mapUrl },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/20"
      >
        <Navigation className="h-3.5 w-3.5" /> مسیریابی
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="surface w-full max-w-xs rounded-2xl border p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-black text-fg">
                <MapPin className="h-4 w-4 text-primary" /> با کدام اپ برویم؟
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="بستن"
                className="grid h-8 w-8 place-items-center rounded-lg border text-muted hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2">
              {options.map((o) => (
                <a
                  key={o.label}
                  href={o.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full !py-2.5 text-sm"
                >
                  <Navigation className="h-4 w-4" /> {o.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
