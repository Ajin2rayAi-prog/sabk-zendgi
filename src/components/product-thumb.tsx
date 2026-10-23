import { ProductArt } from "./product-art";
import { cn } from "@/lib/utils";

/**
 * تصویر محصول. اگر product.image (عکس واقعی محلی مثل /products/amt-101.jpg) موجود باشد
 * همان نمایش داده می‌شود؛ در غیر این صورت تصویرسازی برداریِ اختصاصیِ دسته (ProductArt)
 * که همیشه و بدون نیاز به اینترنت لود می‌شود.
 */
export function ProductThumb({
  categorySlug,
  image,
  alt,
  seed = 0,
  className,
}: {
  categorySlug: string;
  image?: string;
  alt: string;
  seed?: number;
  className?: string;
}) {
  if (image) {
    // زیرمسیر دیپلوی (مثلاً زیرپوشهٔ صفحات استاتیک) از متغیر محیطی خوانده می‌شود؛
    // در دیپلوی اصلی (دامنهٔ ریشه) خالی است و مسیر دست‌نخورده می‌ماند.
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const src = image.startsWith("/") ? `${base}${image}` : image;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} />
    );
  }

  return <ProductArt categorySlug={categorySlug} seed={seed} className={className} />;
}
