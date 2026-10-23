import Link from "next/link";
import { Handshake, Store, Hospital, Briefcase, Send, Phone, Check, CheckCircle2, Upload } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getSiteConfig } from "@/lib/site-content";
import { SubmitButton } from "@/components/submit-button";
import { submitJobForm } from "./actions";

export const metadata = { title: "همکاری با ما" };
export const revalidate = 3600;

const programs = [
  {
    icon: Hospital,
    title: "تعمیرگاه‌ها و فروشگاه‌ها",
    desc: "تأمین مستقیم و قراردادی پوشاک برای بوتیک‌ها، فروشگاه‌ها و سازمان‌ها با شرایط ویژه.",
    points: ["قیمت قراردادی و تراز مالی", "ارسال منظم و زمان‌بندی‌شده", "پشتیبانی فنی اختصاصی"],
  },
  {
    icon: Store,
    title: "فروشگاه‌ها و توزیع‌کنندگان",
    desc: "نمایندگی رسمی فروش محصولات ما در شهر و استان شما با حاشیهٔ سود مناسب و آموزش لازم.",
    points: ["نمایندگی انحصاری منطقه‌ای", "تخفیف‌های پلکانی عمده", "موارد تبلیغاتی و کاتالوگ"],
  },
  {
    icon: Briefcase,
    title: "متخصصین و پرسنل درمانی",
    desc: "تأمین تجهیزات مورد نیاز پزشکان، دندانپزشکان و پرستاران با شرایط ویژهٔ حرفه‌ای.",
    points: ["مشاورهٔ تخصصی رایگان", "خدمات تعمیر و نگهداری", "اولویت در سفارشات"],
  },
];

const field = "w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary";

export default async function PartnersPage({ searchParams }: { searchParams: { sent?: string } }) {
  const siteCfg = await getSiteConfig();
  const { contact } = siteCfg;
  const sent = searchParams.sent === "job" ? "job" : searchParams.sent === "duplicate" ? "duplicate" : null;

  return (
    <div className="container-lux py-12">
      <section className="card overflow-hidden bg-brand-soft p-8 text-center md:p-14">
        <Handshake className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">همکاری با ما</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted">
          {siteCfg.brand.name} همواره در تلاش است تا با ایجاد روابط پایدار و سودآور،
          شبکه‌ای از شرکای تجاری موفق را همراه خود داشته باشد. اگر در حوزهٔ تأمین، توزیع یا
          در حوزهٔ پوشاک و مد فعالیت می‌کنید، خوشحال می‌شویم شما را در میان شرکای خود بپذیریم.
        </p>
      </section>

      <section className="mt-10 grid gap-6">
        {programs.map((prog) => (
          <div key={prog.title} className="card p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <prog.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black">{prog.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{prog.desc}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {prog.points.map((pt) => (
                    <span key={pt} className="flex items-center gap-1.5 text-sm font-medium">
                      <Check className="h-4 w-4 text-primary" /> {pt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* فرم/اقدام */}
      <section className="mt-10 card border bg-elev p-8 text-center">
        <h2 className="text-xl font-black">شروع همکاری</h2>
        <p className="mt-2 text-sm text-muted">
          برای شروع همکاری کافی است با کارشناسان ما تماس بگیرید یا درخواست خود را ارسال کنید.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a href={`tel:${contact.phone}`} className="btn-primary">
            <Phone className="h-4.5 w-4.5" /> تماس مستقیم
          </a>
          <a
            href="https://wa.me/989924763171"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <Send className="h-4.5 w-4.5" /> ارسال درخواست در واتساپ
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">شماره تماس: <span dir="ltr">{contact.phone}</span></p>
      </section>

      {/* فرم استخدام */}
      <section id="apply" className="mx-auto mt-10 max-w-2xl scroll-mt-24">
        {sent === "job" && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            درخواست استخدام شما ثبت شد — کارشناسان ما بررسی و تماس می‌گیرند.
          </div>
        )}
        {sent === "duplicate" && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-600 dark:text-amber-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            شما قبلاً برای این حوزه کاری درخواست ثبت کرده‌اید — نیازی به ارسال دوباره نیست.
          </div>
        )}
        <form action={submitJobForm} encType="multipart/form-data" className="card space-y-4 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">فرم استخدام</h2>
              <p className="text-xs text-muted">برای افرادی که می‌خواهند به تیم ما بپیوندند</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">نام و نام خانوادگی</span>
              <input name="name" required minLength={2} className={field} placeholder="مثلاً: علی رضایی" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">موبایل</span>
              <input name="mobile" required inputMode="tel" className={field} placeholder="09123456789" dir="ltr" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">حوزه کاری درخواستی</span>
              <select name="position" required defaultValue="" className={field}>
                <option value="" disabled>انتخاب کنید…</option>
                <option>کارشناس خدمات پس از فروش</option>
                <option>کارشناس فروش</option>
                <option>کارشناس بازرگانی</option>
                <option>کارشناس حسابداری</option>
                <option>کارشناس اداری</option>
                <option>دیگر</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">شهر (اختیاری)</span>
              <input name="city" className={field} placeholder="مثلاً: تهران" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">سوابق و توضیحات (اختیاری)</span>
            <textarea name="message" rows={3} className={field} placeholder="سابقهٔ کاری، مهارت‌ها و..." />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <Upload className="h-4 w-4" /> فایل رزومه (اختیاری — pdf یا word، حداکثر ۱۰ مگ)
            </span>
            <input
              type="file"
              name="resumeFile"
              accept="application/pdf,.doc,.docx"
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-fg hover:file:opacity-90"
            />
          </label>
          <SubmitButton pendingLabel="در حال ارسال…" className="btn-primary w-full justify-center">
            <Send className="h-4 w-4" /> ارسال درخواست استخدام
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
