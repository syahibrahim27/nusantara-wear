import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, enforceRateLimit, readJson, validationError } from "@/lib/http"
import { forgotPasswordSchema } from "@/lib/validation/schemas"

export const dynamic = "force-dynamic"

/** Pendaftaran newsletter demo: hanya mencatat domain penerima, tidak menyimpan alamat. */
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "newsletter", 5, 60_000)
  if (limited) return limited

  const parsed = forgotPasswordSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Masukkan email yang valid.")

  try {
    console.info("[newsletter:subscribe]", { recipientDomain: parsed.data.email.split("@")[1] })
    return apiJson(request, { subscribed: true }, 201)
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
