import Link from "next/link"
import { AlertTriangleIcon, ArrowUpRightIcon, CircleDollarSignIcon, ShoppingBagIcon, UsersIcon } from "lucide-react"

import { formatDateID, formatRupiah, ORDER_STATUS_LABELS } from "@/lib/commerce"
import { dashboardMetrics, listAudit } from "@/server/services/admin-service"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminPage() {
  const [metrics, audit] = await Promise.all([dashboardMetrics(), listAudit(8)])

  const stats = [
    [CircleDollarSignIcon, "Pendapatan", formatRupiah(metrics.revenue), "Dari pesanan berbayar"],
    [ShoppingBagIcon, "Pesanan", String(metrics.orderCount), "Seluruh status"],
    [ArrowUpRightIcon, "Rata-rata", formatRupiah(metrics.averageOrderValue), "Per pesanan berbayar"],
    [AlertTriangleIcon, "Stok rendah", `${metrics.lowStockCount} variant`, "Di bawah reorder point"],
    [UsersIcon, "Pelanggan", String(metrics.customers), "Akun terdaftar"],
  ] as const

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Operasi / Hari ini</p>
          <h1 className="display mt-3 text-6xl">Studio Console.</h1>
        </div>
        <Badge>Data langsung dari PostgreSQL</Badge>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([Icon, label, value, note]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="font-serif text-3xl">{value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs">
                <Icon className="size-5 text-primary" />
                <span>{note}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">Produk bergerak cepat</CardTitle>
            <CardDescription>Diurutkan dari jumlah terjual pada seluruh pesanan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead>Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>Belum ada penjualan tercatat.</TableCell>
                  </TableRow>
                ) : (
                  metrics.topProducts.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sold}</TableCell>
                      <TableCell>{formatRupiah(product.revenue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">Stok menipis</CardTitle>
            <CardDescription>Variant yang perlu restock segera.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>Reorder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>Semua variant aman.</TableCell>
                  </TableRow>
                ) : (
                  metrics.lowStock.map((item) => (
                    <TableRow key={item.variantId}>
                      <TableCell className="font-medium">
                        {item.productName}
                        <small className="block text-muted-foreground">{item.label}</small>
                      </TableCell>
                      <TableCell>{item.available}</TableCell>
                      <TableCell>{item.reorderPoint}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Link className="mt-4 inline-flex min-h-11 items-center border-b text-sm" href="/admin/inventory">
              Buka inventory
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">Pesanan terbaru</CardTitle>
            <CardDescription>Enam pesanan paling akhir.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>Belum ada pesanan.</TableCell>
                  </TableRow>
                ) : (
                  metrics.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                        <small className="block text-muted-foreground">{formatDateID(order.createdAt)}</small>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.status === "PENDING_PAYMENT" ? "secondary" : "default"}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                      </TableCell>
                      <TableCell>{formatRupiah(order.grandTotal)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">Jejak audit</CardTitle>
            <CardDescription>Setiap perubahan admin tercatat beserta pelakunya.</CardDescription>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas admin.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {audit.map((entry) => (
                  <li className="border-b pb-3" key={entry.id}>
                    <strong>{entry.action}</strong>
                    <span className="block text-muted-foreground">{entry.summary}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.actorEmail} · {formatDateID(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
