import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { productAdminSchema } from "@/lib/validation/schemas"
import { requireStaff } from "@/lib/auth/session"
import { createProduct, listAdminProducts } from "@/server/services/admin-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    return apiJson(request, await listAdminProducts(request.nextUrl.searchParams.get("q") ?? undefined))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function POST(request: NextRequest) {
  const parsed = productAdminSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Data produk belum lengkap.")

  try {
    const actor = await requireStaff()
    return apiJson(request, await createProduct(actor, parsed.data), 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
