import type { NextRequest } from "next/server"

import { apiError, apiJson, domainErrorResponse } from "@/lib/http"
import { getProductDetail } from "@/server/services/catalog-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  try {
    const product = await getProductDetail(slug)
    return product ? apiJson(request, product) : apiError(request, 404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan.")
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
