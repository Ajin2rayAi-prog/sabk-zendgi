import { Phone, MapPin, Mail, Clock, MessageSquare } from "lucide-react";
import { getSiteConfig } from "@/lib/site-content";

export const metadata = { title: "تماس با ما" };
export const revalidate = 3600;

export default async function ContactPage() {
  const cfg = await getSiteConfig();
  const { contact, social } = cfg;

  return (
    <div className="container-lux py-12">
      <section className="text-center">
        <span className="chip bg-primary-soft text-primary">پشتیبانی و مشاوره</span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">تماس با ما</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          تیم متخصص {cfg.brand.name} آمادهٔ پاسخ به سوالات شما و ارائهٔ مشاورهٔ تخصصی
          دربارهٔ پوشاک و لباس است.
        </p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        {/* تلفن */}
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <Phone className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-sm font-bold">تلفن ثابت</h2>
          <a
            href={`tel:${contact.phone}`}
            dir="ltr"
            className="mt-1 block text-lg font-black text-primary"
          >
            {contact.phone}
          </a>
        </div>

        {/* آدرس */}
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-sm font-bold">آدرس</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{contact.address}</p>
        </div>

        {/* ساعات کاری */}
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-sm font-bold">ساعات کاری</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            شنبه تا چهارشنبه: ۹ تا ۱۸<br />
            پنجشنبه: ۹ تا ۱۳
          </p>
        </div>
      </section>

      {/* کارشناسان فروش */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black">کارشناسان فروش</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {contact.sales.map((s) => (
            <div key={s.phone} className="card flex items-center justify-between p-5">
              <div>
                <div className="text-sm font-bold">{s.name}</div>
                <div className="text-xs text-muted">کارشناس فروش</div>
              </div>
              <a
                href={`tel:${s.phone}`}
                dir="ltr"
                className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm font-black text-primary-deep dark:text-primary"
              >
                <Phone className="h-4 w-4" /> {s.phone}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* شبکه‌های اجتماعی */}
      {social.length > 0 && (
        <section className="mt-8 card p-6 text-center">
          <h2 className="flex items-center justify-center gap-2 text-lg font-bold">
            <MessageSquare className="h-5 w-5 text-primary" /> ما را در شبکه‌های اجتماعی دنبال کنید
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border bg-elev px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                {s.label}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
