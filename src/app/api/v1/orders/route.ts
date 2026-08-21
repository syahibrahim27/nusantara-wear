import type { NextRequest } from "next/server"

import { apiError, apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { checkoutSchema } from "@/lib/validation/schemas"
import { currentUser } from "@/lib/auth/session"
import { createOrder } from "@/server/services/order-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "orders", 12, 60_000)
  if (limited) return limited

  const idempotencyKey = request.headers.get("idempotency-key")
  if (!idempotencyKey) return apiError(request, 400, "IDEMPOTENCY_KEY_REQUIRED", "Header idempotency-key wajib diisi.")

  const parsed = checkoutSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Data checkout belum lengkap.")

  try {
    const user = await currentUser()
    const order = await createOrder(parsed.data, idempotencyKey, user?.id ?? null)
    return apiJson(request, order, order.reused ? 200 : 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
