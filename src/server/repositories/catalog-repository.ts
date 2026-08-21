import "server-only"

import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma/client"
import type { CatalogQuery } from "@/lib/validation/schemas"

export const PAGE_SIZE = 12

const listInclude = {
  category: true,
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: { where: { isActive: true }, include: { inventory: true } },
  collections: { include: { collection: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductInclude

const detailInclude = {
  category: true,
  images: { orderBy: { position: "asc" } },
  variants: { where: { isActive: true }, include: { inventory: true }, orderBy: [{ colorName: "asc" }, { createdAt: "asc" }] },
  collections: { include: { collection: true } },
  tags: { include: { tag: true } },
  reviews: { where: { status: "PUBLISHED" }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 6 },
} satisfies Prisma.ProductInclude

export type ProductListRow = Prisma.ProductGetPayload<{ include: typeof listInclude }>
export type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof detailInclude }>

const csv = (value?: string) => (value ? value.split(",").map((part) => part.trim()).filter(Boolean) : [])

export function catalogWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  const sizes = csv(query.ukuran)
  const colors = csv(query.warna)
  const where: Prisma.ProductWhereInput = { status: "ACTIVE", publishedAt: { not: null } }

  if (query.q) {
    const q = query.q
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      { collections: { some: { collection: { name: { contains: q, mode: "insensitive" } } } } },
    ]
  }
  if (query.kategori) where.category = { slug: query.kategori }
  if (query.koleksi) where.collections = { some: { collection: { slug: query.koleksi } } }
  if (query.hargaMin !== undefined || query.hargaMax !== undefined) {
    where.basePrice = { ...(query.hargaMin !== undefined ? { gte: query.hargaMin } : {}), ...(query.hargaMax !== undefined ? { lte: query.hargaMax } : {}) }
  }

  const variantFilters: Prisma.ProductVariantWhereInput = { isActive: true }
  if (sizes.length) variantFilters.size = { in: sizes }
  if (colors.length) variantFilters.colorName = { in: colors }
  if (query.stok === "tersedia") variantFilters.inventory = { is: { onHand: { gt: 0 } } }
  if (sizes.length || colors.length || query.stok === "tersedia") where.variants = { some: variantFilters }

  return where
}

function catalogOrderBy(sort: CatalogQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "harga-rendah":
      return [{ basePrice: "asc" }, { name: "asc" }]
    case "harga-tinggi":
      return [{ basePrice: "desc" }, { name: "asc" }]
    case "terlaris":
      return [{ orderItems: { _count: "desc" } }, { publishedAt: "desc" }]
    default:
      return [{ publishedAt: "desc" }, { name: "asc" }]
  }
}

export async function findProducts(query: CatalogQuery) {
  const page = query.page ?? 1
  const where = catalogWhere(query)
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: listInclude, orderBy: catalogOrderBy(query.sort), skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.product.count({ where }),
  ])
  return { rows, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export const findProductBySlug = (slug: string) => prisma.product.findFirst({ where: { slug, status: "ACTIVE" }, include: detailInclude })

export const findProductBySlugAnyStatus = (slug: string) => prisma.product.findUnique({ where: { slug }, include: detailInclude })

export const findRelatedProducts = (product: { id: string; categoryId: string }, tagIds: string[], take = 4) =>
  prisma.product.findMany({
    where: {
      status: "ACTIVE",
      publishedAt: { not: null },
      id: { not: product.id },
      OR: [{ categoryId: product.categoryId }, ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : [])],
    },
    include: listInclude,
    orderBy: [{ publishedAt: "desc" }],
    take,
  })

export const findFeaturedProducts = (take = 8) =>
  prisma.product.findMany({ where: { status: "ACTIVE", publishedAt: { not: null } }, include: listInclude, orderBy: { publishedAt: "desc" }, take })

export const findBestSellers = (take = 8) =>
  prisma.product.findMany({
    where: { status: "ACTIVE", publishedAt: { not: null } },
    include: listInclude,
    orderBy: [{ orderItems: { _count: "desc" } }, { publishedAt: "desc" }],
    take,
  })

export const listCategories = () => prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
export const listCollections = () => prisma.collection.findMany({ orderBy: { createdAt: "asc" } })
export const findCollectionBySlug = (slug: string) => prisma.collection.findUnique({ where: { slug } })
export const findCategoryBySlug = (slug: string) => prisma.category.findUnique({ where: { slug } })

export async function catalogFacets() {
  const [colorRows, sizeRows, priceRange] = await Promise.all([
    prisma.productVariant.findMany({ where: { isActive: true }, select: { colorName: true, colorHex: true }, distinct: ["colorName"], orderBy: { colorName: "asc" } }),
    prisma.productVariant.findMany({ where: { isActive: true }, select: { size: true }, distinct: ["size"] }),
    prisma.product.aggregate({ where: { status: "ACTIVE" }, _min: { basePrice: true }, _max: { basePrice: true } }),
  ])
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]
  return {
    colors: colorRows.map((row) => ({ name: row.colorName, hex: row.colorHex })),
    sizes: sizeRows.map((row) => row.size).sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)),
    minPrice: priceRange._min.basePrice ?? 0,
    maxPrice: priceRange._max.basePrice ?? 0,
  }
}

export async function ratingsFor(productIds: string[]) {
  if (!productIds.length) return new Map<string, { average: number; count: number }>()
  const grouped = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { _all: true },
  })
  return new Map(grouped.map((row) => [row.productId, { average: Math.round((row._avg.rating ?? 0) * 10) / 10, count: row._count._all }]))
}

export const listActiveProductSlugs = () =>
  prisma.product.findMany({ where: { status: "ACTIVE", publishedAt: { not: null } }, select: { slug: true, updatedAt: true } })
