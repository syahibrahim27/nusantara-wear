import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { registerSchema } from "@/lib/validation/schemas"
import { registerCustomer } from "@/server/services/auth-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "register", 8, 60_000)
  if (limited) return limited

  const parsed = registerSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Periksa kembali data pendaftaran.")

  try {
    return apiJson(request, await registerCustomer(parsed.data), 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
