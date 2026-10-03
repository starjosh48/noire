import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/checkout", "/cart", "/orders", "/auth", "/login", "/api", "/search"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
