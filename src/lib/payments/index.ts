import { MockPaymentProvider } from "@/lib/payments/mock-provider"
import type { PaymentProvider } from "@/lib/payments/provider"

/**
 * Provider dipilih lewat `PAYMENT_PROVIDER`. Default `mock` agar demo berjalan tanpa
 * layanan berbayar; Midtrans/Stripe cukup mengimplementasikan interface yang sama.
 */
function resolveProvider(): PaymentProvider {
  const configured = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase()
  if (configured !== "mock") {
    console.warn(`[payments] provider "${configured}" belum tersedia, memakai MockPaymentProvider.`)
  }
  return new MockPaymentProvider()
}

const globalForPayments = globalThis as typeof globalThis & { __NW_PAYMENTS__?: PaymentProvider }
export const paymentProvider: PaymentProvider = (globalForPayments.__NW_PAYMENTS__ ??= resolveProvider())
export type { PaymentProvider } from "@/lib/payments/provider"
