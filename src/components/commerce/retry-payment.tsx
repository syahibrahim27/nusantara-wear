"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

/** Mengulang konfirmasi pembayaran mock untuk order yang sama; stok tetap aman dari pemotongan ganda. */
export function RetryPayment({ orderNumber }: { orderNumber: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function retry() {
    setPending(true)
    setError("")
    try {
      const response = await fetch("/api/v1/payments/mock/confirm", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": `${orderNumber}:retry:${crypto.randomUUID()}` },
        body: JSON.stringify({ orderNumber, outcome: "PAID" }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message ?? "Pembayaran masih belum berhasil.")
      if (body.paymentStatus !== "PAID") throw new Error("Pembayaran demo ditolak lagi. Coba metode lain.")
      router.push(`/checkout/sukses/${orderNumber}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pembayaran gagal diproses.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <Button className="min-h-12" size="lg" disabled={pending} onClick={retry}>
        {pending ? "Mencoba lagi..." : "Coba bayar lagi"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
