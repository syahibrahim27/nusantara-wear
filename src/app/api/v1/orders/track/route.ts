import type { NextRequest } from "next/server"

import { apiError, apiJson, domainErrorResponse, enforceRateLimit, validationError } from "@/lib/http"
import { trackOrderSchema } from "@/lib/validation/schemas"
import { trackOrder } from "@/server/services/order-service"

export const dynamic = "force-dynamic"

/** Tracking dibatasi rate-limit dan hanya membuka data bila email cocok dengan pesanan. */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, "track", 10, 60_000)
  if (limited) return limited

  const parsed = trackOrderSchema.safeParse({
    orderNumber: request.nextUrl.searchParams.get("orderNumber") ?? "",
    email: request.nextUrl.searchParams.get("email") ?? "",
  })
  if (!parsed.success) return validationError(request, parsed.error, "Nomor pesanan dan email wajib diisi.")

  try {
    const order = await trackOrder(parsed.data.orderNumber, parsed.data.email)
    return order
      ? apiJson(request, order)
      : apiError(request, 404, "ORDER_NOT_FOUND", "Pesanan tidak ditemukan untuk kombinasi nomor dan email tersebut.")
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
