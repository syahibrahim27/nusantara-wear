"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { formatRupiah } from "@/lib/commerce"
import { Button } from "@/components/ui/button"

export type CarouselProduct = {
  id: string
  slug: string
  name: string
  price: number
  categoryName: string
  image: { url: string; alt: string }
}

/** Carousel digerakkan tombol dan keyboard; drag hanya pelengkap, bukan syarat. */
export function BestSellerCarousel({ products }: { products: CarouselProduct[] }) {
  const track = useRef<HTMLUListElement>(null)

  const scrollBy = (direction: 1 | -1) => {
    const element = track.current
    if (!element) return
    element.scrollBy({ left: direction * (element.clientWidth * 0.8), behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-primary">Paling dicari</p>
          <h2 className="display mt-4 text-6xl sm:text-8xl">
            Yang paling sering <i className="font-light">pulang</i>.
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="icon-lg" aria-label="Geser ke kiri" onClick={() => scrollBy(-1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-lg" aria-label="Geser ke kanan" onClick={() => scrollBy(1)}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <ul
        ref={track}
        className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
        tabIndex={0}
        aria-label="Produk terlaris"
      >
        {products.map((product, index) => (
          <li className="w-[70vw] shrink-0 snap-start sm:w-[38vw] lg:w-[24vw]" key={product.id}>
            <Link className="image-reveal relative block overflow-hidden bg-muted" href={`/produk/${product.slug}`}>
              <Image
                className="aspect-[3/4] w-full object-cover"
                src={product.image.url}
                alt={product.image.alt}
                width={640}
                height={853}
                sizes="(max-width:640px) 70vw, 24vw"
                loading={index < 2 ? "eager" : "lazy"}
              />
            </Link>
            <div className="flex items-start justify-between gap-3 pt-3">
              <div>
                <Link className="font-serif text-2xl leading-none" href={`/produk/${product.slug}`}>
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{product.categoryName}</p>
              </div>
              <p className="shrink-0 text-xs">{formatRupiah(product.price)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
