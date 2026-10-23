import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer";
import { CheckoutForm } from "@/components/checkout-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ثبت سفارش" };

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/checkout");

  return (
    <div className="container-lux py-8">
      <h1 className="mb-6 text-2xl font-black">ثبت سفارش</h1>
      <CheckoutForm defaultName={customer.name ?? ""} mobile={customer.mobile} />
    </div>
  );
}
