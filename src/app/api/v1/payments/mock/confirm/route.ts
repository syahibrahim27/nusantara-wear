import type { NextRequest } from "next/server"

import { apiError, apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { paymentConfirmSchema } from "@/lib/validation/schemas"
import { confirmMockPayment } from "@/server/services/order-service"

export const dynamic = "force-dynamic"

/** Mengubah payment, order, dan stok secara atomik; aman terhadap request ganda. */
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "payment", 20, 60_000)
  if (limited) return limited

  if (!request.headers.get("idempotency-key")) {
    return apiError(request, 400, "IDEMPOTENCY_KEY_REQUIRED", "Header idempotency-key wajib diisi.")
  }

  const parsed = paymentConfirmSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Data konfirmasi pembayaran tidak valid.")

  try {
    return apiJson(request, await confirmMockPayment(parsed.data.orderNumber, parsed.data.outcome))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
