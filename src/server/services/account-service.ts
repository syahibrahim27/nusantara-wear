import "server-only"

import { prisma } from "@/lib/db/prisma"
import { DomainError } from "@/lib/http"
import type { AddressInput } from "@/lib/validation/schemas"

export const listCustomerOrders = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: { items: true, shipment: true },
    orderBy: { createdAt: "desc" },
  })

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: { select: { slug: true } } } }, payments: { orderBy: { createdAt: "desc" } }, shipment: true },
  })
  if (!order) throw new DomainError("NOT_FOUND", "Pesanan tidak ditemukan.")
  return order
}

export const listAddresses = (userId: string) =>
  prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })

export async function saveAddress(userId: string, input: AddressInput, addressId?: string) {
  const data = { ...input, line2: input.line2 || null, userId }
  const address = addressId
    ? await prisma.address.update({ where: { id: addressId, userId }, data })
    : await prisma.address.create({ data })
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId, id: { not: address.id } }, data: { isDefault: false } })
  }
  return address
}

export async function deleteAddress(userId: string, addressId: string) {
  const deleted = await prisma.address.deleteMany({ where: { id: addressId, userId } })
  if (deleted.count === 0) throw new DomainError("NOT_FOUND", "Alamat tidak ditemukan.")
}

export const listWishlist = (userId: string) =>
  prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true } } },
    orderBy: { createdAt: "desc" },
  })

export async function toggleWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } })
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return { saved: false }
  }
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) throw new DomainError("NOT_FOUND", "Produk tidak ditemukan.")
  await prisma.wishlistItem.create({ data: { userId, productId } })
  return { saved: true }
}

export const wishlistProductIds = async (userId: string) =>
  new Set((await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } })).map((row) => row.productId))

export async function accountSummary(userId: string) {
  const [orders, addresses, wishlist, spent] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.address.count({ where: { userId } }),
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.order.aggregate({ where: { userId, status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } }, _sum: { grandTotal: true } }),
  ])
  return { orders, addresses, wishlist, totalSpent: spent._sum.grandTotal ?? 0 }
}
