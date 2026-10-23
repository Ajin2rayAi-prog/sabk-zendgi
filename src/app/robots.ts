import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated / transactional / admin areas stay out of the index.
        disallow: ["/admin", "/api", "/account", "/login", "/cart", "/checkout"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
