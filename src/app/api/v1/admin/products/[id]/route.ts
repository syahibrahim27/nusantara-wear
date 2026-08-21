import type { NextRequest } from "next/server"

import { apiError, apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { productAdminSchema } from "@/lib/validation/schemas"
import { requireStaff } from "@/lib/auth/session"
import { archiveProduct, getAdminProduct, updateProduct } from "@/server/services/admin-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    await requireStaff()
    const product = await getAdminProduct(id)
    return product ? apiJson(request, product) : apiError(request, 404, "NOT_FOUND", "Produk tidak ditemukan.")
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const parsed = productAdminSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Data produk belum lengkap.")

  try {
    const actor = await requireStaff()
    return apiJson(request, await updateProduct(actor, id, parsed.data))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const actor = await requireStaff()
    return apiJson(request, await archiveProduct(actor, id))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
