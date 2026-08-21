import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { orderStatusSchema } from "@/lib/validation/schemas"
import { requireStaff } from "@/lib/auth/session"
import { recordAudit } from "@/server/services/admin-service"
import { updateOrderStatus } from "@/server/services/order-service"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = (await readJson(request)) as Record<string, unknown> | null
  const parsed = orderStatusSchema.safeParse({ ...(body ?? {}), orderId: id })
  if (!parsed.success) return validationError(request, parsed.error, "Status pesanan tidak valid.")

  try {
    const actor = await requireStaff()
    const result = await updateOrderStatus(id, parsed.data.status, parsed.data.trackingNumber || undefined)
    await recordAudit(actor, "order.status", "Order", id, `Status menjadi ${parsed.data.status}`)
    return apiJson(request, result)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
