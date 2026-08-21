import type { PaymentProvider, PaymentRequest, PaymentResult } from "@/lib/payments/provider"
export class MockPaymentProvider implements PaymentProvider {
  private readonly states = new Map<string, PaymentResult>()
  async createPayment(request: PaymentRequest) { const existing = this.states.get(request.idempotencyKey); if (existing) return existing; const result = { reference: `MOCK-${crypto.randomUUID()}`, state: "PENDING" as const, sanitizedResponse: { method: request.method, amount: request.amount, demo: true } }; this.states.set(request.idempotencyKey, result); return result }
  async confirm(reference: string, outcome: "PAID" | "FAILED" = "PAID") { return { reference, state: outcome, sanitizedResponse: { demo: true, confirmedAt: new Date().toISOString() } } }
  async refund(reference: string) { return { reference, state: "REFUNDED" as const, sanitizedResponse: { demo: true, refundedAt: new Date().toISOString() } } }
}
