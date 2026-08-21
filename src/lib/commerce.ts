export type Money = number

export const MAX_LINE_QUANTITY = 8
export const CURRENCY = "IDR"

export const SHIPPING_METHODS = {
  REGULER: { label: "Reguler", description: "2–5 hari kerja", price: 24_000, carrier: "Nusantara Kirim", service: "Reguler" },
  EXPRESS: { label: "Express", description: "1–2 hari kerja", price: 45_000, carrier: "Nusantara Kirim", service: "Express" },
  STUDIO: { label: "Ambil di Studio", description: "Kebayoran Baru, Jakarta Selatan", price: 0, carrier: "Studio Nusantara", service: "Pickup" },
} as const

export type ShippingMethod = keyof typeof SHIPPING_METHODS
export const SHIPPING_METHOD_VALUES = Object.keys(SHIPPING_METHODS) as ShippingMethod[]
export const isShippingMethod = (value: string): value is ShippingMethod => value in SHIPPING_METHODS
export const shippingBaseFor = (method: ShippingMethod) => SHIPPING_METHODS[method].price

export const PAYMENT_METHODS = {
  VA: { label: "Virtual Account", description: "Nomor VA simulasi, tanpa tagihan nyata." },
  QRIS: { label: "QRIS", description: "Kode QR demo yang langsung terkonfirmasi." },
  CARD: { label: "Kartu demo", description: "Gunakan 4242 4242 4242 4242." },
} as const
export type PaymentMethod = keyof typeof PAYMENT_METHODS

export type PromotionType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"

export type PromotionRule = {
  code: string
  type: PromotionType
  value: number
  minimumSubtotal: number
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  perCustomerLimit: number
  startsAt: Date
  endsAt: Date
  isActive: boolean
}

export type PromotionContext = { subtotal: Money; shippingBase: Money; now?: Date; customerRedemptions?: number }
export type PromotionResult = { applied: boolean; code: string; discount: Money; shippingDiscount: Money; message: string }

/** Semua rule promo dievaluasi di sini agar server dan test memakai kebenaran yang sama. */
export function evaluatePromotion(promotion: PromotionRule | null | undefined, context: PromotionContext): PromotionResult {
  const { subtotal, shippingBase, now = new Date(), customerRedemptions = 0 } = context
  const rejected = (message: string) => ({ applied: false, code: promotion?.code ?? "", discount: 0, shippingDiscount: 0, message })
  if (!promotion) return rejected("Kode promo tidak ditemukan.")
  if (!promotion.isActive) return rejected("Kode promo sedang tidak aktif.")
  if (now < promotion.startsAt) return rejected("Kode promo belum dapat digunakan.")
  if (now > promotion.endsAt) return rejected("Kode promo sudah kedaluwarsa.")
  if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) return rejected("Kuota kode promo sudah habis.")
  if (customerRedemptions >= promotion.perCustomerLimit) return rejected("Kode promo ini sudah pernah Anda pakai.")
  if (subtotal < promotion.minimumSubtotal) return rejected(`Minimum belanja ${formatRupiah(promotion.minimumSubtotal)} untuk kode ini.`)

  if (promotion.type === "FREE_SHIPPING") {
    return { applied: true, code: promotion.code, discount: 0, shippingDiscount: shippingBase, message: "Ongkir ditanggung Nusantara Wear." }
  }
  const raw = promotion.type === "PERCENTAGE" ? Math.round((subtotal * promotion.value) / 100) : promotion.value
  const capped = promotion.maxDiscount === null ? raw : Math.min(raw, promotion.maxDiscount)
  const discount = Math.max(0, Math.min(capped, subtotal))
  return {
    applied: discount > 0,
    code: promotion.code,
    discount,
    shippingDiscount: 0,
    message: discount > 0 ? `Diskon ${formatRupiah(discount)} diterapkan.` : "Kode promo tidak memberi potongan untuk tas ini.",
  }
}

export type QuoteLine = { unitPrice: Money; quantity: number }
export type Quote = {
  subtotal: Money
  discountTotal: Money
  shippingTotal: Money
  grandTotal: Money
  promoCode: string | null
  promoApplied: boolean
  promoMessage: string | null
  shippingMethod: ShippingMethod
}

export function calculateQuote(input: {
  lines: QuoteLine[]
  shippingMethod?: ShippingMethod
  promotion?: PromotionRule | null
  now?: Date
  customerRedemptions?: number
}): Quote {
  const shippingMethod = input.shippingMethod ?? "REGULER"
  const subtotal = input.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const shippingBase = subtotal === 0 ? 0 : shippingBaseFor(shippingMethod)
  const promo = input.promotion
    ? evaluatePromotion(input.promotion, { subtotal, shippingBase, now: input.now, customerRedemptions: input.customerRedemptions })
    : null
  const discountTotal = promo?.applied ? promo.discount : 0
  const shippingTotal = Math.max(0, shippingBase - (promo?.applied ? promo.shippingDiscount : 0))
  return {
    subtotal,
    discountTotal,
    shippingTotal,
    grandTotal: Math.max(0, subtotal - discountTotal) + shippingTotal,
    promoCode: promo ? promo.code : null,
    promoApplied: Boolean(promo?.applied),
    promoMessage: promo ? promo.message : null,
    shippingMethod,
  }
}

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED" | "REFUNDED"
export type FulfillmentStatus = "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["COMPLETED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
}
export const canTransitionOrder = (from: OrderStatus, to: OrderStatus) => ORDER_TRANSITIONS[from].includes(to)

export const FULFILLMENT_FOR_STATUS: Partial<Record<OrderStatus, FulfillmentStatus>> = {
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  COMPLETED: "DELIVERED",
  CANCELLED: "CANCELLED",
}

export type InventoryState = { onHand: number; reserved: number }
export const availableStock = (inventory: InventoryState) => Math.max(0, inventory.onHand - inventory.reserved)
export const canFulfill = (inventory: InventoryState | null | undefined, quantity: number) => !!inventory && availableStock(inventory) >= quantity
export const isLowStock = (inventory: InventoryState | null | undefined, reorderPoint = 3) => !!inventory && availableStock(inventory) <= reorderPoint

export type CartLine = { variantId: string; quantity: number }

/** Menggabungkan cart tamu ke cart akun tanpa menduplikasi variant yang sama. */
export function mergeCartLines(server: CartLine[], guest: CartLine[]): CartLine[] {
  const merged = new Map<string, CartLine>()
  for (const line of [...server, ...guest]) {
    const current = merged.get(line.variantId)
    merged.set(line.variantId, { variantId: line.variantId, quantity: Math.min(MAX_LINE_QUANTITY, (current?.quantity ?? 0) + line.quantity) })
  }
  return [...merged.values()]
}

export const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.trunc(Number.isFinite(quantity) ? quantity : 1)))

export const formatRupiah = (value: Money) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
export const formatDateID = (value: Date | string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value))
export const variantLabel = (colorName: string, size: string) => `${colorName} / ${size}`
export const slugify = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  PAID: "Sudah dibayar",
  PROCESSING: "Sedang disiapkan",
  SHIPPED: "Dalam perjalanan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dana dikembalikan",
}

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  UNFULFILLED: "Belum diproses",
  PROCESSING: "Disiapkan",
  SHIPPED: "Dikirim",
  DELIVERED: "Diterima",
  CANCELLED: "Dibatalkan",
}
