import "server-only"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/db/prisma"
import { DomainError } from "@/lib/http"
import { slugify } from "@/lib/commerce"
import type { SessionUser } from "@/lib/auth/session"
import { lowStockCount, lowStockVariants } from "@/server/services/inventory-service"
import type { JournalAdminInput, ProductAdminInput, PromotionAdminInput } from "@/server/services/types"

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const

export async function recordAudit(actor: SessionUser, action: string, entity: string, entityId: string, summary: string) {
  await prisma.auditLog.create({ data: { actorId: actor.id, actorEmail: actor.email ?? "unknown", action, entity, entityId, summary } })
}

export const listAudit = (take = 20) => prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take })

export async function dashboardMetrics() {
  const [revenue, orderCount, paidCount, topProducts, lowStock, recentOrders, customers] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: [...PAID_STATUSES] } }, _sum: { grandTotal: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: [...PAID_STATUSES] } } }),
    prisma.orderItem.groupBy({ by: ["productName"], _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    lowStockVariants(5),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, orderNumber: true, email: true, status: true, grandTotal: true, createdAt: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ])
  const total = revenue._sum.grandTotal ?? 0
  return {
    revenue: total,
    orderCount,
    averageOrderValue: paidCount ? Math.round(total / paidCount) : 0,
    lowStockCount: await lowStockCount(),
    topProducts: topProducts.map((row) => ({ name: row.productName, sold: row._sum.quantity ?? 0, revenue: row._sum.lineTotal ?? 0 })),
    lowStock,
    recentOrders,
    customers,
  }
}

export const listAdminProducts = (search?: string) =>
  prisma.product.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    include: { category: true, images: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { variants: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })

export const getAdminProduct = (id: string) =>
  prisma.product.findUnique({
    where: { id },
    include: { category: true, images: { orderBy: { position: "asc" } }, variants: { include: { inventory: true }, orderBy: [{ colorName: "asc" }, { size: "asc" }] } },
  })

function productData(input: ProductAdminInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    careInstructions: input.careInstructions,
    details: { material: input.material, modelSizing: input.modelSizing || "Model mengenakan ukuran M." },
    categoryId: input.categoryId,
    basePrice: input.basePrice,
    compareAtPrice: input.compareAtPrice || null,
    status: input.status,
    seoTitle: input.seoTitle || `${input.name} — Nusantara Wear`,
    seoDescription: input.seoDescription || input.description.slice(0, 155),
  }
}

export async function createProduct(actor: SessionUser, input: ProductAdminInput) {
  const slug = input.slug || slugify(input.name)
  if (await prisma.product.findUnique({ where: { slug } })) throw new DomainError("SLUG_TAKEN", "Slug sudah dipakai produk lain.", { slug: ["Slug sudah dipakai."] })
  const product = await prisma.product.create({
    data: {
      ...productData({ ...input, slug }),
      publishedAt: input.status === "ACTIVE" ? new Date() : null,
      images: { create: { url: "/images/products/01.jpg", alt: input.name, width: 1000, height: 1333, position: 0 } },
    },
  })
  await recordAudit(actor, "product.create", "Product", product.id, `Membuat produk ${product.name}`)
  invalidateCatalog(product.slug)
  return product
}

export async function updateProduct(actor: SessionUser, id: string, input: ProductAdminInput) {
  const current = await prisma.product.findUnique({ where: { id } })
  if (!current) throw new DomainError("NOT_FOUND", "Produk tidak ditemukan.")
  const clash = await prisma.product.findUnique({ where: { slug: input.slug } })
  if (clash && clash.id !== id) throw new DomainError("SLUG_TAKEN", "Slug sudah dipakai produk lain.", { slug: ["Slug sudah dipakai."] })
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData(input),
      publishedAt: input.status === "ACTIVE" ? (current.publishedAt ?? new Date()) : null,
      archivedAt: input.status === "ARCHIVED" ? new Date() : null,
    },
  })
  await recordAudit(actor, "product.update", "Product", id, `Memperbarui produk ${product.name}`)
  invalidateCatalog(product.slug, current.slug)
  return product
}

export async function archiveProduct(actor: SessionUser, id: string) {
  const product = await prisma.product.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date(), publishedAt: null } })
  await recordAudit(actor, "product.archive", "Product", id, `Mengarsipkan produk ${product.name}`)
  invalidateCatalog(product.slug)
  return product
}

export function invalidateCatalog(...slugs: (string | undefined)[]) {
  revalidatePath("/")
  revalidatePath("/shop")
  for (const slug of slugs) if (slug) revalidatePath(`/produk/${slug}`)
}

export const listAdminOrders = (status?: string) =>
  prisma.order.findMany({
    where: status && status !== "SEMUA" ? { status: status as never } : {},
    include: { items: { select: { id: true } }, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

export const getAdminOrder = (id: string) =>
  prisma.order.findUnique({ where: { id }, include: { items: true, payments: { orderBy: { createdAt: "desc" } }, shipment: true, user: { select: { name: true, email: true } } } })

export async function createPromotion(actor: SessionUser, input: PromotionAdminInput) {
  if (await prisma.promotion.findUnique({ where: { code: input.code } })) {
    throw new DomainError("CODE_TAKEN", "Kode promo sudah ada.", { code: ["Kode promo sudah ada."] })
  }
  const promotion = await prisma.promotion.create({
    data: {
      code: input.code,
      name: input.name,
      type: input.type,
      value: input.value,
      minimumSubtotal: input.minimumSubtotal,
      maxDiscount: input.maxDiscount || null,
      usageLimit: input.usageLimit || null,
      perCustomerLimit: input.perCustomerLimit,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    },
  })
  await recordAudit(actor, "promotion.create", "Promotion", promotion.id, `Membuat promo ${promotion.code}`)
  return promotion
}

export async function togglePromotion(actor: SessionUser, id: string, isActive: boolean) {
  const promotion = await prisma.promotion.update({ where: { id }, data: { isActive } })
  await recordAudit(actor, "promotion.toggle", "Promotion", id, `${isActive ? "Mengaktifkan" : "Menonaktifkan"} promo ${promotion.code}`)
  return promotion
}

export async function listCustomers() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true, createdAt: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  const totals = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((user) => user.id) }, status: { in: [...PAID_STATUSES] } },
    _sum: { grandTotal: true },
  })
  const spendByUser = new Map(totals.map((row) => [row.userId, row._sum.grandTotal ?? 0]))
  return users.map((user) => ({
    id: user.id,
    name: user.name ?? "Pelanggan",
    emailMasked: maskEmail(user.email),
    joinedAt: user.createdAt,
    orders: user._count.orders,
    totalSpent: spendByUser.get(user.id) ?? 0,
  }))
}

/** Admin tidak perlu melihat alamat email penuh untuk pekerjaan sehari-hari. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  const visible = name.slice(0, 2)
  return `${visible}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`
}

export const listAdminJournal = () =>
  prisma.journalPost.findMany({ include: { author: { select: { name: true } } }, orderBy: { updatedAt: "desc" } })

export const getAdminJournalPost = (id: string) => prisma.journalPost.findUnique({ where: { id } })

export async function saveJournalPost(actor: SessionUser, input: JournalAdminInput, id?: string) {
  const clash = await prisma.journalPost.findUnique({ where: { slug: input.slug } })
  if (clash && clash.id !== id) throw new DomainError("SLUG_TAKEN", "Slug artikel sudah dipakai.", { slug: ["Slug sudah dipakai."] })
  const data = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    coverImage: input.coverImage,
    status: input.status,
    seoTitle: input.seoTitle || input.title,
    seoDescription: input.seoDescription || input.excerpt.slice(0, 155),
    publishedAt: input.status === "PUBLISHED" ? (clash?.publishedAt ?? new Date()) : null,
  }
  const post = id
    ? await prisma.journalPost.update({ where: { id }, data })
    : await prisma.journalPost.create({ data: { ...data, authorId: actor.id } })
  await recordAudit(actor, id ? "journal.update" : "journal.create", "JournalPost", post.id, `${id ? "Memperbarui" : "Menulis"} artikel ${post.title}`)
  revalidatePath("/journal")
  revalidatePath(`/journal/${post.slug}`)
  return post
}
