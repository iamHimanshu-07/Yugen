/**
 * robots.txt — emitted at /robots.txt. Open crawl, point to sitemap.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://yugen-x.vercel.app/sitemap.xml",
    host: "https://yugen-x.vercel.app",
  };
}