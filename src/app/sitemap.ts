import type { MetadataRoute } from "next"

import { getActiveProductSlugs, getCollections } from "@/server/services/catalog-service"
import { listPublishedJournalSlugs } from "@/server/services/journal-service"
import { appUrl } from "@/lib/app-url"

export const dynamic = "force-dynamic"

const base = () => appUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = base()
  const [products, collections, posts] = await Promise.all([getActiveProductSlugs(), getCollections(), listPublishedJournalSlugs()])

  const staticPages: MetadataRoute.Sitemap = [
    ["", 1, "weekly"],
    ["/shop", 0.9, "daily"],
    ["/tentang", 0.6, "monthly"],
    ["/journal", 0.7, "weekly"],
    ["/lacak-pesanan", 0.5, "monthly"],
    ["/kebijakan/pengiriman", 0.4, "yearly"],
    ["/kebijakan/retur", 0.4, "yearly"],
    ["/privacy", 0.3, "yearly"],
    ["/terms", 0.3, "yearly"],
  ].map(([path, priority, changeFrequency]) => ({
    url: `${origin}${path as string}`,
    lastModified: new Date(),
    changeFrequency: changeFrequency as "daily" | "weekly" | "monthly" | "yearly",
    priority: priority as number,
  }))

  return [
    ...staticPages,
    ...products.map((product) => ({ url: `${origin}/produk/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...collections.map((collection) => ({ url: `${origin}/koleksi/${collection.slug}`, lastModified: collection.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...posts.map((post) => ({ url: `${origin}/journal/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ]
}
