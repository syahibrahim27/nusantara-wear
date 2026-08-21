import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { hash } from "bcryptjs"

import { prisma } from "@/lib/db/prisma"
import { DomainError } from "@/lib/http"
import { emailProvider } from "@/lib/email"

const RESET_TTL_MINUTES = 30
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const digest = (token: string) => createHash("sha256").update(token).digest("hex")

export async function registerCustomer(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new DomainError("EMAIL_TAKEN", "Email ini sudah terdaftar.", { email: ["Email ini sudah terdaftar."] })
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash: await hash(input.password, 12), role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
  })
  return user
}

/**
 * Selalu mengembalikan sukses agar tidak membocorkan email mana yang terdaftar.
 * Token disimpan dalam bentuk hash; hanya tautan yang dikirim ke email.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { sent: true }

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } })
  await prisma.verificationToken.create({ data: { identifier: user.email, token: digest(token), expires } })
  await emailProvider.sendPasswordReset({ to: user.email, resetUrl: `${appUrl()}/lupa-password?token=${token}`, expiresAt: expires })
  return { sent: true }
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token: digest(token) } })
  if (!record || record.expires < new Date()) throw new DomainError("INVALID_TOKEN", "Tautan reset sudah kedaluwarsa. Silakan minta ulang.")
  await prisma.$transaction([
    prisma.user.update({ where: { email: record.identifier }, data: { passwordHash: await hash(password, 12) } }),
    prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
  ])
  return { email: record.identifier }
}
