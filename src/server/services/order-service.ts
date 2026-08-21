import "server-only"

import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { DomainError } from "@/lib/http"
import { availableStock, calculateQuote, canTransitionOrder, FULFILLMENT_FOR_STATUS, SHIPPING_METHODS, shippingBaseFor, variantLabel } from "@/lib/commerce"
import type { OrderStatus, ShippingMethod } from "@/lib/commerce"
import type { CheckoutInput } from "@/lib/validation/schemas"
import { checkoutLines } from "@/server/services/cart-service"
import { findPromotionForQuote } from "@/server/services/promotion-service"
import { emailProvider } from "@/lib/email"
import { paymentProvider } from "@/lib/payments"

type CartItemRow = Awaited<ReturnType<typeof checkoutLines>>["items"][number]

type PricedLine = {
  productId: string
  variantId: string
  productName: string
  sku: string
  variantLabel: string
  imageUrl: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

/** Harga dan stok selalu dihitung ulang dari katalog; input harga dari client diabaikan. */
function priceLines(items: CartItemRow[]): PricedLine[] {
  return items.map((item) => {
    const variant = item.variant
    if (!variant.isActive || variant.product.status !== "ACTIVE") {
      throw new DomainError("VARIANT_INACTIVE", `${variant.product.name} sudah tidak tersedia.`)
    }
    const stock = variant.inventory ? availableStock(variant.inventory) : 0
    if (stock < item.quantity) {
      throw new DomainError("INSUFFICIENT_STOCK", `${variant.product.name} (${variantLabel(variant.colorName, variant.size)}) hanya tersisa ${stock}.`)
    }
    const unitPrice = variant.priceOverride ?? variant.product.basePrice
    return {
      productId: variant.productId,
      variantId: variant.id,
      productName: variant.product.name,
      sku: variant.sku,
      variantLabel: variantLabel(variant.colorName, variant.size),
      imageUrl: variant.product.images[0]?.url ?? "/images/products/01.jpg",
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    }
  })
}

export async function quoteCheckout(input: { shippingMethod: ShippingMethod; promoCode?: string | null; email?: string | null }) {
  const { items } = await checkoutLines()
  const lines = priceLines(items)
  const promotion = input.promoCode ? await findPromotionForQuote(input.promoCode, input.email ?? null) : null
  const quote = calculateQuote({
    lines,
    shippingMethod: input.shippingMethod,
    promotion: promotion?.rule ?? null,
    customerRedemptions: promotion?.customerRedemptions ?? 0,
  })
  return { ...quote, lines }
}

type RawClient = { $queryRaw: (typeof prisma)["$queryRaw"] }

/** Nomor pesanan memakai sequence PostgreSQL agar tetap unik saat request bersamaan. */
async function nextOrderNumber(tx: RawClient) {
  const [row] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq')`
  return `NW-${new Date().getFullYear()}-${String(Number(row.nextval)).padStart(5, "0")}`
}

export type CreateOrderResult = { orderNumber: string; grandTotal: number; status: OrderStatus; reused: boolean }

export async function createOrder(input: CheckoutInput, idempotencyKey: string, userId: string | null): Promise<CreateOrderResult> {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey } })
  if (existing) return { orderNumber: existing.orderNumber, grandTotal: existing.grandTotal, status: existing.status, reused: true }

  const { cartId, items } = await checkoutLines()
  const lines = priceLines(items)
  const promotion = input.promoCode ? await findPromotionForQuote(input.promoCode, input.email) : null
  const quote = calculateQuote({
    lines,
    shippingMethod: input.shippingMethod as ShippingMethod,
    promotion: promotion?.rule ?? null,
    customerRedemptions: promotion?.customerRedemptions ?? 0,
  })
  if (input.promoCode && promotion && !quote.promoApplied) {
    throw new DomainError("PROMO_NOT_APPLICABLE", quote.promoMessage ?? "Kode promo tidak dapat dipakai.")
  }

  const payment = await paymentProvider.createPayment({
    orderNumber: "pending",
    amount: quote.grandTotal,
    currency: "IDR",
    method: input.paymentMethod,
    idempotencyKey: `${idempotencyKey}:payment`,
  })

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx)
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        email: input.email,
        phone: input.phone,
        status: "PENDING_PAYMENT",
        fulfillmentStatus: "UNFULFILLED",
        subtotal: quote.subtotal,
        discountTotal: quote.discountTotal,
        shippingTotal: quote.shippingTotal,
        grandTotal: quote.grandTotal,
        promoCodeSnapshot: quote.promoApplied ? quote.promoCode : null,
        shippingAddress: {
          recipientName: input.recipientName,
          phone: input.phone,
          line1: input.line1,
          line2: input.line2 || null,
          district: input.district,
          city: input.city,
          province: input.province,
          postalCode: input.postalCode,
          country: "ID",
        },
        shippingMethod: input.shippingMethod,
        notes: input.notes || null,
        idempotencyKey,
        items: { create: lines },
        payments: {
          create: {
            provider: process.env.PAYMENT_PROVIDER ?? "mock",
            providerReference: payment.reference,
            method: input.paymentMethod,
            status: "PENDING",
            amount: quote.grandTotal,
            idempotencyKey: `${idempotencyKey}:payment`,
            rawResponse: payment.sanitizedResponse as Prisma.InputJsonValue,
          },
        },
      },
    })

    if (promotion && quote.promoApplied) {
      await tx.promotionRedemption.create({
        data: {
          promotionId: promotion.id,
          orderId: created.id,
          userId,
          email: input.email,
          discountAmount: quote.discountTotal + (shippingBaseFor(input.shippingMethod as ShippingMethod) - quote.shippingTotal),
        },
      })
      await tx.promotion.update({ where: { id: promotion.id }, data: { usageCount: { increment: 1 } } })
    }

    await tx.cart.update({ where: { id: cartId }, data: { status: "CONVERTED" } })
    return created
  })

  await emailProvider.sendOrderUpdate({ to: input.email, orderNumber: order.orderNumber, status: "PENDING_PAYMENT" })
  return { orderNumber: order.orderNumber, grandTotal: order.grandTotal, status: order.status, reused: false }
}

export type PaymentConfirmation = { orderNumber: string; orderStatus: OrderStatus; paymentStatus: "PAID" | "FAILED"; alreadyProcessed: boolean }

/**
 * Konfirmasi payment mock. Stok hanya berkurang satu kali walau request diulang:
 * idempotency dijaga oleh status payment dan optimistic version pada Inventory.
 */
export async function confirmMockPayment(orderNumber: string, outcome: "PAID" | "FAILED"): Promise<PaymentConfirmation> {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } } })
  if (!order) throw new DomainError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan.")
  const last = order.payments[0]
  if (!last) throw new DomainError("PAYMENT_NOT_FOUND", "Data pembayaran tidak ditemukan.")
  if (last.status === "PAID" || order.status !== "PENDING_PAYMENT") {
    return { orderNumber: order.orderNumber, orderStatus: order.status, paymentStatus: last.status === "PAID" ? "PAID" : "FAILED", alreadyProcessed: true }
  }

  // Percobaan ulang setelah gagal memakai attempt baru agar audit pembayaran tetap utuh.
  const payment =
    last.status === "PENDING"
      ? last
      : await prisma.payment.create({
          data: {
            orderId: order.id,
            provider: last.provider,
            method: last.method,
            status: "PENDING",
            amount: order.grandTotal,
            idempotencyKey: `${last.idempotencyKey}:retry:${crypto.randomUUID().slice(0, 8)}`,
            providerReference: `MOCK-${crypto.randomUUID()}`,
          },
        })

  const providerResult = await paymentProvider.confirm(payment.providerReference ?? payment.id, outcome)

  if (outcome === "FAILED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "Pembayaran demo ditolak.", rawResponse: providerResult.sanitizedResponse as Prisma.InputJsonValue },
    })
    await emailProvider.sendOrderUpdate({ to: order.email, orderNumber: order.orderNumber, status: "PAYMENT_FAILED" })
    return { orderNumber: order.orderNumber, orderStatus: order.status, paymentStatus: "FAILED", alreadyProcessed: false }
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date(), rawResponse: providerResult.sanitizedResponse as Prisma.InputJsonValue } })
    if (claimed.count !== 1) throw new DomainError("ORDER_ALREADY_PAID", "Pembayaran sudah diproses.")

    for (const item of order.items) {
      const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } })
      if (!inventory || availableStock(inventory) < item.quantity) {
        throw new DomainError("INSUFFICIENT_STOCK", `Stok ${item.productName} tidak lagi mencukupi.`)
      }
      const decremented = await tx.inventory.updateMany({
        where: { variantId: item.variantId, version: inventory.version, onHand: { gte: item.quantity } },
        data: { onHand: { decrement: item.quantity }, version: { increment: 1 } },
      })
      if (decremented.count !== 1) throw new DomainError("INSUFFICIENT_STOCK", `Stok ${item.productName} berubah saat pembayaran diproses.`)
      await tx.inventoryMovement.create({
        data: { variantId: item.variantId, orderId: order.id, type: "SALE", quantity: -item.quantity, reason: `Penjualan ${order.orderNumber}` },
      })
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "PAID", fulfillmentStatus: "PROCESSING" } })
  })

  await emailProvider.sendOrderUpdate({ to: order.email, orderNumber: order.orderNumber, status: "PAID" })
  return { orderNumber: order.orderNumber, orderStatus: "PAID", paymentStatus: "PAID", alreadyProcessed: false }
}

const orderDetailInclude = { items: true, payments: { orderBy: { createdAt: "desc" as const } }, shipment: true }

export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({ where: { orderNumber }, include: orderDetailInclude })
}

/** Tracking publik: nomor pesanan saja tidak cukup, email harus cocok. */
export async function trackOrder(orderNumber: string, email: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true, shipment: true } })
  if (!order || order.email.toLowerCase() !== email.toLowerCase()) return null
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt,
    shippingMethod: order.shippingMethod,
    carrier: order.shipment?.carrier ?? SHIPPING_METHODS[(order.shippingMethod as ShippingMethod) ?? "REGULER"].carrier,
    trackingNumber: order.shipment?.trackingNumber ?? null,
    grandTotal: order.grandTotal,
    items: order.items.map((item) => ({ productName: item.productName, variantLabel: item.variantLabel, quantity: item.quantity, imageUrl: item.imageUrl })),
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new DomainError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan.")
  if (order.status !== status && !canTransitionOrder(order.status, status)) {
    throw new DomainError("INVALID_TRANSITION", `Status ${order.status} tidak dapat berpindah ke ${status}.`)
  }
  const fulfillmentStatus = FULFILLMENT_FOR_STATUS[status]
  const method = (order.shippingMethod as ShippingMethod) ?? "REGULER"

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status, ...(fulfillmentStatus ? { fulfillmentStatus } : {}) } })
    if (status === "SHIPPED") {
      await tx.shipment.upsert({
        where: { orderId },
        update: { status: "SHIPPED", shippedAt: new Date(), ...(trackingNumber ? { trackingNumber } : {}) },
        create: {
          orderId,
          carrier: SHIPPING_METHODS[method].carrier,
          service: SHIPPING_METHODS[method].service,
          status: "SHIPPED",
          shippedAt: new Date(),
          trackingNumber: trackingNumber || `NWX${Date.now().toString().slice(-9)}`,
        },
      })
    }
    if (status === "COMPLETED") {
      await tx.shipment.updateMany({ where: { orderId }, data: { status: "DELIVERED", deliveredAt: new Date() } })
    }
    if (status === "REFUNDED" || status === "CANCELLED") {
      const items = await tx.orderItem.findMany({ where: { orderId } })
      if (order.status !== "PENDING_PAYMENT") {
        for (const item of items) {
          await tx.inventory.updateMany({ where: { variantId: item.variantId }, data: { onHand: { increment: item.quantity }, version: { increment: 1 } } })
          await tx.inventoryMovement.create({
            data: { variantId: item.variantId, orderId, type: "RETURN", quantity: item.quantity, reason: `Pengembalian ${order.orderNumber}` },
          })
        }
      }
      await tx.payment.updateMany({ where: { orderId, status: "PAID" }, data: { status: "REFUNDED" } })
    }
  })

  await emailProvider.sendOrderUpdate({ to: order.email, orderNumber: order.orderNumber, status })
  return { orderNumber: order.orderNumber, status }
}
