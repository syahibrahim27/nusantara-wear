import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { ZodError } from "zod"

export type ApiErrorBody = { code: string; message: string; fieldErrors?: Record<string, string[]>; requestId: string }

export const requestIdOf = (request: Pick<NextRequest, "headers">) => request.headers.get("x-request-id") ?? crypto.randomUUID()

export function apiError(
  request: Pick<NextRequest, "headers">,
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  const requestId = requestIdOf(request)
  const body: ApiErrorBody = { code, message, requestId }
  if (fieldErrors) body.fieldErrors = fieldErrors
  return NextResponse.json(body, { status, headers: { "x-request-id": requestId } })
}

export const validationError = (request: Pick<NextRequest, "headers">, error: ZodError, message = "Periksa kembali data yang dikirim.") =>
  apiError(request, 422, "VALIDATION_ERROR", message, fieldErrorsOf(error))

export function fieldErrorsOf(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form"
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
  }
  return fieldErrors
}

export function apiJson<T>(request: Pick<NextRequest, "headers">, data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "x-request-id": requestIdOf(request) } })
}

type RateEntry = { count: number; resetAt: number }
const rateGlobal = globalThis as typeof globalThis & { __NW_RATE__?: Map<string, RateEntry> }
const rateState = (rateGlobal.__NW_RATE__ ??= new Map<string, RateEntry>())

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

/**
 * Rate limit in-memory per instance. Cukup untuk demo satu proses;
 * production multi-instance perlu penyimpanan bersama (Redis/KV).
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = rateState.get(key)
  if (!entry || entry.resetAt <= now) {
    rateState.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (entry.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  entry.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export const clientKey = (request: NextRequest, bucket: string) =>
  `${bucket}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "local"}`

export function enforceRateLimit(request: NextRequest, bucket: string, limit: number, windowMs: number) {
  const result = rateLimit(clientKey(request, bucket), limit, windowMs)
  if (result.allowed) return null
  const response = apiError(request, 429, "RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi sebentar lagi.")
  response.headers.set("retry-after", String(result.retryAfterSeconds))
  return response
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/** Menerjemahkan error domain menjadi status HTTP yang tepat. */
export const DOMAIN_ERROR_STATUS: Record<string, number> = {
  CART_EMPTY: 422,
  VARIANT_NOT_FOUND: 422,
  VARIANT_INACTIVE: 422,
  INSUFFICIENT_STOCK: 409,
  ORDER_NOT_FOUND: 404,
  PAYMENT_NOT_FOUND: 404,
  ORDER_ALREADY_PAID: 409,
  INVALID_TRANSITION: 409,
  PROMO_NOT_APPLICABLE: 422,
  EMAIL_TAKEN: 409,
  INVALID_TOKEN: 400,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SLUG_TAKEN: 409,
  CODE_TAKEN: 409,
}

export class DomainError extends Error {
  constructor(
    public code: keyof typeof DOMAIN_ERROR_STATUS | string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "DomainError"
  }
}

export function domainErrorResponse(request: NextRequest, caught: unknown) {
  if (caught instanceof DomainError) {
    return apiError(request, DOMAIN_ERROR_STATUS[caught.code] ?? 400, caught.code, caught.message, caught.fieldErrors)
  }
  console.error("[api] unhandled error", caught instanceof Error ? caught.message : caught)
  return apiError(request, 500, "INTERNAL_ERROR", "Terjadi kesalahan tak terduga. Silakan coba lagi.")
}
