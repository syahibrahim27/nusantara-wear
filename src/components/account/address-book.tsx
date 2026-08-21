"use client"

import { useActionState, useState } from "react"
import { MapPinIcon, PlusIcon } from "lucide-react"

import { deleteAddressAction, saveAddressAction } from "@/features/account/actions"
import { idleState } from "@/features/account/action-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type AddressView = {
  id: string
  label: string
  recipientName: string
  phone: string
  line1: string
  line2: string | null
  district: string
  city: string
  province: string
  postalCode: string
  isDefault: boolean
}

export function AddressBook({ addresses }: { addresses: AddressView[] }) {
  const [saveState, save, saving] = useActionState(saveAddressAction, idleState)
  const [deleteState, remove] = useActionState(deleteAddressAction, idleState)
  const [editing, setEditing] = useState<AddressView | null>(null)
  const [showForm, setShowForm] = useState(addresses.length === 0)

  const errors = saveState.fieldErrors ?? {}
  const startEdit = (address: AddressView | null) => {
    setEditing(address)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl">Alamat tersimpan</h2>
        <Button
          variant="outline"
          onClick={() => {
            startEdit(null)
          }}
        >
          <PlusIcon data-icon="inline-start" />
          Tambah alamat
        </Button>
      </div>

      {(saveState.status !== "idle" || deleteState.status !== "idle") && (
        <Alert className="mt-6" variant={saveState.status === "error" || deleteState.status === "error" ? "destructive" : "default"}>
          <AlertTitle>{saveState.status === "error" || deleteState.status === "error" ? "Gagal" : "Berhasil"}</AlertTitle>
          <AlertDescription>{deleteState.message || saveState.message}</AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <article className="border p-6" key={address.id}>
            <div className="flex items-center justify-between">
              <MapPinIcon className="size-5 text-primary" />
              {address.isDefault && <Badge>Utama</Badge>}
            </div>
            <h3 className="mt-6 font-serif text-3xl">{address.label}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {address.recipientName}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.district}, {address.city}
              <br />
              {address.province} {address.postalCode}
              <br />
              {address.phone}
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(address)}>
                Ubah
              </Button>
              <form action={remove}>
                <input type="hidden" name="addressId" value={address.id} />
                <Button variant="ghost" size="sm" type="submit">
                  Hapus
                </Button>
              </form>
            </div>
          </article>
        ))}
      </div>

      {showForm && (
        <form className="mt-10 max-w-2xl border p-6" action={save} key={editing?.id ?? "baru"}>
          <h3 className="font-serif text-3xl">{editing ? "Ubah alamat" : "Alamat baru"}</h3>
          <input type="hidden" name="addressId" value={editing?.id ?? ""} />
          <FieldGroup className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.label}>
                <FieldLabel htmlFor="label">Label</FieldLabel>
                <Input id="label" name="label" defaultValue={editing?.label ?? "Rumah"} required />
                {errors.label && <FieldError>{errors.label[0]}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.recipientName}>
                <FieldLabel htmlFor="recipientName">Nama penerima</FieldLabel>
                <Input id="recipientName" name="recipientName" defaultValue={editing?.recipientName} required />
                {errors.recipientName && <FieldError>{errors.recipientName[0]}</FieldError>}
              </Field>
            </div>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Nomor telepon</FieldLabel>
              <Input id="phone" name="phone" inputMode="tel" defaultValue={editing?.phone} placeholder="0812xxxxxxx" required />
              {errors.phone && <FieldError>{errors.phone[0]}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.line1}>
              <FieldLabel htmlFor="line1">Alamat lengkap</FieldLabel>
              <Input id="line1" name="line1" defaultValue={editing?.line1} required />
              {errors.line1 && <FieldError>{errors.line1[0]}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="line2">Detail tambahan (opsional)</FieldLabel>
              <Input id="line2" name="line2" defaultValue={editing?.line2 ?? ""} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.district}>
                <FieldLabel htmlFor="district">Kecamatan</FieldLabel>
                <Input id="district" name="district" defaultValue={editing?.district} required />
                {errors.district && <FieldError>{errors.district[0]}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="city">Kota</FieldLabel>
                <Input id="city" name="city" defaultValue={editing?.city} required />
                {errors.city && <FieldError>{errors.city[0]}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.province}>
                <FieldLabel htmlFor="province">Provinsi</FieldLabel>
                <Input id="province" name="province" defaultValue={editing?.province} required />
                {errors.province && <FieldError>{errors.province[0]}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.postalCode}>
                <FieldLabel htmlFor="postalCode">Kode pos</FieldLabel>
                <Input id="postalCode" name="postalCode" inputMode="numeric" maxLength={5} defaultValue={editing?.postalCode} required />
                {errors.postalCode && <FieldError>{errors.postalCode[0]}</FieldError>}
              </Field>
            </div>
            <Field orientation="horizontal">
              <Checkbox id="isDefault" name="isDefault" defaultChecked={editing?.isDefault ?? addresses.length === 0} />
              <FieldLabel htmlFor="isDefault">Jadikan alamat utama</FieldLabel>
            </Field>
            <div className="flex gap-3">
              <Button className="min-h-11" type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan alamat"}
              </Button>
              <Button className="min-h-11" type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}
    </div>
  )
}
