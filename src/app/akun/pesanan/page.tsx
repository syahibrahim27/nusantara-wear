import type { Metadata } from "next"
import Link from "next/link"

import { formatDateID, formatRupiah, FULFILLMENT_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/commerce"
import { requireUserPage } from "@/lib/auth/session"
import { listCustomerOrders } from "@/server/services/account-service"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export const metadata: Metadata = { title: "Pesanan saya" }

export default async function AccountOrdersPage() {
  const user = await requireUserPage("/akun/pesanan")
  const orders = await listCustomerOrders(user.id)

  return (
    <section>
      <p className="eyebrow text-primary">Riwayat</p>
      <h1 className="display mt-3 text-6xl">Pesanan Anda.</h1>

      {orders.length === 0 ? (
        <Empty className="mt-10 border py-20">
          <EmptyHeader>
            <EmptyTitle>Belum ada pesanan</EmptyTitle>
            <EmptyDescription>Setiap pesanan yang Anda buat akan tersimpan lengkap di sini.</EmptyDescription>
          </EmptyHeader>
          <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href="/shop">
            Jelajahi koleksi
          </Link>
        </Empty>
      ) : (
        <div className="mt-9">
          {orders.map((order) => (
            <Link className="grid gap-4 border-t py-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center" href={`/akun/pesanan/${order.id}`} key={order.id}>
              <div>
                <strong>{order.orderNumber}</strong>
                <p className="text-sm text-muted-foreground">
                  {formatDateID(order.createdAt)} · {order.items.map((item) => item.productName).join(", ")}
                </p>
              </div>
              <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
              <span className="text-xs text-muted-foreground">{FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]}</span>
              <span>{formatRupiah(order.grandTotal)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
