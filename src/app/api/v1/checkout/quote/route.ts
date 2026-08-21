import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { quoteSchema } from "@/lib/validation/schemas"
import type { ShippingMethod } from "@/lib/commerce"
import { currentUser } from "@/lib/auth/session"
import { quoteCheckout } from "@/server/services/order-service"

export const dynamic = "force-dynamic"

/** Quote selalu dihitung ulang dari cart server; harga dari client tidak pernah dipercaya. */
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "quote", 30, 60_000)
  if (limited) return limited

  const parsed = quoteSchema.safeParse((await readJson(request)) ?? {})
  if (!parsed.success) return validationError(request, parsed.error, "Data quote tidak valid.")

  try {
    const user = await currentUser()
    const quote = await quoteCheckout({
      shippingMethod: parsed.data.shippingMethod as ShippingMethod,
      promoCode: parsed.data.promoCode ?? null,
      email: user?.email ?? null,
    })
    return apiJson(request, quote)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
