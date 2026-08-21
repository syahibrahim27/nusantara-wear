import "server-only"

import { prisma } from "@/lib/db/prisma"
import { DomainError } from "@/lib/http"
import { availableStock } from "@/lib/commerce"

export async function listInventory(search?: string) {
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      ...(search
        ? { OR: [{ sku: { contains: search, mode: "insensitive" as const } }, { product: { name: { contains: search, mode: "insensitive" as const } } }] }
        : {}),
    },
    include: { inventory: true, product: { select: { name: true, slug: true } } },
    orderBy: [{ product: { name: "asc" } }, { colorName: "asc" }, { size: "asc" }],
    take: 200,
  })
  return variants.map((variant) => ({
    variantId: variant.id,
    sku: variant.sku,
    productName: variant.product.name,
    productSlug: variant.product.slug,
    label: `${variant.colorName} / ${variant.size}`,
    onHand: variant.inventory?.onHand ?? 0,
    reserved: variant.inventory?.reserved ?? 0,
    available: variant.inventory ? availableStock(variant.inventory) : 0,
    reorderPoint: variant.inventory?.reorderPoint ?? 3,
    version: variant.inventory?.version ?? 0,
  }))
}

export const listMovements = (variantId?: string, take = 30) =>
  prisma.inventoryMovement.findMany({
    where: variantId ? { variantId } : {},
    include: { variant: { include: { product: { select: { name: true } } } }, actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take,
  })

/** Penyesuaian stok selalu tercatat sebagai movement dengan alasan dan aktor. */
export async function adjustInventory(input: { variantId: string; quantity: number; type: "RESTOCK" | "RETURN" | "ADJUSTMENT"; reason: string; actorId: string }) {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({ where: { variantId: input.variantId } })
    if (!inventory) throw new DomainError("NOT_FOUND", "Data inventory variant tidak ditemukan.")
    const nextOnHand = inventory.onHand + input.quantity
    if (nextOnHand < 0) throw new DomainError("INSUFFICIENT_STOCK", `Stok tidak boleh negatif. Tersedia ${inventory.onHand}.`)
    if (nextOnHand < inventory.reserved) throw new DomainError("INSUFFICIENT_STOCK", "Stok tidak boleh lebih kecil dari jumlah yang direservasi.")

    const updated = await tx.inventory.updateMany({
      where: { variantId: input.variantId, version: inventory.version },
      data: { onHand: nextOnHand, version: { increment: 1 } },
    })
    if (updated.count !== 1) throw new DomainError("INVALID_TRANSITION", "Stok baru saja berubah. Muat ulang lalu coba lagi.")

    await tx.inventoryMovement.create({
      data: { variantId: input.variantId, type: input.type, quantity: input.quantity, reason: input.reason, actorId: input.actorId },
    })
    return { onHand: nextOnHand }
  })
}

export async function lowStockVariants(take = 8) {
  const rows = await prisma.inventory.findMany({
    include: { variant: { include: { product: { select: { name: true, slug: true } } } } },
    orderBy: { onHand: "asc" },
    take: 60,
  })
  return rows
    .filter((row) => availableStock(row) <= row.reorderPoint)
    .slice(0, take)
    .map((row) => ({
      variantId: row.variantId,
      sku: row.variant.sku,
      productName: row.variant.product.name,
      label: `${row.variant.colorName} / ${row.variant.size}`,
      available: availableStock(row),
      reorderPoint: row.reorderPoint,
    }))
}

export const lowStockCount = async () => (await lowStockVariants(1000)).length
