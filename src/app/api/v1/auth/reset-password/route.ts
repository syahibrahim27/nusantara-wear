import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { resetPasswordSchema } from "@/lib/validation/schemas"
import { resetPassword } from "@/server/services/auth-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "reset-password", 8, 60_000)
  if (limited) return limited

  const parsed = resetPasswordSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Token atau password baru tidak valid.")

  try {
    await resetPassword(parsed.data.token, parsed.data.password)
    return apiJson(request, { reset: true })
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
