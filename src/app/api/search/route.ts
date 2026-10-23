import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";

export const dynamic = "force-dynamic";

/** پیشنهادهای زندهٔ جستجو برای دراپ‌داون هدر */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [] });
  try {
    const { products } = await searchProducts(q);
    return NextResponse.json({
      products: products.slice(0, 8).map((p) => ({
        slug: p.slug,
        sku: p.sku,
        title: p.title,
        brand: p.brand,
        image: p.image ?? null,
        categorySlug: p.categorySlug,
      })),
    });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
