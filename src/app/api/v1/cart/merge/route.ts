import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse } from "@/lib/http"
import { mergeGuestCart } from "@/server/services/cart-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    return apiJson(request, await mergeGuestCart())
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
