import type { MetadataRoute } from "next";
import { getProductSlugs } from "@/lib/catalog/queries";
import { siteConfig } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/shop", "/collections", "/discovery", "/about", "/care"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const products = await getProductSlugs().catch(() => []);
  return [
    ...staticPages,
    ...products.map((p) => ({
      url: `${siteConfig.url}/shop/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
