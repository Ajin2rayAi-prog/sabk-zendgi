"use server";

import { redirect } from "next/navigation";
import { signInCustomer, signOutCustomer } from "@/lib/customer";
import { normalizeMobile, createOtp, verifyOtp } from "@/lib/otp";

/** مسیر بازگشت امن (فقط داخلی) */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

/** مرحلهٔ ۱: دریافت شماره و ارسال کد */
export async function requestOtpAction(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? "/account"));
  const mobile = normalizeMobile(String(formData.get("mobile") ?? ""));
  if (!mobile) {
    redirect(`/login?e=mobile&next=${encodeURIComponent(next)}`);
  }

  const code = await createOtp(mobile);
  const params = new URLSearchParams({ step: "verify", mobile, next });
  // در حالت توسعه کد را روی صفحه نشان می‌دهیم (سامانهٔ پیامک واقعی هنوز متصل نیست)
  if (process.env.NODE_ENV !== "production") params.set("dev", code);
  redirect(`/login?${params.toString()}`);
}

/** مرحلهٔ ۲: بررسی کد و ورود */
export async function verifyOtpAction(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? "/account"));
  const mobile = normalizeMobile(String(formData.get("mobile") ?? ""));
  const code = String(formData.get("code") ?? "").trim();
  if (!mobile) redirect(`/login?e=mobile&next=${encodeURIComponent(next)}`);

  const customer = await verifyOtp(mobile, code);
  if (!customer) {
    const params = new URLSearchParams({ step: "verify", mobile, next, e: "code" });
    redirect(`/login?${params.toString()}`);
  }

  signInCustomer(customer.id);
  redirect(next);
}

export async function logoutCustomerAction() {
  signOutCustomer();
  redirect("/");
}
