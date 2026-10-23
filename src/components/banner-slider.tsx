"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerSlideItem } from "@/lib/shop";

const AUTOPLAY_MS = 6000;

export function BannerSlider({ slides }: { slides: BannerSlideItem[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  // پخش خودکار — با هاور موس متوقف می‌شود
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  if (count === 0) return null;
  const s = slides[index];
  // تک‌عکس هوشمند: فقط یک عکس از کارفرما گرفته می‌شود و در همه دستگاه‌ها
  // کامل و بدون برش نمایش داده می‌شود (روی پس‌زمینه محو از خودش).
  // اگر برای بنری عکس موبایل جدا ست شده باشد، در موبایل همان استفاده می‌شود.
  const desktopImg = s.image;
  const mobileImg = s.imageMobile ?? s.image;

  // یک جفت «پس‌زمینه محو + عکس کامل» برای هر برک‌پوینت
  const pair = (src: string, cls: string) => (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover opacity-60 blur-2xl saturate-150 ${cls}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={s.title}
        className={`absolute inset-0 h-full w-full object-contain object-top ${cls}`}
      />
    </>
  );

  const inner = (
    <>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={s.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-black"
        >
          {/* عکس: مستقیم از دیسک (بدون بهینه‌ساز) تا بنرهای تازه‌آپلودشده
              همون لحظه دیده شوند. نمایش هوشمند: عکس کامل و بدون برش روی
              پس‌زمینه محو — در موبایل و دسکتاپ یکسان، با هر ابعاد عکسی */}
          {pair(mobileImg, "md:hidden")}
          {pair(desktopImg, "hidden md:block")}
        </motion.div>
      </AnimatePresence>
      {/* گرادیان برای خوانایی متن */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <div className="container-lux absolute inset-x-0 bottom-0 pb-16 pt-24">
        <motion.div
          key={`t-${s.id}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl text-white"
        >
          <h1 className="text-3xl font-black leading-tight drop-shadow-lg sm:text-5xl">
            {s.title}
          </h1>
          {s.subtitle && (
            <p className="mt-3 text-base leading-relaxed opacity-90 drop-shadow sm:text-lg">
              {s.subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </>
  );

  return (
    <section
      className="relative h-[52vh] min-h-[380px] w-full overflow-hidden border-b md:h-[72vh] md:min-h-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {s.link ? (
        <Link href={s.link} className="absolute inset-0" aria-label={s.title}>
          {inner}
        </Link>
      ) : (
        inner
      )}

      {count > 1 && (
        <>
          <button
            onClick={() => go(1)}
            aria-label="بنر بعدی"
            className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => go(-1)}
            aria-label="بنر قبلی"
            className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/55"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {slides.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIndex(i)}
                aria-label={`رفتن به بنر ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
