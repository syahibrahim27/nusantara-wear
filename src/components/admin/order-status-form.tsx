"use client"

import { useActionState } from "react"

import { updateOrderStatusAction } from "@/features/admin/actions"
import { idleAdminState } from "@/features/admin/action-state"
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from "@/lib/commerce"
import type { OrderStatus } from "@/lib/commerce"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, idleAdminState)
  const allowed = ORDER_TRANSITIONS[status]

  return (
    <form className="border p-6" action={action}>
      <h2 className="font-serif text-3xl">Ubah status</h2>
      <p className="mt-2 text-sm text-muted-foreground">Status saat ini: {ORDER_STATUS_LABELS[status]}.</p>
      <input type="hidden" name="orderId" value={orderId} />

      {state.status !== "idle" && (
        <Alert className="mt-5" variant={state.status === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.status === "error" ? "Gagal" : "Berhasil"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {allowed.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Status ini final dan tidak dapat diubah lagi.</p>
      ) : (
        <FieldGroup className="mt-6">
          <Field>
            <FieldLabel htmlFor="status">Status berikutnya</FieldLabel>
            <select id="status" name="status" className="min-h-11 border bg-background px-3 text-sm" defaultValue={allowed[0]}>
              {allowed.map((next) => (
                <option key={next} value={next}>
                  {ORDER_STATUS_LABELS[next]}
                </option>
              ))}
            </select>
            <FieldDescription>Hanya transisi yang sah menurut state machine order yang ditawarkan.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="trackingNumber">Nomor resi (opsional)</FieldLabel>
            <Input id="trackingNumber" name="trackingNumber" placeholder="Diisi otomatis saat dikirim" />
          </Field>
          <Button className="min-h-11 w-fit" type="submit" disabled={pending}>
            {pending ? "Memproses..." : "Perbarui status"}
          </Button>
        </FieldGroup>
      )}
    </form>
  )
}
