import "server-only"

import { cookies } from "next/headers"

import { prisma } from "@/lib/db/prisma"
import { DomainError } from "@/lib/http"
import { availableStock, calculateQuote, clampQuantity, mergeCartLines, variantLabel } from "@/lib/commerce"
import type { CartLine, ShippingMethod } from "@/lib/commerce"
import { currentUser } from "@/lib/auth/session"
import { findPromotionForQuote } from "@/server/services/promotion-service"
import { emptyCartView } from "@/features/cart/types"
import type { CartView } from "@/features/cart/types"

export const ANONYMOUS_COOKIE = "nw_anon"
const CART_TTL_DAYS = 30

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * CART_TTL_DAYS,
}

const expiry = () => new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1000)

const cartInclude = {
  items: {
    include: { variant: { include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } }, inventory: true } } },
    orderBy: { createdAt: "asc" },
  },
} as const

export const emptyCart = emptyCartView

/** Membaca cart aktif tanpa membuat baris baru; aman dipakai Server Component. */
export async function loadCart(): Promise<CartView> {
  const cart = await findActiveCart()
  return cart ? toCartView(cart, await readPromoCookie()) : emptyCart()
}

async function findActiveCart() {
  const user = await currentUser()
  if (user) {
    const owned = await prisma.cart.findFirst({ where: { userId: user.id, status: "ACTIVE" }, include: cartInclude })
    if (owned) return owned
  }
  const anonymousId = (await cookies()).get(ANONYMOUS_COOKIE)?.value
  if (!anonymousId) return null
  return prisma.cart.findFirst({ where: { anonymousId, status: "ACTIVE", userId: null }, include: cartInclude })
}

/** Hanya boleh dipanggil dari Route Handler atau Server Action karena menulis cookie. */
async function ensureCart() {
  const user = await currentUser()
  const jar = await cookies()
  if (user) {
    const owned = await prisma.cart.findFirst({ where: { userId: user.id, status: "ACTIVE" }, include: cartInclude })
    if (owned) return owned
    return prisma.cart.create({ data: { userId: user.id, expiresAt: expiry() }, include: cartInclude })
  }
  let anonymousId = jar.get(ANONYMOUS_COOKIE)?.value
  if (!anonymousId) {
    anonymousId = crypto.randomUUID()
    jar.set(ANONYMOUS_COOKIE, anonymousId, cookieOptions)
  }
  const existing = await prisma.cart.findFirst({ where: { anonymousId, status: "ACTIVE", userId: null }, include: cartInclude })
  return existing ?? prisma.cart.create({ data: { anonymousId, expiresAt: expiry() }, include: cartInclude })
}

type CartRow = Awaited<ReturnType<typeof ensureCart>>

const PROMO_COOKIE = "nw_promo"
export async function readPromoCookie() {
  return (await cookies()).get(PROMO_COOKIE)?.value ?? null
}
export async function writePromoCookie(code: string | null) {
  const jar = await cookies()
  if (code) jar.set(PROMO_COOKIE, code.toUpperCase(), { ...cookieOptions, httpOnly: false, maxAge: 60 * 60 * 24 })
  else jar.delete(PROMO_COOKIE)
}

function lineViews(cart: CartRow) {
  return cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    productId: item.variant.productId,
    slug: item.variant.product.slug,
    name: item.variant.product.name,
    imageUrl: item.variant.product.images[0]?.url ?? "/images/products/01.jpg",
    colorName: item.variant.colorName,
    size: item.variant.size,
    sku: item.variant.sku,
    unitPrice: item.variant.priceOverride ?? item.variant.product.basePrice,
    quantity: item.quantity,
    lineTotal: (item.variant.priceOverride ?? item.variant.product.basePrice) * item.quantity,
    available: item.variant.inventory ? availableStock(item.variant.inventory) : 0,
    savedForLater: item.savedForLater,
  }))
}

export async function toCartView(cart: CartRow, promoCode: string | null, shippingMethod: ShippingMethod = "REGULER"): Promise<CartView> {
  const all = lineViews(cart)
  const items = all.filter((line) => !line.savedForLater)
  const savedItems = all.filter((line) => line.savedForLater)
  const user = await currentUser()
  const promotion = promoCode ? await findPromotionForQuote(promoCode, user?.email ?? null) : null
  const quote = calculateQuote({
    lines: items.map((line) => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
    shippingMethod,
    promotion: promotion?.rule ?? null,
    customerRedemptions: promotion?.customerRedemptions ?? 0,
  })
  return {
    id: cart.id,
    items,
    savedItems,
    itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: quote.subtotal,
    discountTotal: quote.discountTotal,
    shippingTotal: quote.shippingTotal,
    grandTotal: quote.grandTotal,
    promoCode: quote.promoCode,
    promoApplied: quote.promoApplied,
    promoMessage: quote.promoMessage,
    issues: items.filter((line) => line.quantity > line.available).map((line) => `${line.name} (${variantLabel(line.colorName, line.size)}) hanya tersisa ${line.available}.`),
  }
}

export async function addToCart(variantId: string, quantity: number): Promise<CartView> {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true, product: true } })
  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") throw new DomainError("VARIANT_NOT_FOUND", "Variant tidak tersedia.")
  const cart = await ensureCart()
  const existing = cart.items.find((item) => item.variantId === variantId)
  const requested = clampQuantity((existing?.quantity ?? 0) + quantity)
  const stock = variant.inventory ? availableStock(variant.inventory) : 0
  if (stock < requested) throw new DomainError("INSUFFICIENT_STOCK", stock === 0 ? "Kombinasi ini sedang habis." : `Stok tersisa ${stock} potong.`)
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: requested, savedForLater: false },
    create: { cartId: cart.id, variantId, quantity: requested },
  })
  return reload(cart.id)
}

export async function updateCartItem(itemId: string, patch: { quantity?: number; savedForLater?: boolean }): Promise<CartView> {
  const cart = await ensureCart()
  const item = cart.items.find((candidate) => candidate.id === itemId)
  if (!item) throw new DomainError("NOT_FOUND", "Item tidak ditemukan di tas Anda.")
  if (patch.quantity !== undefined && patch.quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } })
    return reload(cart.id)
  }
  if (patch.quantity !== undefined) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId }, include: { inventory: true } })
    const stock = variant?.inventory ? availableStock(variant.inventory) : 0
    if (stock < patch.quantity) throw new DomainError("INSUFFICIENT_STOCK", `Stok tersisa ${stock} potong.`)
  }
  await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      ...(patch.quantity !== undefined ? { quantity: clampQuantity(patch.quantity) } : {}),
      ...(patch.savedForLater !== undefined ? { savedForLater: patch.savedForLater } : {}),
    },
  })
  return reload(cart.id)
}

export async function removeCartItem(itemId: string): Promise<CartView> {
  const cart = await ensureCart()
  if (!cart.items.some((item) => item.id === itemId)) throw new DomainError("NOT_FOUND", "Item tidak ditemukan di tas Anda.")
  await prisma.cartItem.delete({ where: { id: itemId } })
  return reload(cart.id)
}

/** Menggabungkan cart tamu ke cart akun setelah login, tanpa item duplikat. */
export async function mergeGuestCart(): Promise<CartView> {
  const user = await currentUser()
  if (!user) throw new DomainError("UNAUTHORIZED", "Anda harus masuk terlebih dahulu.")
  const jar = await cookies()
  const anonymousId = jar.get(ANONYMOUS_COOKIE)?.value
  const guestCart = anonymousId
    ? await prisma.cart.findFirst({ where: { anonymousId, status: "ACTIVE", userId: null }, include: cartInclude })
    : null

  const userCart = await ensureCart()
  if (!guestCart || guestCart.id === userCart.id) return toCartView(userCart, await readPromoCookie())

  const serverLines: CartLine[] = userCart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
  const guestLines: CartLine[] = guestCart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
  const merged = mergeCartLines(serverLines, guestLines)
  const savedVariants = new Set([...userCart.items, ...guestCart.items].filter((item) => item.savedForLater).map((item) => item.variantId))

  await prisma.$transaction([
    ...merged.map((line) =>
      prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: line.variantId } },
        update: { quantity: line.quantity },
        create: { cartId: userCart.id, variantId: line.variantId, quantity: line.quantity, savedForLater: savedVariants.has(line.variantId) },
      }),
    ),
    prisma.cart.update({ where: { id: guestCart.id }, data: { status: "CONVERTED" } }),
  ])
  jar.delete(ANONYMOUS_COOKIE)
  return reload(userCart.id)
}

export async function clearCart(cartId: string) {
  await prisma.cart.update({ where: { id: cartId }, data: { status: "CONVERTED" } })
}

async function reload(cartId: string) {
  const cart = await prisma.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude })
  return toCartView(cart, await readPromoCookie())
}

/** Baris cart aktif untuk checkout, sudah tervalidasi terhadap katalog dan stok. */
export async function checkoutLines() {
  const cart = await findActiveCart()
  if (!cart) throw new DomainError("CART_EMPTY", "Tas Anda masih kosong.")
  const items = cart.items.filter((item) => !item.savedForLater)
  if (!items.length) throw new DomainError("CART_EMPTY", "Tas Anda masih kosong.")
  return { cartId: cart.id, items }
}
