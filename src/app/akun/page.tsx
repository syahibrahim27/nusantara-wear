import Link from "next/link"
import { HeartIcon, MapPinIcon, PackageIcon, WalletIcon } from "lucide-react"

import { formatDateID, formatRupiah, ORDER_STATUS_LABELS } from "@/lib/commerce"
import { requireUserPage } from "@/lib/auth/session"
import { accountSummary, listCustomerOrders } from "@/server/services/account-service"
import { Badge } from "@/components/ui/badge"

export default async function AccountPage() {
  const user = await requireUserPage("/akun")
  const [summary, orders] = await Promise.all([accountSummary(user.id), listCustomerOrders(user.id)])
  const recent = orders.slice(0, 3)

  const tiles = [
    [PackageIcon, "Pesanan", `${summary.orders} pesanan`, "/akun/pesanan"],
    [MapPinIcon, "Alamat", `${summary.addresses} tersimpan`, "/akun/alamat"],
    [HeartIcon, "Wishlist", `${summary.wishlist} potongan`, "/akun/wishlist"],
    [WalletIcon, "Total belanja", formatRupiah(summary.totalSpent), "/akun/pesanan"],
  ] as const

  return (
    <section>
      <p className="eyebrow">Ringkasan</p>
      <h1 className="display mt-4 text-6xl">Kabar dari ruang Anda.</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([Icon, title, value, href]) => (
          <Link className="border p-6 transition-colors hover:bg-card" href={href} key={title}>
            <Icon className="size-6 text-primary" />
            <h2 className="mt-8 font-serif text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-14" aria-labelledby="pesanan-terakhir">
        <h2 className="font-serif text-3xl" id="pesanan-terakhir">
          Pesanan terakhir
        </h2>
        {recent.length === 0 ? (
          <p className="mt-4 border-t pt-6 text-sm text-muted-foreground">
            Belum ada pesanan.{" "}
            <Link className="border-b" href="/shop">
              Mulai jelajahi koleksi
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4">
            {recent.map((order) => (
              <Link className="grid gap-3 border-t py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center" href={`/akun/pesanan/${order.id}`} key={order.id}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p className="text-sm text-muted-foreground">
                    {formatDateID(order.createdAt)} · {order.items.length} item
                  </p>
                </div>
                <Badge variant={order.status === "COMPLETED" ? "secondary" : "default"}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                <span>{formatRupiah(order.grandTotal)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
