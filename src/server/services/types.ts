import type { z } from "zod"

import type { journalAdminSchema, productAdminSchema, promotionAdminSchema } from "@/lib/validation/schemas"

export type ProductAdminInput = z.infer<typeof productAdminSchema>
export type PromotionAdminInput = z.infer<typeof promotionAdminSchema>
export type JournalAdminInput = z.infer<typeof journalAdminSchema>
