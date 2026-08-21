import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse } from "@/lib/http"
import { requireStaff } from "@/lib/auth/session"
import { listCustomers } from "@/server/services/admin-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    return apiJson(request, await listCustomers())
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
