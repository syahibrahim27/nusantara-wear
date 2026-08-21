import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { formatDateID } from "@/lib/commerce"
import { BLUR_PLACEHOLDER, getProductDetail, getRelatedProducts } from "@/server/services/catalog-service"
import { ProductDetailClient } from "@/components/storefront/product-detail-client"
import { ProductCard } from "@/components/storefront/product-card"

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductDetail(slug)
  if (!product) return { title: "Produk tidak ditemukan" }
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description,
    alternates: { canonical: `/produk/${product.slug}` },
    openGraph: { title: product.name, description: product.description, images: product.images.map((image) => image.url), type: "website" },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductDetail(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const inStock = product.variants.some((variant) => variant.available > 0)
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        image: product.images.map((image) => `${appUrl}${image.url}`),
        description: product.description,
        sku: product.variants[0]?.sku,
        brand: { "@type": "Brand", name: "Nusantara Wear" },
        category: product.categoryName,
        offers: {
          "@type": "Offer",
          url: `${appUrl}/produk/${product.slug}`,
          priceCurrency: "IDR",
          price: product.price,
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        ...(product.rating !== null
          ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: appUrl },
          { "@type": "ListItem", position: 2, name: "Belanja", item: `${appUrl}/shop` },
          { "@type": "ListItem", position: 3, name: product.categoryName, item: `${appUrl}/shop?kategori=${product.categorySlug}` },
          { "@type": "ListItem", position: 4, name: product.name, item: `${appUrl}/produk/${product.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 sm:px-8 lg:px-10 lg:pt-32">
        <nav className="mb-6 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/">Beranda</Link> / <Link href="/shop">Belanja</Link> /{" "}
          <Link href={`/shop?kategori=${product.categorySlug}`}>{product.categoryName}</Link> / <span aria-current="page">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.5fr_.75fr]">
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0" tabIndex={0} aria-label={`Galeri ${product.name}`}>
            {product.images.map((image, index) => (
              <div className="relative aspect-[3/4] min-w-[88vw] snap-center overflow-hidden bg-muted sm:min-w-0" key={`${image.url}-${index}`}>
                <Image
                  className="object-cover"
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width:640px) 88vw, 45vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>
            ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <ProductDetailClient product={product} />
          </aside>
        </div>

        {product.reviews.length > 0 && (
          <section className="mt-24 border-t pt-12" aria-labelledby="ulasan">
            <p className="eyebrow text-primary">Kata pemakainya</p>
            <h2 className="display mt-3 text-4xl sm:text-6xl" id="ulasan">
              Ulasan pelanggan
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {product.reviews.map((review) => (
                <article className="border p-6" key={review.id}>
                  <p className="text-sm text-primary" aria-label={`Rating ${review.rating} dari 5`}>
                    {"★".repeat(review.rating)}
                    <span className="text-muted-foreground">{"★".repeat(5 - review.rating)}</span>
                  </p>
                  <h3 className="mt-4 font-serif text-2xl">{review.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.body}</p>
                  <p className="mt-5 text-xs text-muted-foreground">
                    {review.author} · {formatDateID(review.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="border-t px-4 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <p className="eyebrow text-primary">Masih satu cerita</p>
            <h2 className="display mt-4 text-5xl sm:text-7xl">Potongan terkait</h2>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {related.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
    </>
  )
}
