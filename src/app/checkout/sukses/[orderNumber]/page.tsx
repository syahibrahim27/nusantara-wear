import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckIcon, PackageCheckIcon } from "lucide-react"

import { formatDateID, formatRupiah, ORDER_STATUS_LABELS, SHIPPING_METHODS } from "@/lib/commerce"
import type { ShippingMethod } from "@/lib/commerce"
import { getOrderByNumber } from "@/server/services/order-service"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Pesanan berhasil", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function SuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const order = await getOrderByNumber(decodeURIComponent(orderNumber).toUpperCase())
  if (!order) notFound()

  const method = (order.shippingMethod as ShippingMethod) ?? "REGULER"

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <div className="flex flex-col items-center text-center">
        <div className="grid size-20 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <CheckIcon className="size-9" />
        </div>
        <p className="eyebrow mt-8 text-primary">Pembayaran demo berhasil</p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">Cerita baru sedang menuju Anda.</h1>
        <p className="mt-7 max-w-xl leading-7 text-muted-foreground">
          Pesanan <strong className="text-foreground">{order.orderNumber}</strong> berstatus {ORDER_STATUS_LABELS[order.status].toLowerCase()}. Email konfirmasi
          dicetak melalui console adapter pada mode demo.
        </p>
      </div>

      <section className="mt-12 border p-6" aria-labelledby="ringkasan-pesanan">
        <h2 className="font-serif text-3xl" id="ringkasan-pesanan">
          Ringkasan pesanan
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateID(order.createdAt)} · {SHIPPING_METHODS[method].label}
        </p>

        <ul className="mt-6 flex flex-col gap-4">
          {order.items.map((item) => (
            <li className="flex justify-between gap-4 border-t pt-4 text-sm" key={item.id}>
              <span>
                {item.productName} × {item.quantity}
                <small className="block text-muted-foreground">
                  {item.variantLabel} · {item.sku}
                </small>
              </span>
              <span>{formatRupiah(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <Separator className="my-6" />
        <dl className="flex flex-col gap-2 text-sm">
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
          <div className="mt-2 flex items-baseline justify-between">
            <dt>
              <strong>Total</strong>
            </dt>
            <dd>
              <strong className="font-serif text-3xl">{formatRupiah(order.grandTotal)}</strong>
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link className={buttonVariants({ size: "lg", className: "min-h-12" })} href={`/lacak-pesanan?orderNumber=${order.orderNumber}`}>
          <PackageCheckIcon data-icon="inline-start" />
          Lacak pesanan
        </Link>
        <Link className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-12" })} href="/shop">
          Kembali berbelanja
        </Link>
      </div>
    </div>
  )
}
