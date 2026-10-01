import type { MetadataRoute } from "next";
import { CITIES, COLLECTIONS } from "@/lib/constants";
import { getStore } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getStore().listPropertySlugs();
  const staticRoutes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "daily" },
    { path: "/properties", priority: 0.9, changeFrequency: "daily" },
    { path: "/collections", priority: 0.7, changeFrequency: "weekly" },
    { path: "/neighborhoods", priority: 0.7, changeFrequency: "weekly" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/list-property", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  ];

  return [
    ...staticRoutes.map((r) => ({ url: absoluteUrl(r.path), changeFrequency: r.changeFrequency, priority: r.priority })),
    ...COLLECTIONS.map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...CITIES.map((c) => ({ url: absoluteUrl(`/neighborhoods/${c.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...properties.map((p) => ({
      url: absoluteUrl(`/properties/${p.slug}`),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
