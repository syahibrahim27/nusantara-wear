import type { NextRequest } from "next/server"

import { apiJson, domainErrorResponse, readJson, validationError } from "@/lib/http"
import { journalAdminSchema } from "@/lib/validation/schemas"
import { requireStaff } from "@/lib/auth/session"
import { saveJournalPost } from "@/server/services/admin-service"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const parsed = journalAdminSchema.safeParse(await readJson(request))
  if (!parsed.success) return validationError(request, parsed.error, "Artikel belum lengkap.")

  try {
    const actor = await requireStaff()
    return apiJson(request, await saveJournalPost(actor, parsed.data, id))
  } catch (caught) {
    return domainErrorResponse(request, caught)
  }
}
