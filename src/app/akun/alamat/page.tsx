import type { Metadata } from "next"

import { requireUserPage } from "@/lib/auth/session"
import { listAddresses } from "@/server/services/account-service"
import { AddressBook } from "@/components/account/address-book"

export const metadata: Metadata = { title: "Alamat saya" }

export default async function AddressPage() {
  const user = await requireUserPage("/akun/alamat")
  const addresses = await listAddresses(user.id)

  return (
    <section>
      <p className="eyebrow text-primary">Alamat</p>
      <h1 className="display mt-3 text-6xl">Tempat pulang.</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Alamat utama akan otomatis mengisi form checkout Anda berikutnya.
      </p>
      <div className="mt-10">
        <AddressBook
          addresses={addresses.map((address) => ({
            id: address.id,
            label: address.label,
            recipientName: address.recipientName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            district: address.district,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            isDefault: address.isDefault,
          }))}
        />
      </div>
    </section>
  )
}
