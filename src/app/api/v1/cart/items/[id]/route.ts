import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { cartItemPatchSchema } from "@/lib/validation/schemas"
import { removeCartItem, updateCartItem } from "@/server/services/cart-service"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const parsed = cartItemPatchSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Perubahan item tidak valid.")

  try {
    return apiJson(request, await updateCartItem(id, parsed.data))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    return apiJson(request, await removeCartItem(id))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
