import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { RetryPayment } from "@/components/commerce/retry-payment"

export const metadata: Metadata = { title: "Pembayaran belum berhasil", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function FailurePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams

  return (
    <div className="mx-auto flex min-h-[80svh] max-w-2xl flex-col items-center justify-center px-5 pb-20 pt-32 text-center">
      <p className="eyebrow text-destructive">Pembayaran belum berhasil</p>
      <h1 className="display mt-4 text-7xl">Mari coba sekali lagi.</h1>
      <p className="mt-6 leading-7 text-muted-foreground">
        {order ? (
          <>
            Pesanan <strong className="text-foreground">{order}</strong> tetap tersimpan dan belum dibayar. Tidak ada stok yang dikurangi sampai pembayaran berhasil.
          </>
        ) : (
          "Pesanan tetap tersimpan sementara. Tidak ada stok yang dikurangi dan Anda dapat mencoba metode pembayaran demo lain."
        )}
      </p>

      {order ? (
        <RetryPayment orderNumber={order} />
      ) : (
        <Link className={buttonVariants({ size: "lg", className: "mt-8 min-h-12" })} href="/checkout">
          Kembali ke checkout
        </Link>
      )}

      <Link className={buttonVariants({ variant: "ghost", className: "mt-4 min-h-11" })} href="/lacak-pesanan">
        Lacak status pesanan
      </Link>
    </div>
  )
}
