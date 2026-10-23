import { Star } from "lucide-react";

/** نمایش ستاره‌ای امتیاز (فقط نمایش). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-border"
          }
        />
      ))}
    </span>
  );
}
