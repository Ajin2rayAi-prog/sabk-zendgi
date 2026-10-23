"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * پلیر ویدیوی معرفی محصول.
 *
 * ویدیو آپلود نمی‌شود — فقط لینک آن ذخیره می‌شود (یوتیوب / آپارات / mp4 مستقیم).
 * تا کاربر روی کاور کلیک نکند، iframe یا <video> لود نمی‌شود (سریع‌تر و سبک‌تر).
 *
 * - یوتیوب: https://youtu.be/ID یا https://www.youtube.com/watch?v=ID
 * - آپارات: https://www.aparat.com/v/ID
 * - mp4 مستقیم: هر آدرسی که به .mp4/.webm ختم شود
 */
function toEmbedUrl(url: string): { kind: "iframe"; src: string } | { kind: "file"; src: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // یوتیوب
    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed/${u.pathname.slice(1)}?rel=0` };
    }
    if (host.endsWith("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}?rel=0` };
    }
    if (host.endsWith("youtube.com") && u.pathname.startsWith("/embed/")) {
      return { kind: "iframe", src: `${u.origin}${u.pathname}?rel=0` };
    }

    // آپارات
    if (host === "aparat.com" || host.endsWith(".aparat.com")) {
      const m = u.pathname.match(/\/v\/([a-zA-Z0-9_]+)/);
      if (m) return { kind: "iframe", src: `https://www.aparat.com/video/video/embed/videohash/${m[1]}/vt/frame` };
    }

    // فایل مستقیم
    if (/\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(u.pathname + u.search)) {
      return { kind: "file", src: url };
    }
  } catch {
    // آدرس نسبی مثل /uploads/x.mp4
    if (/^\/.*\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(url)) return { kind: "file", src: url };
  }
  return null;
}

export function ProductVideo({ video, cover, title }: { video: string; cover?: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = toEmbedUrl(video);
  if (!embed) return null;

  const label = `ویدیوی معرفی ${title}`;

  if (embed.kind === "file") {
    return (
      <div className="card overflow-hidden p-0">
        <video
          src={embed.src}
          poster={cover}
          controls
          playsInline
          className="aspect-video w-full bg-black"
          aria-label={label}
        />
      </div>
    );
  }

  // یوتیوب / آپارات: تا کلیک کاربر فقط کاور نشان داده می‌شود (iframe سبک‌تر)
  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="card group relative block w-full overflow-hidden p-0"
        aria-label={label}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={label} className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary-soft to-primary/20">
            <Play className="h-12 w-12 text-primary" />
          </div>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-lux">
            <Play className="h-7 w-7 fill-primary text-primary" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <iframe
        src={embed.src}
        title={label}
        className="aspect-video w-full"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
