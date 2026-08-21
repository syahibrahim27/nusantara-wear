import Image from "next/image"
import Link from "next/link"

import { formatRupiah } from "@/lib/commerce"
import { BLUR_PLACEHOLDER } from "@/server/services/catalog-service"
import type { ProductSummary } from "@/server/services/catalog-service"
import { Badge } from "@/components/ui/badge"
import { WishlistButton } from "@/components/storefront/wishlist-button"

export function ProductCard({ product, index = 0 }: { product: ProductSummary; index?: number }) {
  return (
    <article className="group relative min-w-0">
      <Link className="image-reveal relative block overflow-hidden bg-muted" href={`/produk/${product.slug}`}>
        <Image
          className="aspect-[3/4] w-full object-cover"
          src={product.image.url}
          alt={product.image.alt}
          width={720}
          height={960}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading={index < 4 ? "eager" : "lazy"}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
        {product.compareAtPrice && (
          <Badge className="absolute left-3 top-3" variant="secondary">
            Harga khusus
          </Badge>
        )}
        {!product.inStock && (
          <Badge className="absolute left-3 bottom-3" variant="outline">
            Stok habis
          </Badge>
        )}
        <div className="absolute inset-x-3 bottom-3 translate-y-4 bg-background/92 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[.15em] opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          Lihat potongan
        </div>
      </Link>
      <WishlistButton
        productId={product.id}
        productName={product.name}
        className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
      />
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <Link className="font-serif text-xl leading-none sm:text-2xl" href={`/produk/${product.slug}`}>
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.collectionName ? `${product.collectionName} · ` : ""}
            {product.categoryName}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p>{formatRupiah(product.price)}</p>
          {product.compareAtPrice && <p className="text-muted-foreground line-through">{formatRupiah(product.compareAtPrice)}</p>}
        </div>
      </div>
    </article>
  )
}
