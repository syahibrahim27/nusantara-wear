"use client"

import { useActionState } from "react"

import { archiveProductAction } from "@/features/admin/actions"
import { idleAdminState } from "@/features/admin/action-state"
import { Button } from "@/components/ui/button"

export function ArchiveProductButton({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(archiveProductAction, idleAdminState)

  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <Button variant="ghost" size="sm" type="submit" disabled={pending}>
        {pending ? "..." : "Arsipkan"}
      </Button>
      {state.status === "error" && <span className="block text-xs text-destructive">{state.message}</span>}
    </form>
  )
}
