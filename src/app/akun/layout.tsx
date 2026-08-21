import Link from "next/link"

import { requireUserPage } from "@/lib/auth/session"
import { SignOutButton } from "@/components/auth/sign-out-button"

export const dynamic = "force-dynamic"

const nav = [
  ["Ringkasan", "/akun"],
  ["Pesanan", "/akun/pesanan"],
  ["Alamat", "/akun/alamat"],
  ["Wishlist", "/akun/wishlist"],
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/akun")

  return (
    <div className="mx-auto max-w-[1300px] px-5 pb-28 pt-36 sm:px-10">
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="eyebrow text-primary">Akun saya</p>
          <p className="mt-3 font-serif text-3xl">{user.name ?? "Pelanggan"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          <nav className="mt-8 flex flex-col" aria-label="Navigasi akun">
            {nav.map(([label, href]) => (
              <Link className="flex min-h-12 items-center border-b text-sm" href={href} key={label}>
                {label}
              </Link>
            ))}
            {(user.role === "ADMIN" || user.role === "STAFF") && (
              <Link className="flex min-h-12 items-center border-b text-sm" href="/admin">
                Studio Console
              </Link>
            )}
          </nav>
          <SignOutButton />
        </aside>
        {children}
      </div>
    </div>
  )
}
