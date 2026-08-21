import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CatalogPage } from "@/components/storefront/catalog-page"
import { catalogQuerySchema } from "@/lib/validation/schemas"
import { getCollection } from "@/server/services/catalog-service"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) return { title: "Koleksi tidak ditemukan" }
  return {
    title: `Koleksi ${collection.name}`,
    description: collection.description,
    alternates: { canonical: `/koleksi/${collection.slug}` },
    openGraph: { title: collection.name, description: collection.description, images: collection.heroImage ? [collection.heroImage] : undefined },
  }
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams])
  const collection = await getCollection(slug)
  if (!collection) notFound()

  const parsed = catalogQuerySchema.safeParse(raw)
  const query = { ...(parsed.success ? parsed.data : {}), koleksi: collection.slug }

  return (
    <CatalogPage
      title={collection.name}
      eyebrow="Koleksi terbatas / 2026"
      intro={collection.description}
      query={query}
      basePath={`/koleksi/${collection.slug}`}
    />
  )
}
