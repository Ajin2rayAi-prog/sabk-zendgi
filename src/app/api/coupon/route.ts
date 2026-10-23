import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

/** اعتبارسنجی کد تخفیف برای نمایش زندهٔ مقدار تخفیف در پرداخت. */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, discount: 0, message: "درخواست نامعتبر" }, { status: 400 });
  }
  const code = String(body?.code ?? "");
  const total = Math.max(0, Math.floor(Number(body?.total) || 0));
  const result = await validateCoupon(code, total);
  return NextResponse.json(result);
}
