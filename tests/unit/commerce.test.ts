import { describe, expect, it } from "vitest"

import {
  availableStock,
  calculateQuote,
  canFulfill,
  canTransitionOrder,
  clampQuantity,
  evaluatePromotion,
  isLowStock,
  mergeCartLines,
  shippingBaseFor,
  slugify,
} from "@/lib/commerce"
import type { PromotionRule } from "@/lib/commerce"

const promo = (overrides: Partial<PromotionRule> = {}): PromotionRule => ({
  code: "PERTAMA10",
  type: "PERCENTAGE",
  value: 10,
  minimumSubtotal: 300_000,
  maxDiscount: 150_000,
  usageLimit: 1000,
  usageCount: 0,
  perCustomerLimit: 1,
  startsAt: new Date("2026-01-01"),
  endsAt: new Date("2027-01-01"),
  isActive: true,
  ...overrides,
})

const now = new Date("2026-06-01")
const lines = [{ unitPrice: 500_000, quantity: 2 }]

describe("kalkulasi harga", () => {
  it("menjumlahkan line item dan ongkir sesuai metode", () => {
    const quote = calculateQuote({ lines, shippingMethod: "REGULER" })
    expect(quote.subtotal).toBe(1_000_000)
    expect(quote.shippingTotal).toBe(shippingBaseFor("REGULER"))
    expect(quote.grandTotal).toBe(1_000_000 + 24_000)
  })

  it("tidak membebankan ongkir pada keranjang kosong", () => {
    const quote = calculateQuote({ lines: [], shippingMethod: "EXPRESS" })
    expect(quote.shippingTotal).toBe(0)
    expect(quote.grandTotal).toBe(0)
  })

  it("menggratiskan ongkir untuk pengambilan di studio", () => {
    expect(calculateQuote({ lines, shippingMethod: "STUDIO" }).shippingTotal).toBe(0)
  })
})

describe("promo percentage", () => {
  it("memotong sesuai persentase dan dibatasi maxDiscount", () => {
    const quote = calculateQuote({ lines, shippingMethod: "REGULER", promotion: promo(), now })
    expect(quote.discountTotal).toBe(100_000)
    expect(quote.grandTotal).toBe(1_000_000 - 100_000 + 24_000)
  })

  it("tidak melewati batas maxDiscount", () => {
    const quote = calculateQuote({ lines: [{ unitPrice: 5_000_000, quantity: 1 }], promotion: promo(), now })
    expect(quote.discountTotal).toBe(150_000)
  })

  it("menolak bila subtotal di bawah minimum", () => {
    const result = evaluatePromotion(promo(), { subtotal: 100_000, shippingBase: 24_000, now })
    expect(result.applied).toBe(false)
    expect(result.message).toContain("Minimum belanja")
  })
})

describe("promo fixed amount dan free shipping", () => {
  it("memotong nominal tetap tanpa melebihi subtotal", () => {
    const rule = promo({ code: "POTONG", type: "FIXED_AMOUNT", value: 2_000_000, maxDiscount: null, minimumSubtotal: 0 })
    const result = evaluatePromotion(rule, { subtotal: 1_000_000, shippingBase: 24_000, now })
    expect(result.discount).toBe(1_000_000)
  })

  it("menghapus ongkir pada promo free shipping", () => {
    const rule = promo({ code: "BEBASONGKIR", type: "FREE_SHIPPING", value: 0, maxDiscount: null })
    const quote = calculateQuote({ lines, shippingMethod: "REGULER", promotion: rule, now })
    expect(quote.shippingTotal).toBe(0)
    expect(quote.discountTotal).toBe(0)
    expect(quote.grandTotal).toBe(1_000_000)
  })
})

describe("guard promo", () => {
  it.each([
    ["nonaktif", promo({ isActive: false }), "tidak aktif"],
    ["belum mulai", promo({ startsAt: new Date("2026-12-01") }), "belum dapat digunakan"],
    ["kedaluwarsa", promo({ endsAt: new Date("2026-02-01") }), "kedaluwarsa"],
    ["kuota habis", promo({ usageLimit: 5, usageCount: 5 }), "Kuota"],
  ])("menolak promo %s", (_label, rule, expected) => {
    const result = evaluatePromotion(rule, { subtotal: 1_000_000, shippingBase: 24_000, now })
    expect(result.applied).toBe(false)
    expect(result.message).toContain(expected)
  })

  it("menolak bila pelanggan sudah melewati limit pribadi", () => {
    const result = evaluatePromotion(promo(), { subtotal: 1_000_000, shippingBase: 24_000, now, customerRedemptions: 1 })
    expect(result.applied).toBe(false)
  })

  it("mengabaikan promo yang tidak ditemukan", () => {
    expect(evaluatePromotion(null, { subtotal: 1_000_000, shippingBase: 24_000, now }).applied).toBe(false)
  })
})

describe("ketersediaan inventory", () => {
  it("menghitung stok tersedia dari onHand dikurangi reserved", () => {
    expect(availableStock({ onHand: 10, reserved: 3 })).toBe(7)
    expect(availableStock({ onHand: 2, reserved: 5 })).toBe(0)
  })

  it("menolak pemenuhan bila stok kurang atau data hilang", () => {
    expect(canFulfill({ onHand: 5, reserved: 0 }, 5)).toBe(true)
    expect(canFulfill({ onHand: 5, reserved: 1 }, 5)).toBe(false)
    expect(canFulfill(null, 1)).toBe(false)
  })

  it("menandai stok rendah pada atau di bawah reorder point", () => {
    expect(isLowStock({ onHand: 3, reserved: 0 }, 3)).toBe(true)
    expect(isLowStock({ onHand: 4, reserved: 0 }, 3)).toBe(false)
  })
})

describe("state transition order", () => {
  it("mengizinkan alur normal", () => {
    expect(canTransitionOrder("PENDING_PAYMENT", "PAID")).toBe(true)
    expect(canTransitionOrder("PAID", "PROCESSING")).toBe(true)
    expect(canTransitionOrder("SHIPPED", "COMPLETED")).toBe(true)
  })

  it("menolak lompatan status yang tidak sah", () => {
    expect(canTransitionOrder("PENDING_PAYMENT", "SHIPPED")).toBe(false)
    expect(canTransitionOrder("CANCELLED", "PAID")).toBe(false)
    expect(canTransitionOrder("REFUNDED", "COMPLETED")).toBe(false)
  })
})

describe("cart", () => {
  it("menggabungkan cart tamu tanpa duplikasi variant", () => {
    const merged = mergeCartLines(
      [
        { variantId: "a", quantity: 1 },
        { variantId: "b", quantity: 2 },
      ],
      [
        { variantId: "a", quantity: 2 },
        { variantId: "c", quantity: 1 },
      ],
    )
    expect(merged).toHaveLength(3)
    expect(merged.find((line) => line.variantId === "a")?.quantity).toBe(3)
  })

  it("membatasi hasil merge pada kuantitas maksimum", () => {
    const merged = mergeCartLines([{ variantId: "a", quantity: 6 }], [{ variantId: "a", quantity: 6 }])
    expect(merged[0].quantity).toBe(8)
  })

  it("membatasi kuantitas pada rentang yang wajar", () => {
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(99)).toBe(8)
    expect(clampQuantity(Number.NaN)).toBe(1)
  })

  it("menghitung total line item dari harga satuan", () => {
    const quote = calculateQuote({
      lines: [
        { unitPrice: 250_000, quantity: 3 },
        { unitPrice: 100_000, quantity: 1 },
      ],
      shippingMethod: "STUDIO",
    })
    expect(quote.subtotal).toBe(850_000)
    expect(quote.grandTotal).toBe(850_000)
  })
})

describe("utilitas", () => {
  it("membuat slug yang aman untuk URL", () => {
    expect(slugify("Sora Layered Shirt")).toBe("sora-layered-shirt")
    expect(slugify("Aksesori — Tenun 2026")).toBe("aksesori-tenun-2026")
  })
})
