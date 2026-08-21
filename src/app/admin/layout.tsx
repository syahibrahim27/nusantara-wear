import Link from "next/link"
import { ArchiveIcon, BoxesIcon, LayoutDashboardIcon, NewspaperIcon, PercentIcon, ShoppingBagIcon, UsersIcon } from "lucide-react"

import { requireStaffPage } from "@/lib/auth/session"
import { SignOutButton } from "@/components/auth/sign-out-button"

export const dynamic = "force-dynamic"

const nav = [
  [LayoutDashboardIcon, "Dashboard", "/admin"],
  [ArchiveIcon, "Produk", "/admin/produk"],
  [BoxesIcon, "Inventory", "/admin/inventory"],
  [ShoppingBagIcon, "Orders", "/admin/orders"],
  [PercentIcon, "Promo", "/admin/promo"],
  [UsersIcon, "Customers", "/admin/customers"],
  [NewspaperIcon, "Journal", "/admin/journal"],
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage()

  return (
    <div className="min-h-screen bg-[#ebe6dc] pb-24 pt-24">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 sm:px-8 lg:grid-cols-[230px_1fr] lg:px-10">
        <aside className="h-fit bg-secondary p-5 text-secondary-foreground lg:sticky lg:top-28">
          <p className="eyebrow text-accent">Studio Console</p>
          <p className="mt-2 font-serif text-2xl">{user.name ?? "Staf"}</p>
          <p className="mt-1 text-xs opacity-70">{user.role}</p>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Navigasi admin">
            {nav.map(([Icon, label, href]) => (
              <Link className="flex min-h-11 items-center gap-3 border-b border-secondary-foreground/15 text-sm" href={href} key={label}>
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
            <Link className="flex min-h-11 items-center gap-3 border-b border-secondary-foreground/15 text-sm" href="/">
              Kembali ke storefront
            </Link>
          </nav>
          <SignOutButton />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
