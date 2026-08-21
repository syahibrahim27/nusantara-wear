import Link from "next/link"
import { notFound } from "next/navigation"

import { formatDateID, formatRupiah, FULFILLMENT_STATUS_LABELS, ORDER_STATUS_LABELS, SHIPPING_METHODS } from "@/lib/commerce"
import type { ShippingMethod } from "@/lib/commerce"
import { getAdminOrder } from "@/server/services/admin-service"
import { OrderStatusForm } from "@/components/admin/order-status-form"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ShippingSnapshot = { recipientName?: string; line1?: string; line2?: string | null; district?: string; city?: string; province?: string; postalCode?: string }

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getAdminOrder(id)
  if (!order) notFound()

  const address = (order.shippingAddress ?? {}) as ShippingSnapshot
  const method = (order.shippingMethod as ShippingMethod) ?? "REGULER"

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Studio Console</p>
          <h1 className="display mt-3 text-6xl">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDateID(order.createdAt)} · {order.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
          <Badge variant="secondary">{FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]}</Badge>
        </div>
      </div>

      <div className="mt-9 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.productName}
                    <small className="block text-muted-foreground">{item.variantLabel}</small>
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatRupiah(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <dl className="mt-6 ml-auto flex max-w-sm flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatRupiah(order.subtotal)}</dd>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-primary">
                <dt>Diskon {order.promoCodeSnapshot}</dt>
                <dd>−{formatRupiah(order.discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Ongkir · {SHIPPING_METHODS[method].label}</dt>
              <dd>{formatRupiah(order.shippingTotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t pt-2">
              <dt>
                <strong>Total</strong>
              </dt>
              <dd>
                <strong className="font-serif text-2xl">{formatRupiah(order.grandTotal)}</strong>
              </dd>
            </div>
          </dl>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="border p-5">
              <p className="eyebrow text-muted-foreground">Alamat pengiriman</p>
              <p className="mt-3 text-sm leading-6">
                {address.recipientName}
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.district}, {address.city}
                <br />
                {address.province} {address.postalCode}
              </p>
            </div>
            <div className="border p-5">
              <p className="eyebrow text-muted-foreground">Pembayaran</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id}>
                    {payment.method} · {payment.status}
                    <span className="block text-xs text-muted-foreground">
                      {payment.providerReference} {payment.paidAt ? `· dibayar ${formatDateID(payment.paidAt)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <OrderStatusForm orderId={order.id} status={order.status} />
          {order.shipment && (
            <div className="border p-6">
              <h2 className="font-serif text-2xl">Pengiriman</h2>
              <p className="mt-3 text-sm">
                {order.shipment.carrier} · {order.shipment.service}
                <span className="block text-muted-foreground">
                  {order.shipment.trackingNumber ?? "Belum ada resi"}
                  {order.shipment.shippedAt ? ` · dikirim ${formatDateID(order.shipment.shippedAt)}` : ""}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <Link className="mt-10 inline-flex min-h-11 items-center border-b text-sm" href="/admin/orders">
        Kembali ke daftar pesanan
      </Link>
    </section>
  )
}
