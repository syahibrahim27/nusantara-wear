import "server-only"

import { prisma } from "@/lib/db/prisma"
import type { PromotionRule } from "@/lib/commerce"

export type PromotionLookup = { id: string; rule: PromotionRule; customerRedemptions: number }

const toRule = (promotion: {
  code: string
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"
  value: number
  minimumSubtotal: number
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  perCustomerLimit: number
  startsAt: Date
  endsAt: Date
  isActive: boolean
}): PromotionRule => ({ ...promotion })

/** Mencari promo beserta jumlah pemakaian pelanggan agar limit per pelanggan dapat dievaluasi. */
export async function findPromotionForQuote(code: string, email: string | null): Promise<PromotionLookup | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null
  const promotion = await prisma.promotion.findUnique({ where: { code: normalized } })
  if (!promotion) return null
  const customerRedemptions = email
    ? await prisma.promotionRedemption.count({ where: { promotionId: promotion.id, email: email.toLowerCase() } })
    : 0
  return { id: promotion.id, rule: toRule(promotion), customerRedemptions }
}

export const listPromotions = () => prisma.promotion.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { redemptions: true } } } })
