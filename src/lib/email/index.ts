import { ConsoleEmailProvider } from "@/lib/email/provider"
import type { EmailProvider } from "@/lib/email/provider"

/** `RESEND_API_KEY` disediakan sebagai jalur opsional; demo tetap memakai console adapter. */
function resolveProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) {
    console.warn("[email] adapter Resend belum diaktifkan, memakai ConsoleEmailProvider.")
  }
  return new ConsoleEmailProvider()
}

const globalForEmail = globalThis as typeof globalThis & { __NW_EMAIL__?: EmailProvider }
export const emailProvider: EmailProvider = (globalForEmail.__NW_EMAIL__ ??= resolveProvider())
export type { EmailProvider, OrderEmail, PasswordResetEmail } from "@/lib/email/provider"
