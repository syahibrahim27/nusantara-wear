import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { z } from "zod"
import { requireCustomer } from "@/lib/auth/session"
import { listWishlist, toggleWishlist } from "@/server/services/account-service"

export const dynamic = "force-dynamic"

const schema = z.object({ productId: z.string().min(1) })

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomer()
    return apiJson(request, await listWishlist(user.id))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Produk tidak valid.")

  try {
    const user = await requireCustomer()
    return apiJson(request, await toggleWishlist(user.id, parsed.data.productId))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
