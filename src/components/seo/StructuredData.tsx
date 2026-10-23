import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, OG_IMAGE } from "@/lib/seo";

/** Organization + WebSite + Store JSON-LD for the shop. Server-rendered. */
export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        logo: `${SITE_URL}${OG_IMAGE}`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "fa-IR",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Store",
        "@id": `${SITE_URL}/#store`,
        name: SITE_NAME,
        url: SITE_URL,
        image: `${SITE_URL}${OG_IMAGE}`,
        description: SITE_DESCRIPTION,
        priceRange: "$$",
        areaServed: "ایران",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
