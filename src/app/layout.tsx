import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { CartProvider } from "@/components/cart-provider";
import { CompareProvider } from "@/components/compare-provider";
import StructuredData from "@/components/seo/StructuredData";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.brand.name} | ${siteConfig.brand.tagline}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${siteConfig.brand.name} | ${siteConfig.brand.tagline}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brand.name} | ${siteConfig.brand.tagline}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: `rgb(${siteConfig.theme.primary.replaceAll(" ", ",")})`,
};

// تزریق رنگ برند از config + اسکریپت ضدِفلش تم
const brandVars = `
:root{
  --c-primary:${siteConfig.theme.primary};
  --c-primary-deep:${siteConfig.theme.primaryDeep};
  --c-primary-soft:${siteConfig.theme.primarySoft};
  --c-primary-fg:${siteConfig.theme.primaryFg};
  --c-accent:${siteConfig.theme.accent};
}`;

const themeScript = `
(function(){try{
  var t=localStorage.getItem('shop-theme');
  var m=window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark');}
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandVars }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <StructuredData />
        <CartProvider>
          <CompareProvider>{children}</CompareProvider>
        </CartProvider>
      </body>
    </html>
  );
}
