import type { Metadata } from "next"

import { CheckoutClient } from "@/components/commerce/checkout-client"
import { currentUser } from "@/lib/auth/session"
import { listAddresses } from "@/server/services/account-service"

export const metadata: Metadata = { title: "Checkout", robots: { index: false } }
export const dynamic = "force-dynamic"

/** Pelanggan yang sudah masuk mendapat prefill dari alamat utama; tamu tetap bisa checkout. */
export default async function CheckoutPage() {
  const user = await currentUser()
  if (!user) return <CheckoutClient />

  const addresses = await listAddresses(user.id)
  const primary = addresses.find((address) => address.isDefault) ?? addresses[0]

  return (
    <CheckoutClient
      defaults={{
        email: user.email ?? undefined,
        ...(primary
          ? {
              phone: primary.phone,
              recipientName: primary.recipientName,
              line1: primary.line1,
              line2: primary.line2 ?? "",
              district: primary.district,
              city: primary.city,
              province: primary.province,
              postalCode: primary.postalCode,
            }
          : {}),
      }}
    />
  )
}
