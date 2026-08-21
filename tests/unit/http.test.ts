import { describe, expect, it } from "vitest"
import { z } from "zod"

import { DomainError, DOMAIN_ERROR_STATUS, fieldErrorsOf, rateLimit } from "@/lib/http"

describe("rate limit", () => {
  it("mengizinkan sampai batas lalu menolak", () => {
    const key = `test-${crypto.randomUUID()}`
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true)
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true)
    const blocked = rateLimit(key, 2, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("membuka kembali setelah jendela waktu lewat", async () => {
    const key = `test-${crypto.randomUUID()}`
    expect(rateLimit(key, 1, 1).allowed).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(rateLimit(key, 1, 1).allowed).toBe(true)
  })
})

describe("bentuk error", () => {
  it("mengelompokkan pesan validasi per field", () => {
    const schema = z.object({ email: z.email(), postalCode: z.string().length(5) })
    const parsed = schema.safeParse({ email: "bukan-email", postalCode: "12" })
    expect(parsed.success).toBe(false)
    const fieldErrors = fieldErrorsOf(parsed.error!)
    expect(Object.keys(fieldErrors)).toEqual(expect.arrayContaining(["email", "postalCode"]))
  })

  it("memetakan kode domain ke status HTTP yang tepat", () => {
    expect(DOMAIN_ERROR_STATUS.INSUFFICIENT_STOCK).toBe(409)
    expect(DOMAIN_ERROR_STATUS.FORBIDDEN).toBe(403)
    expect(DOMAIN_ERROR_STATUS.ORDER_NOT_FOUND).toBe(404)
  })

  it("membawa kode dan field error pada DomainError", () => {
    const error = new DomainError("EMAIL_TAKEN", "Email ini sudah terdaftar.", { email: ["sudah dipakai"] })
    expect(error.code).toBe("EMAIL_TAKEN")
    expect(error.fieldErrors?.email).toHaveLength(1)
  })
})
