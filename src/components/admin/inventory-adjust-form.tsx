"use client"

import { useActionState, useState } from "react"

import { adjustInventoryAction } from "@/features/admin/actions"
import { idleAdminState } from "@/features/admin/action-state"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type VariantOption = { variantId: string; sku: string; productName: string; label: string; onHand: number }

export function InventoryAdjustForm({ variants, selectedVariantId }: { variants: VariantOption[]; selectedVariantId?: string }) {
  const [state, action, pending] = useActionState(adjustInventoryAction, idleAdminState)
  const [variantId, setVariantId] = useState(selectedVariantId ?? variants[0]?.variantId ?? "")
  const errors = state.fieldErrors ?? {}
  const selected = variants.find((variant) => variant.variantId === variantId)

  return (
    <form className="border p-6" action={action}>
      <h2 className="font-serif text-3xl">Penyesuaian stok</h2>
      <p className="mt-2 text-sm text-muted-foreground">Setiap penyesuaian menghasilkan inventory movement dengan alasan dan aktor.</p>

      {state.status !== "idle" && (
        <Alert className="mt-5" variant={state.status === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.status === "error" ? "Gagal" : "Berhasil"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="mt-6">
        <Field data-invalid={!!errors.variantId}>
          <FieldLabel htmlFor="variantId">Variant</FieldLabel>
          <select
            id="variantId"
            name="variantId"
            className="min-h-11 border bg-background px-3 text-sm"
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            required
          >
            {variants.map((variant) => (
              <option key={variant.variantId} value={variant.variantId}>
                {variant.productName} — {variant.label} ({variant.sku})
              </option>
            ))}
          </select>
          {selected && <FieldDescription>Stok saat ini: {selected.onHand}</FieldDescription>}
          {errors.variantId && <FieldError>{errors.variantId[0]}</FieldError>}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.type}>
            <FieldLabel htmlFor="type">Jenis</FieldLabel>
            <select id="type" name="type" className="min-h-11 border bg-background px-3 text-sm" defaultValue="RESTOCK">
              <option value="RESTOCK">Restock</option>
              <option value="RETURN">Retur masuk</option>
              <option value="ADJUSTMENT">Koreksi</option>
            </select>
          </Field>
          <Field data-invalid={!!errors.quantity}>
            <FieldLabel htmlFor="quantity">Jumlah (boleh negatif)</FieldLabel>
            <Input id="quantity" name="quantity" type="number" step={1} defaultValue={1} required />
            {errors.quantity && <FieldError>{errors.quantity[0]}</FieldError>}
          </Field>
        </div>

        <Field data-invalid={!!errors.reason}>
          <FieldLabel htmlFor="reason">Alasan</FieldLabel>
          <Input id="reason" name="reason" placeholder="Kiriman dari studio produksi" required />
          {errors.reason && <FieldError>{errors.reason[0]}</FieldError>}
        </Field>

        <Button className="min-h-11 w-fit" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan penyesuaian"}
        </Button>
      </FieldGroup>
    </form>
  )
}
