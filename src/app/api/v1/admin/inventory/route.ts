import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { inventoryAdjustmentSchema } from "@/lib/validation/schemas"
import { requireStaff } from "@/lib/auth/session"
import { adjustInventory, listInventory, listMovements } from "@/server/services/inventory-service"
import { invalidateCatalog, recordAudit } from "@/server/services/admin-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    const variantId = request.nextUrl.searchParams.get("variantId") ?? undefined
    const [inventory, movements] = await Promise.all([listInventory(request.nextUrl.searchParams.get("q") ?? undefined), listMovements(variantId)])
    return apiJson(request, { inventory, movements })
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}

export async function POST(request: NextRequest) {
  const parsed = inventoryAdjustmentSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Penyesuaian stok tidak valid.")

  try {
    const actor = await requireStaff()
    const result = await adjustInventory({ ...parsed.data, actorId: actor.id })
    await recordAudit(actor, "inventory.adjust", "Inventory", parsed.data.variantId, `${parsed.data.type} ${parsed.data.quantity}: ${parsed.data.reason}`)
    invalidateCatalog()
    return apiJson(request, result, 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
