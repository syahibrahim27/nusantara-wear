import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { HeartIcon } from "lucide-react"

import { formatRupiah } from "@/lib/commerce"
import { requireUserPage } from "@/lib/auth/session"
import { listWishlist } from "@/server/services/account-service"
import { toggleWishlistAction } from "@/features/account/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export const metadata: Metadata = { title: "Wishlist saya" }

export default async function WishlistPage() {
  const user = await requireUserPage("/akun/wishlist")
  const items = await listWishlist(user.id)

  return (
    <section>
      <p className="eyebrow text-primary">Disimpan</p>
      <h1 className="display mt-3 text-6xl">Wishlist.</h1>

      {items.length === 0 ? (
        <Empty className="mt-10 border py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada yang disimpan</EmptyTitle>
            <EmptyDescription>Tekan ikon hati pada produk untuk menyimpannya di sini.</EmptyDescription>
          </EmptyHeader>
          <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href="/shop">
            Jelajahi koleksi
          </Link>
        </Empty>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <article className="border" key={item.id}>
              <Link className="image-reveal relative block aspect-[3/4] overflow-hidden" href={`/produk/${item.product.slug}`}>
                <Image className="object-cover" src={item.product.images[0]?.url ?? "/images/products/01.jpg"} alt={item.product.name} fill sizes="(max-width:640px)50vw,25vw" />
              </Link>
              <div className="p-4">
                <Link className="font-serif text-2xl" href={`/produk/${item.product.slug}`}>
                  {item.product.name}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{item.product.category.name}</p>
                <p className="mt-2 text-xs">{formatRupiah(item.product.basePrice)}</p>
                <form action={toggleWishlistAction}>
                  <input type="hidden" name="productId" value={item.productId} />
                  <Button className="mt-4" variant="ghost" size="sm" type="submit">
                    Hapus dari wishlist
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
