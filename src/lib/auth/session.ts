import "server-only"

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth/options"
import { DomainError } from "@/lib/http"

export type SessionUser = { id: string; name?: string | null; email?: string | null; role: "CUSTOMER" | "STAFF" | "ADMIN" }

export async function currentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  return session?.user ? (session.user as SessionUser) : null
}

export const isStaff = (user: SessionUser | null) => !!user && (user.role === "ADMIN" || user.role === "STAFF")

/** Guard untuk halaman akun; mengarahkan ke halaman masuk bila belum login. */
export async function requireUserPage(callbackUrl: string): Promise<SessionUser> {
  const user = await currentUser()
  if (!user) redirect(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  return user
}

/** Guard untuk seluruh area admin; STAFF dan ADMIN saja. */
export async function requireStaffPage(callbackUrl = "/admin"): Promise<SessionUser> {
  const user = await currentUser()
  if (!user) redirect(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  if (!isStaff(user)) redirect("/akun")
  return user
}

/** Guard untuk mutation server action dan route handler. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await currentUser()
  if (!user) throw new DomainError("UNAUTHORIZED", "Anda harus masuk terlebih dahulu.")
  if (!isStaff(user)) throw new DomainError("FORBIDDEN", "Akses admin diperlukan.")
  return user
}

export async function requireCustomer(): Promise<SessionUser> {
  const user = await currentUser()
  if (!user) throw new DomainError("UNAUTHORIZED", "Anda harus masuk terlebih dahulu.")
  return user
}
