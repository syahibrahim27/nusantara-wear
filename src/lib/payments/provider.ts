export type PaymentState = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED"
export type PaymentRequest = { orderNumber: string; amount: number; currency: "IDR"; method: "VA" | "QRIS" | "CARD"; idempotencyKey: string }
export type PaymentResult = { reference: string; state: PaymentState; sanitizedResponse: Record<string, unknown> }
export interface PaymentProvider { createPayment(request: PaymentRequest): Promise<PaymentResult>; confirm(reference: string, outcome?: "PAID" | "FAILED"): Promise<PaymentResult>; refund(reference: string): Promise<PaymentResult> }
