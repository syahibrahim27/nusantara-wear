import Image from "next/image"
import Link from "next/link"
import { ArrowDownIcon, ArrowRightIcon, LeafIcon, ScissorsIcon, SparklesIcon } from "lucide-react"

import { prisma } from "@/lib/db/prisma"
import { getBestSellers, getCategories, getCollections, getFeaturedProducts } from "@/server/services/catalog-service"
import { ProductCard } from "@/components/storefront/product-card"
import { BestSellerCarousel } from "@/components/storefront/best-seller-carousel"
import { buttonVariants } from "@/components/ui/button"
import { appUrl as resolveAppUrl } from "@/lib/app-url"

export const revalidate = 300

const CATEGORY_COPY: Record<string, string> = {
  atasan: "Dekat dengan kulit",
  bawahan: "Ruang untuk bergerak",
  outerwear: "Lapisan yang tinggal",
  aksesori: "Aksen dengan jejak",
}

export default async function HomePage() {
  const [featured, bestSellers, categories, collections, testimonials] = await Promise.all([
    getFeaturedProducts(4),
    getBestSellers(8),
    getCategories(),
    getCollections(),
    prisma.review.findMany({
      where: { status: "PUBLISHED", rating: { gte: 5 } },
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ])

  const heroCollection = collections.find((collection) => collection.isFeatured) ?? collections[0]
  const appUrl = resolveAppUrl()
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Nusantara Wear",
        url: appUrl,
        logo: `${appUrl}/images/campaign-akar.png`,
        slogan: "Ruang baru untuk cerita yang berakar.",
        address: { "@type": "PostalAddress", addressLocality: "Jakarta Selatan", addressCountry: "ID" },
      },
      {
        "@type": "WebSite",
        name: "Nusantara Wear",
        url: appUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${appUrl}/cari?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-foreground text-white">
        <Image
          className="absolute inset-0 size-full object-cover object-[68%_center]"
          src={heroCollection?.heroImage ?? "/images/campaign-akar.png"}
          alt="Dua model mengenakan koleksi Nusantara Wear di studio dengan instalasi tekstil"
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-black/10" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-5 pb-9 sm:px-10 sm:pb-12 lg:px-16 lg:pb-14">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5">Campaign 01 · {heroCollection?.name ?? "Ruang Teduh"}</p>
            <h1 className="display text-[clamp(4.2rem,10vw,10rem)]">
              Berakar,
              <br />
              <i className="font-light">bergerak.</i>
            </h1>
            <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Link className={buttonVariants({ size: "lg", className: "min-h-12 px-6" })} href={heroCollection ? `/koleksi/${heroCollection.slug}` : "/shop"}>
                Lihat koleksi <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <p className="max-w-xs text-sm leading-6 text-white/80">Potongan lapang, tenun yang bernapas, dan garis yang mengikuti ritme kota tropis.</p>
            </div>
          </div>
          <div className="absolute bottom-10 right-6 hidden items-center gap-3 text-xs uppercase tracking-[.18em] sm:flex lg:right-16">
            <span>Gulir untuk menjelajah</span>
            <ArrowDownIcon className="size-4" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-24 pt-16 sm:px-10 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="hidden lg:col-span-2 lg:block">
            <p className="vertical-word eyebrow h-40">01 · Koleksi pilihan</p>
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow text-primary">{heroCollection?.name ?? "Ruang Teduh"} / 2026</p>
            <h2 className="display mt-5 text-6xl sm:text-8xl lg:text-9xl">
              Di antara <i className="font-light text-primary">bayang</i> dan tubuh.
            </h2>
          </div>
          <div className="lg:col-span-3">
            <p className="leading-7 text-muted-foreground">{heroCollection?.description ?? "Terinspirasi dari ambang, selasar, dan jeda."}</p>
            <Link className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-foreground text-sm font-semibold" href={heroCollection ? `/koleksi/${heroCollection.slug}` : "/shop"}>
              Masuk ke {heroCollection?.name ?? "koleksi"} <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {featured.map((product, index) => (
            <div className={index === 1 ? "lg:mt-20" : index === 3 ? "lg:mt-10" : ""} key={product.id}>
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-12 sm:px-10 lg:pb-24">
        <BestSellerCarousel
          products={bestSellers.map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            categoryName: product.categoryName,
            image: { url: product.image.url, alt: product.image.alt },
          }))}
        />
      </section>

      <section className="overflow-hidden bg-primary py-24 text-primary-foreground lg:py-36">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 sm:px-10 lg:grid-cols-[1fr_1.25fr] lg:items-center">
          <div className="relative order-2 lg:order-1">
            <span className="absolute -left-3 -top-12 font-serif text-[10rem] leading-none opacity-10">“</span>
            <blockquote className="display max-w-xl text-5xl sm:text-7xl">
              Kami tidak mengejar musim. Kami merawat <i className="font-light">hubungan</i>.
            </blockquote>
            <p className="mt-8 max-w-md leading-7 text-primary-foreground/80">
              Antara tangan dan kain, pemakai dan pakaian, masa lalu dan hidup yang sedang berlangsung.
            </p>
            <Link className="mt-8 inline-flex min-h-11 items-center border-b border-current text-sm font-semibold" href="/tentang">
              Manifesto lengkap
            </Link>
          </div>
          <div className="float-fabric relative order-1 mx-auto max-w-[620px] lg:order-2">
            <div className="absolute -inset-4 border border-primary-foreground/20" />
            <Image
              className="relative aspect-[4/5] w-full object-cover"
              src="/images/sculpture-tenun.png"
              alt="Render 3D pita tenun yang melingkari cincin terracotta"
              width={1080}
              height={1350}
              loading="lazy"
              sizes="(max-width:1024px) 90vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-24 sm:px-10 lg:py-36">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow text-primary">Dari lemari Anda</p>
            <h2 className="display mt-4 text-6xl sm:text-8xl">
              Pilih <i className="font-light">ruang</i> Anda.
            </h2>
          </div>
          <span className="hidden font-serif text-8xl text-border lg:block">02</span>
        </div>
        <div className="mt-14 grid border-l border-t sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link className="group relative min-h-[420px] overflow-hidden border-b border-r" href={`/shop?kategori=${category.slug}`} key={category.id}>
              <Image
                className="absolute inset-0 size-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                src={category.image ?? `/images/products/0${(index % 8) + 1}.jpg`}
                alt={category.name}
                fill
                sizes="(max-width:640px)100vw,25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
              <span className="absolute left-5 top-5 text-xs text-white/70">0{index + 1}</span>
              <div className="absolute inset-x-5 bottom-6 text-white">
                <h3 className="font-serif text-4xl">{category.name}</h3>
                <p className="mt-1 text-sm text-white/70">{CATEGORY_COPY[category.slug] ?? category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary px-5 py-24 text-secondary-foreground sm:px-10 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <p className="eyebrow text-accent">Bukan sekadar bahan</p>
          <div className="mt-6 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <h2 className="display text-6xl sm:text-8xl">
              Dibuat pelan,
              <br />
              untuk hidup <i className="font-light text-accent">panjang.</i>
            </h2>
            <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-1">
              {[
                [LeafIcon, "Serat terpilih", "Linen lokal dan katun bersertifikat dipilih untuk iklim tropis."],
                [ScissorsIcon, "Potong terbatas", "Batch kecil menjaga kualitas dan mengurangi sisa produksi."],
                [SparklesIcon, "Tangan manusia", "Detail tenun dan finishing dikerjakan mitra perajin secara adil."],
              ].map(([Icon, title, body]) => {
                const IconComponent = Icon as typeof LeafIcon
                return (
                  <article className="grid grid-cols-[48px_1fr] gap-4 border-t border-secondary-foreground/25 pt-5" key={title as string}>
                    <IconComponent className="size-6 text-accent" />
                    <div>
                      <h3 className="font-serif text-2xl">{title as string}</h3>
                      <p className="mt-2 text-sm leading-6 text-secondary-foreground/70">{body as string}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-24 sm:px-10 lg:py-36">
        <div className="grid gap-3 md:grid-cols-12 md:grid-rows-[280px_280px]">
          {[
            ["08", "md:col-span-5 md:row-span-2"],
            ["02", "md:col-span-4"],
            ["06", "md:col-span-3 md:row-span-2"],
            ["04", "md:col-span-4"],
          ].map(([image, layout], index) => (
            <div className={`image-reveal relative min-h-80 overflow-hidden ${layout}`} key={image}>
              <Image className="size-full object-cover" src={`/images/products/${image}.jpg`} alt={`Lookbook Nusantara Wear tampilan ${index + 1}`} fill loading="lazy" sizes="(max-width:768px)100vw,40vw" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-5 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-primary">Lookbook / Volume 01</p>
            <h2 className="mt-2 font-serif text-4xl">Siluet untuk kota yang bergerak.</h2>
          </div>
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold" href="/journal">
            Lihat catatan studio <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="border-y py-20">
          <div className="mx-auto max-w-[1300px] px-5 text-center sm:px-10">
            <p className="eyebrow text-primary">Dipakai, lalu diceritakan</p>
            <blockquote className="display mx-auto mt-7 max-w-5xl text-5xl sm:text-7xl">“{testimonials[0].body}”</blockquote>
            <p className="mt-7 text-sm">
              {testimonials[0].user.name ?? "Pelanggan Nusantara"} · tentang {testimonials[0].product.name} · pembeli terverifikasi
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {testimonials.map((review) => (
                <article className="border p-5 text-left" key={review.id}>
                  <p className="text-sm text-primary" aria-label={`Rating ${review.rating} dari 5`}>
                    {"★".repeat(review.rating)}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl">{review.title}</h3>
                  <Link className="mt-2 inline-block text-xs text-muted-foreground" href={`/produk/${review.product.slug}`}>
                    {review.product.name}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-3 py-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 4, 7, 2, 5, 8].map((image) => (
            <div className="relative aspect-square overflow-hidden" key={image}>
              <Image className="object-cover transition duration-700 hover:scale-105" src={`/images/products/${String(image).padStart(2, "0")}.jpg`} alt="Inspirasi gaya komunitas Nusantara Wear" fill sizes="(max-width:640px)50vw,16vw" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-3 py-5">
          <p className="eyebrow">@nusantarawear · Kabar dari komunitas</p>
          <span className="text-xs text-muted-foreground">Galeri fiktif untuk demo</span>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
    </>
  )
}
