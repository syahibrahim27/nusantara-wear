import Link from "next/link"

import { formatDateID, formatRupiah, FULFILLMENT_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/commerce"
import { listAdminOrders } from "@/server/services/admin-service"
import { maskEmail } from "@/server/services/admin-service"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const FILTERS = ["SEMUA", "PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "REFUNDED"] as const

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "SEMUA" } = await searchParams
  const orders = await listAdminOrders(status)

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">Orders</h1>
      <p className="mt-4 text-sm text-muted-foreground">Tinjau pembayaran, ubah status fulfillment, dan terbitkan resi.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            className={buttonVariants({ variant: filter === status ? "default" : "outline", size: "sm", className: "min-h-11" })}
            href={filter === "SEMUA" ? "/admin/orders" : `/admin/orders?status=${filter}`}
            key={filter}
          >
            {filter === "SEMUA" ? "Semua" : ORDER_STATUS_LABELS[filter]}
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">{orders.length} pesanan</CardTitle>
          <CardDescription>Email pelanggan disamarkan; detail penuh ada di halaman pesanan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Belum ada pesanan pada filter ini.</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                      <small className="block text-muted-foreground">{order.items.length} item</small>
                    </TableCell>
                    <TableCell>{maskEmail(order.email)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "PENDING_PAYMENT" ? "secondary" : "default"}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                    </TableCell>
                    <TableCell>{FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]}</TableCell>
                    <TableCell>{formatRupiah(order.grandTotal)}</TableCell>
                    <TableCell>{formatDateID(order.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
