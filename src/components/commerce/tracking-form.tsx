"use client"

import { useState } from "react"
import { PackageSearchIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { formatDateID, formatRupiah, FULFILLMENT_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/commerce"
import type { FulfillmentStatus, OrderStatus } from "@/lib/commerce"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Result = {
  orderNumber: string
  status: OrderStatus
  fulfillmentStatus: FulfillmentStatus
  createdAt: string
  carrier: string
  trackingNumber: string | null
  grandTotal: number
  items: { productName: string; variantLabel: string; quantity: number }[]
}

export function TrackingForm() {
  const params = useSearchParams()
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setError("")
    setResult(null)
    const query = new URLSearchParams({ orderNumber: String(formData.get("orderNumber")), email: String(formData.get("email")) })
    const response = await fetch(`/api/v1/orders/track?${query}`)
    const body = await response.json().catch(() => null)
    setPending(false)
    if (!response.ok) setError(body?.message ?? "Pesanan tidak ditemukan.")
    else setResult(body)
  }

  return (
    <div>
      <form action={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="orderNumber">Nomor pesanan</FieldLabel>
            <Input id="orderNumber" name="orderNumber" defaultValue={params.get("orderNumber") ?? ""} placeholder="NW-2026-01000" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="track-email">Email pemesan</FieldLabel>
            <Input id="track-email" name="email" type="email" placeholder="nama@email.com" required />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button className="min-h-12" size="lg" disabled={pending}>
            <PackageSearchIcon data-icon="inline-start" />
            {pending ? "Mencari..." : "Lacak pesanan"}
          </Button>
        </FieldGroup>
      </form>

      {result && (
        <div className="mt-8 border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-muted-foreground">{result.orderNumber}</p>
              <h2 className="mt-2 font-serif text-3xl">{ORDER_STATUS_LABELS[result.status]}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Dipesan {formatDateID(result.createdAt)} · {result.carrier}
                {result.trackingNumber ? ` · resi ${result.trackingNumber}` : ""}
              </p>
            </div>
            <Badge>{FULFILLMENT_STATUS_LABELS[result.fulfillmentStatus]}</Badge>
          </div>

          <ol className="mt-6 flex flex-col gap-3">
            {result.items.map((item) => (
              <li className="flex justify-between border-t pt-3 text-sm" key={`${item.productName}-${item.variantLabel}`}>
                <span>
                  {item.productName}
                  <small className="block text-muted-foreground">{item.variantLabel}</small>
                </span>
                <span>× {item.quantity}</span>
              </li>
            ))}
          </ol>

          <p className="mt-6 flex justify-between border-t pt-4 text-sm">
            <span>Total dibayar</span>
            <strong>{formatRupiah(result.grandTotal)}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
