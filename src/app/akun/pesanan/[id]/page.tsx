import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PackageIcon } from "lucide-react"

import { formatDateID, formatRupiah, FULFILLMENT_STATUS_LABELS, ORDER_STATUS_LABELS, SHIPPING_METHODS } from "@/lib/commerce"
import type { ShippingMethod } from "@/lib/commerce"
import { requireUserPage } from "@/lib/auth/session"
import { getCustomerOrder } from "@/server/services/account-service"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type ShippingSnapshot = { recipientName?: string; line1?: string; line2?: string | null; district?: string; city?: string; province?: string; postalCode?: string }

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUserPage(`/akun/pesanan/${id}`)

  const order = await getCustomerOrder(user.id, id).catch(() => null)
  if (!order) notFound()

  const address = (order.shippingAddress ?? {}) as ShippingSnapshot
  const method = (order.shippingMethod as ShippingMethod) ?? "REGULER"
  const payment = order.payments[0]

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Detail pesanan</p>
          <h1 className="display mt-3 text-6xl">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{formatDateID(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
          <Badge variant="secondary">{FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]}</Badge>
        </div>
      </div>

      <div className="mt-10 border p-6">
        <PackageIcon className="size-6 text-primary" />
        <h2 className="mt-5 font-serif text-3xl">
          {order.shipment?.trackingNumber ? `Resi ${order.shipment.trackingNumber}` : SHIPPING_METHODS[method].label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {SHIPPING_METHODS[method].description} · {order.shipment?.carrier ?? SHIPPING_METHODS[method].carrier}
        </p>

        <div className="mt-8 grid gap-6 border-t pt-6 sm:grid-cols-3">
          <div>
            <p className="eyebrow text-muted-foreground">Dikirim ke</p>
            <p className="mt-2 text-sm leading-6">
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
          <div>
            <p className="eyebrow text-muted-foreground">Pembayaran</p>
            <p className="mt-2 text-sm">
              {payment ? `${payment.method} · ${payment.status}` : "Belum ada pembayaran"}
              {payment?.paidAt ? <span className="block text-muted-foreground">Dibayar {formatDateID(payment.paidAt)}</span> : null}
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Total</p>
            <p className="mt-2 font-serif text-3xl">{formatRupiah(order.grandTotal)}</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-3xl">Item pesanan</h2>
        <ul className="mt-4">
          {order.items.map((item) => (
            <li className="grid grid-cols-[80px_1fr_auto] items-center gap-4 border-t py-4" key={item.id}>
              <Image className="aspect-[3/4] w-full object-cover" src={item.imageUrl} alt={item.productName} width={160} height={213} />
              <div>
                <Link className="font-serif text-2xl" href={`/produk/${item.product.slug}`}>
                  {item.productName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.variantLabel} · {item.sku} · × {item.quantity}
                </p>
              </div>
              <span>{formatRupiah(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <Separator className="my-6" />
        <dl className="ml-auto flex max-w-sm flex-col gap-2 text-sm">
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
            <dt>Ongkir</dt>
            <dd>{formatRupiah(order.shippingTotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt>
              <strong>Total</strong>
            </dt>
            <dd>
              <strong className="font-serif text-2xl">{formatRupiah(order.grandTotal)}</strong>
            </dd>
          </div>
        </dl>
      </div>

      <Link className="mt-10 inline-flex min-h-11 items-center border-b text-sm" href="/akun/pesanan">
        Kembali ke daftar pesanan
      </Link>
    </section>
  )
}
