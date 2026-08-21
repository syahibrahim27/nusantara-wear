"use client"

import { useActionState } from "react"

import { createPromotionAction, togglePromotionAction } from "@/features/admin/actions"
import { idleAdminState } from "@/features/admin/action-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const today = () => new Date().toISOString().slice(0, 10)
const nextYear = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export function PromotionForm() {
  const [state, action, pending] = useActionState(createPromotionAction, idleAdminState)
  const errors = state.fieldErrors ?? {}

  return (
    <form className="border p-6" action={action}>
      <h2 className="font-serif text-3xl">Promo baru</h2>

      {state.status !== "idle" && (
        <Alert className="mt-5" variant={state.status === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.status === "error" ? "Gagal" : "Berhasil"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="mt-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="code">Kode</FieldLabel>
            <Input id="code" name="code" placeholder="PERTAMA10" required />
            {errors.code && <FieldError>{errors.code[0]}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nama promo</FieldLabel>
            <Input id="name" name="name" required />
            {errors.name && <FieldError>{errors.name[0]}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type">Jenis</FieldLabel>
            <select id="type" name="type" className="min-h-11 border bg-background px-3 text-sm" defaultValue="PERCENTAGE">
              <option value="PERCENTAGE">Persentase</option>
              <option value="FIXED_AMOUNT">Potongan tetap</option>
              <option value="FREE_SHIPPING">Bebas ongkir</option>
            </select>
          </Field>
          <Field data-invalid={!!errors.value}>
            <FieldLabel htmlFor="value">Nilai</FieldLabel>
            <Input id="value" name="value" type="number" min={0} defaultValue={10} required />
            <FieldDescription>Persen untuk PERCENTAGE, rupiah untuk FIXED_AMOUNT, 0 untuk bebas ongkir.</FieldDescription>
            {errors.value && <FieldError>{errors.value[0]}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="minimumSubtotal">Minimum belanja</FieldLabel>
            <Input id="minimumSubtotal" name="minimumSubtotal" type="number" min={0} step={1000} defaultValue={300000} />
          </Field>
          <Field>
            <FieldLabel htmlFor="maxDiscount">Maksimum diskon (opsional)</FieldLabel>
            <Input id="maxDiscount" name="maxDiscount" type="number" min={0} step={1000} />
          </Field>
          <Field>
            <FieldLabel htmlFor="usageLimit">Batas pemakaian total (opsional)</FieldLabel>
            <Input id="usageLimit" name="usageLimit" type="number" min={1} />
          </Field>
          <Field>
            <FieldLabel htmlFor="perCustomerLimit">Batas per pelanggan</FieldLabel>
            <Input id="perCustomerLimit" name="perCustomerLimit" type="number" min={1} defaultValue={1} />
          </Field>
          <Field data-invalid={!!errors.startsAt}>
            <FieldLabel htmlFor="startsAt">Mulai</FieldLabel>
            <Input id="startsAt" name="startsAt" type="date" defaultValue={today()} required />
            {errors.startsAt && <FieldError>{errors.startsAt[0]}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.endsAt}>
            <FieldLabel htmlFor="endsAt">Berakhir</FieldLabel>
            <Input id="endsAt" name="endsAt" type="date" defaultValue={nextYear()} required />
            {errors.endsAt && <FieldError>{errors.endsAt[0]}</FieldError>}
          </Field>
        </div>

        <Field orientation="horizontal">
          <Checkbox id="isActive" name="isActive" defaultChecked />
          <FieldLabel htmlFor="isActive">Langsung aktif</FieldLabel>
        </Field>

        <Button className="min-h-11 w-fit" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Buat promo"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export function PromotionToggle({ promotionId, isActive }: { promotionId: string; isActive: boolean }) {
  const [, action, pending] = useActionState(togglePromotionAction, idleAdminState)

  return (
    <form action={action}>
      <input type="hidden" name="promotionId" value={promotionId} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      <Button variant="ghost" size="sm" type="submit" disabled={pending}>
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </form>
  )
}
