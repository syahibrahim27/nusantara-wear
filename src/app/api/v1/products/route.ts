import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, validationError } from "@/lib/http"
import { catalogQuerySchema } from "@/lib/validation/schemas"
import { searchCatalog } from "@/server/services/catalog-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, "products", 120, 60_000)
  if (limited) return limited

  const parsed = catalogQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return validationError(request, parsed.error, "Parameter pencarian tidak valid.")

  try {
    const result = await searchCatalog(parsed.data)
    return apiJson(request, {
      data: result.products,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        pageCount: result.pageCount,
        total: result.total,
        hasNext: result.page < result.pageCount,
        nextCursor: result.page < result.pageCount ? String(result.page + 1) : null,
      },
    })
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
