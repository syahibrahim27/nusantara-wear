// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { availableStock } from "@/lib/commerce"
import type { CheckoutInput } from "@/lib/validation/schemas"
import { connectTestDatabase } from "./setup-db"

const cookieStore = new Map<string, string>()
let sessionUser: { id: string; email: string; role: "CUSTOMER" | "STAFF" | "ADMIN" } | null = null

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined),
    set: (name: string, value: string) => cookieStore.set(name, value),
    delete: (name: string) => cookieStore.delete(name),
  }),
}))

// Sesi dipalsukan di sumbernya agar currentUser dan requireStaff tetap memakai kode asli.
vi.mock("next-auth", () => ({
  default: () => ({}),
  getServerSession: async () => (sessionUser ? { user: sessionUser } : null),
}))

const prisma = await connectTestDatabase()
const describeDb = prisma ? describe : describe.skip

if (!prisma) {
  console.warn("[tests] DATABASE_URL tidak dapat dijangkau — integration test checkout di-skip.")
}

const checkoutInput = (overrides: Partial<CheckoutInput> = {}): CheckoutInput => ({
  email: "integrasi@nusantarawear.test",
  phone: "081234567890",
  recipientName: "Penguji Integrasi",
  line1: "Jl. Uji Coba No. 1",
  line2: "",
  district: "Kebayoran Baru",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  postalCode: "12160",
  shippingMethod: "REGULER",
  paymentMethod: "QRIS",
  promoCode: null,
  notes: "",
  ...overrides,
})

describeDb("checkout, payment, dan inventory", () => {
  const db = prisma!
  let variantId = ""
  let unitPrice = 0
  let anonymousId = ""
  const createdOrderNumbers: string[] = []

  async function seedCart(quantity: number) {
    anonymousId = `test-${crypto.randomUUID()}`
    cookieStore.set("nw_anon", anonymousId)
    const cart = await db.cart.create({
      data: { anonymousId, expiresAt: new Date(Date.now() + 86_400_000), items: { create: { variantId, quantity } } },
    })
    return cart.id
  }

  beforeAll(async () => {
    const variant = await db.productVariant.findFirstOrThrow({
      where: { isActive: true, product: { status: "ACTIVE" }, inventory: { onHand: { gte: 4 } } },
      include: { inventory: true, product: true },
    })
    variantId = variant.id
    unitPrice = variant.priceOverride ?? variant.product.basePrice
  })

  afterAll(async () => {
    if (createdOrderNumbers.length) {
      const orders = await db.order.findMany({ where: { orderNumber: { in: createdOrderNumbers } }, select: { id: true } })
      const ids = orders.map((order) => order.id)
      await db.inventoryMovement.deleteMany({ where: { orderId: { in: ids } } })
      await db.payment.deleteMany({ where: { orderId: { in: ids } } })
      await db.orderItem.deleteMany({ where: { orderId: { in: ids } } })
      await db.order.deleteMany({ where: { id: { in: ids } } })
    }
    await db.cart.deleteMany({ where: { anonymousId: { startsWith: "test-" } } })
    await db.$disconnect()
  })

  it("menghitung harga dari katalog, bukan dari input client", async () => {
    const { createOrder } = await import("@/server/services/order-service")
    await seedCart(2)

    const order = await createOrder(checkoutInput(), `it-price-${crypto.randomUUID()}`, null)
    createdOrderNumbers.push(order.orderNumber)

    const stored = await db.order.findUniqueOrThrow({ where: { orderNumber: order.orderNumber }, include: { items: true } })
    expect(stored.subtotal).toBe(unitPrice * 2)
    expect(stored.items[0].unitPrice).toBe(unitPrice)
    expect(stored.grandTotal).toBe(stored.subtotal + stored.shippingTotal)
  })

  it("menolak checkout ketika stok tidak mencukupi", async () => {
    const { createOrder } = await import("@/server/services/order-service")
    const inventory = await db.inventory.findUniqueOrThrow({ where: { variantId } })
    await seedCart(Math.min(8, availableStock(inventory) + 8))

    await expect(createOrder(checkoutInput(), `it-stock-${crypto.randomUUID()}`, null)).rejects.toThrowError(/tersisa/i)
  })

  it("membuat order secara idempoten untuk idempotency key yang sama", async () => {
    const { createOrder } = await import("@/server/services/order-service")
    await seedCart(1)
    const key = `it-idem-${crypto.randomUUID()}`

    const first = await createOrder(checkoutInput(), key, null)
    const second = await createOrder(checkoutInput(), key, null)
    createdOrderNumbers.push(first.orderNumber)

    expect(second.orderNumber).toBe(first.orderNumber)
    expect(second.reused).toBe(true)
    expect(await db.order.count({ where: { orderNumber: first.orderNumber } })).toBe(1)
  })

  it("mengurangi stok tepat satu kali walau konfirmasi payment diulang", async () => {
    const { confirmMockPayment, createOrder } = await import("@/server/services/order-service")
    await seedCart(1)

    const before = await db.inventory.findUniqueOrThrow({ where: { variantId } })
    const order = await createOrder(checkoutInput(), `it-pay-${crypto.randomUUID()}`, null)
    createdOrderNumbers.push(order.orderNumber)

    const first = await confirmMockPayment(order.orderNumber, "PAID")
    const second = await confirmMockPayment(order.orderNumber, "PAID")

    expect(first.paymentStatus).toBe("PAID")
    expect(second.alreadyProcessed).toBe(true)

    const after = await db.inventory.findUniqueOrThrow({ where: { variantId } })
    expect(after.onHand).toBe(before.onHand - 1)
    expect(after.version).toBe(before.version + 1)

    const stored = await db.order.findUniqueOrThrow({ where: { orderNumber: order.orderNumber }, include: { movements: true } })
    expect(stored.status).toBe("PAID")
    expect(stored.movements).toHaveLength(1)
    expect(stored.movements[0].quantity).toBe(-1)

    // Kembalikan stok agar test lain tetap deterministik.
    await db.inventory.update({ where: { variantId }, data: { onHand: before.onHand } })
  })

  it("hanya membuka tracking bila nomor pesanan dan email cocok", async () => {
    const { createOrder, trackOrder } = await import("@/server/services/order-service")
    await seedCart(1)
    const order = await createOrder(checkoutInput(), `it-track-${crypto.randomUUID()}`, null)
    createdOrderNumbers.push(order.orderNumber)

    expect(await trackOrder(order.orderNumber, "orang.lain@example.test")).toBeNull()
    expect(await trackOrder(order.orderNumber, "integrasi@nusantarawear.test")).not.toBeNull()
  })

  it("menolak promo yang tidak memenuhi syarat", async () => {
    const { createOrder } = await import("@/server/services/order-service")
    await db.promotion.upsert({
      where: { code: "UJIMINIMUM" },
      update: { minimumSubtotal: 99_000_000, isActive: true },
      create: {
        code: "UJIMINIMUM",
        name: "Promo uji minimum tinggi",
        type: "PERCENTAGE",
        value: 10,
        minimumSubtotal: 99_000_000,
        perCustomerLimit: 5,
        startsAt: new Date("2020-01-01"),
        endsAt: new Date("2030-01-01"),
      },
    })
    await seedCart(1)

    await expect(createOrder(checkoutInput({ promoCode: "UJIMINIMUM" }), `it-promo-${crypto.randomUUID()}`, null)).rejects.toThrowError(/Minimum belanja/i)
  })
})

describe("otorisasi admin", () => {
  it("menolak pengguna tanpa sesi dan pelanggan biasa", async () => {
    const { requireStaff } = await import("@/lib/auth/session")

    sessionUser = null
    await expect(requireStaff()).rejects.toThrowError(/masuk/i)

    sessionUser = { id: "user-customer", email: "demo@nusantarawear.test", role: "CUSTOMER" }
    await expect(requireStaff()).rejects.toThrowError(/admin/i)

    sessionUser = { id: "user-staff", email: "staff@nusantarawear.test", role: "STAFF" }
    await expect(requireStaff()).resolves.toMatchObject({ role: "STAFF" })

    sessionUser = null
  })
})
