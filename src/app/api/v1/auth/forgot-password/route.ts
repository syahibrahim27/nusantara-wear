import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { forgotPasswordSchema } from "@/lib/validation/schemas"
import { requestPasswordReset } from "@/server/services/auth-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "forgot-password", 5, 60_000)
  if (limited) return limited

  const parsed = forgotPasswordSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Masukkan email yang valid.")

  try {
    await requestPasswordReset(parsed.data.email)
    return apiJson(request, { sent: true })
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
