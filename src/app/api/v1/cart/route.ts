import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { cartItemInputSchema } from "@/lib/validation/schemas"
import { addToCart, loadCart } from "@/server/services/cart-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    return apiJson(request, await loadCart())
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "cart-write", 60, 60_000)
  if (limited) return limited

  const parsed = cartItemInputSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Item yang ditambahkan tidak valid.")

  try {
    return apiJson(request, await addToCart(parsed.data.variantId, parsed.data.quantity), 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
