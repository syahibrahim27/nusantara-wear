import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { promotionAdminSchema } from "@/lib/validation/schemas"
import { requireStaff } from "@/lib/auth/session"
import { createPromotion } from "@/server/services/admin-service"
import { listPromotions } from "@/server/services/promotion-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    return apiJson(request, await listPromotions())
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function POST(request: NextRequest) {
  const parsed = promotionAdminSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Data promo belum lengkap.")

  try {
    const actor = await requireStaff()
    return apiJson(request, await createPromotion(actor, parsed.data), 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
