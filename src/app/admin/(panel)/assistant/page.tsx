import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Settings } from "lucide-react";
import { isAiReady } from "@/lib/ai";
import { getCurrentAdmin } from "@/lib/auth";
import { ChatBox } from "@/components/chat-box";

export const dynamic = "force-dynamic";
export const metadata = { title: "دستیار هوشمند" };

export default async function AdminAssistantPage() {
  // هزینه‌ساز — فقط مالک
  const me = await getCurrentAdmin();
  if (!me || me.role !== "OWNER") redirect("/admin");
  const ready = await isAiReady();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Sparkles className="h-6 w-6 text-primary" /> دستیار هوشمند
          </h1>
          <p className="mt-1 text-sm text-muted">
            مشاور مدیریتی برای تحلیل فروشگاه، نگارش متن و ایده‌های فروش.
          </p>
        </div>
      </div>

      {!ready && (
        <div className="card mb-4 flex items-center justify-between gap-4 border-amber-400/40 bg-amber-400/10 p-4 text-sm">
          <span>هوش مصنوعی هنوز فعال نشده است. برای استفاده، ابتدا آن را در تنظیمات پیکربندی کنید.</span>
          <Link href="/admin/settings" className="btn-primary shrink-0 !py-2 text-xs">
            <Settings className="h-4 w-4" /> تنظیمات
          </Link>
        </div>
      )}

      <ChatBox
        endpoint="/api/ai/admin"
        greeting="سلام مدیر گرامی 👋 چطور می‌توانم کمک کنم؟ می‌توانم دربارهٔ فروش، محصولات یا نحوهٔ کار با پنل راهنمایی کنم."
        suggestions={[
          "وضعیت فعلی فروشگاه را خلاصه کن",
          "برای یک محصول فیلتر HME توضیح فروش بنویس",
          "چطور یک محصول جدید اضافه کنم؟",
        ]}
      />
    </div>
  );
}
