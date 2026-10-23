import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CompareBar } from "@/components/compare-bar";
import { getCategories } from "@/lib/shop";
import { getSiteConfig } from "@/lib/site-content";

// چیدمان فروشگاه (هدر/فوتر). پنل ادمین از این چیدمان استفاده نمی‌کند.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, cfg] = await Promise.all([getCategories(), getSiteConfig()]);
  return (
    <>
      <Header categories={categories} cfg={cfg} />
      <main>{children}</main>
      <Footer categories={categories} cfg={cfg} />
      <CompareBar />
    </>
  );
}
