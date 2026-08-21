import "server-only"

import { availableStock, variantLabel } from "@/lib/commerce"
import type { CatalogQuery } from "@/lib/validation/schemas"
import * as repo from "@/server/repositories/catalog-repository"
import type { ProductDetailRow, ProductListRow } from "@/server/repositories/catalog-repository"

export const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2U0ZGRkMSIvPjwvc3ZnPg=="

export type ImageView = { url: string; alt: string; width: number; height: number }
export type ProductSummary = {
  id: string
  slug: string
  name: string
  price: number
  compareAtPrice: number | null
  image: ImageView
  categoryName: string
  categorySlug: string
  collectionName: string | null
  collectionSlug: string | null
  colors: { name: string; hex: string }[]
  sizes: string[]
  inStock: boolean
  rating: number | null
  reviewCount: number
}

export type VariantView = {
  id: string
  sku: string
  colorName: string
  colorHex: string
  size: string
  price: number
  available: number
  label: string
}

export type ProductDetailView = ProductSummary & {
  description: string
  material: string
  modelSizing: string
  careInstructions: string
  images: ImageView[]
  variants: VariantView[]
  tags: { name: string; slug: string }[]
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: Date | null
  reviews: { id: string; rating: number; title: string; body: string; author: string; createdAt: Date }[]
}

const fallbackImage: ImageView = { url: "/images/products/01.jpg", alt: "Nusantara Wear", width: 1000, height: 1333 }
const detailsOf = (details: unknown) => (details && typeof details === "object" ? (details as Record<string, unknown>) : {})

function summarize(row: ProductListRow | ProductDetailRow, rating?: { average: number; count: number }): ProductSummary {
  const colors = [...new Map(row.variants.map((variant) => [variant.colorName, variant.colorHex])).entries()].map(([name, hex]) => ({ name, hex }))
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]
  const sizes = [...new Set(row.variants.map((variant) => variant.size))].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
  const image = row.images[0] ? { url: row.images[0].url, alt: row.images[0].alt, width: row.images[0].width, height: row.images[0].height } : fallbackImage
  const collection = row.collections[0]?.collection ?? null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.basePrice,
    compareAtPrice: row.compareAtPrice,
    image,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    collectionName: collection?.name ?? null,
    collectionSlug: collection?.slug ?? null,
    colors,
    sizes,
    inStock: row.variants.some((variant) => variant.inventory && availableStock(variant.inventory) > 0),
    rating: rating?.count ? rating.average : null,
    reviewCount: rating?.count ?? 0,
  }
}

async function withRatings(rows: (ProductListRow | ProductDetailRow)[]): Promise<ProductSummary[]> {
  const ratings = await repo.ratingsFor(rows.map((row) => row.id))
  return rows.map((row) => summarize(row, ratings.get(row.id)))
}

export type CatalogResult = {
  products: ProductSummary[]
  total: number
  page: number
  pageCount: number
  pageSize: number
}

export async function searchCatalog(query: CatalogQuery): Promise<CatalogResult> {
  const { rows, total, page, pageCount, pageSize } = await repo.findProducts(query)
  return { products: await withRatings(rows), total, page, pageCount, pageSize }
}

export async function getProductDetail(slug: string): Promise<ProductDetailView | null> {
  const row = await repo.findProductBySlug(slug)
  if (!row) return null
  const ratings = await repo.ratingsFor([row.id])
  const details = detailsOf(row.details)
  return {
    ...summarize(row, ratings.get(row.id)),
    description: row.description,
    material: typeof details.material === "string" ? details.material : "Material pilihan studio.",
    modelSizing: typeof details.modelSizing === "string" ? details.modelSizing : "Model mengenakan ukuran M.",
    careInstructions: row.careInstructions,
    images: row.images.map((image) => ({ url: image.url, alt: image.alt, width: image.width, height: image.height })),
    variants: row.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      price: variant.priceOverride ?? row.basePrice,
      available: variant.inventory ? availableStock(variant.inventory) : 0,
      label: variantLabel(variant.colorName, variant.size),
    })),
    tags: row.tags.map((entry) => ({ name: entry.tag.name, slug: entry.tag.slug })),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishedAt: row.publishedAt,
    reviews: row.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      author: review.user.name ?? "Pelanggan Nusantara",
      createdAt: review.createdAt,
    })),
  }
}

export async function getRelatedProducts(product: ProductDetailView, categoryId?: string) {
  const row = await repo.findProductBySlug(product.slug)
  if (!row) return []
  const rows = await repo.findRelatedProducts({ id: row.id, categoryId: categoryId ?? row.categoryId }, row.tags.map((entry) => entry.tagId))
  return withRatings(rows)
}

export const getFeaturedProducts = async (take?: number) => withRatings(await repo.findFeaturedProducts(take))
export const getBestSellers = async (take?: number) => withRatings(await repo.findBestSellers(take))
export const getCategories = () => repo.listCategories()
export const getCollections = () => repo.listCollections()
export const getCollection = (slug: string) => repo.findCollectionBySlug(slug)
export const getCategory = (slug: string) => repo.findCategoryBySlug(slug)
export const getFacets = () => repo.catalogFacets()
export const getActiveProductSlugs = () => repo.listActiveProductSlugs()
