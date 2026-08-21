import Link from "next/link"
import { PackageSearchIcon } from "lucide-react"

import type { CatalogQuery } from "@/lib/validation/schemas"
import { getCategories, getCollections, getFacets, searchCatalog } from "@/server/services/catalog-service"
import { ProductCard } from "@/components/storefront/product-card"
import { CatalogControls, DesktopFilters } from "@/components/storefront/catalog-controls"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { buttonVariants } from "@/components/ui/button"

export async function CatalogPage({
  title = "Semua potongan",
  eyebrow = "Katalog / 2026",
  intro = "Potongan yang memberi ruang pada tubuh, dibuat dalam jumlah terbatas dan dirancang untuk dipakai melampaui musim.",
  query,
  basePath = "/shop",
}: {
  title?: string
  eyebrow?: string
  intro?: string
  query: CatalogQuery
  basePath?: string
}) {
  const [result, categories, collections, facetData] = await Promise.all([
    searchCatalog(query),
    getCategories(),
    getCollections(),
    getFacets(),
  ])

  const facets = {
    categories: categories.map((category) => ({ name: category.name, slug: category.slug })),
    collections: collections.map((collection) => ({ name: collection.name, slug: collection.slug })),
    colors: facetData.colors,
    sizes: facetData.sizes,
    minPrice: facetData.minPrice,
    maxPrice: facetData.maxPrice,
  }

  const pageHref = (page: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && key !== "page") params.set(key, String(value))
    }
    if (page > 1) params.set("page", String(page))
    return `${basePath}${params.size ? `?${params}` : ""}`
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-28 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <header className="grid gap-6 pb-14 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h1 className="display mt-4 text-6xl sm:text-8xl lg:text-9xl">{title}</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">{intro}</p>
      </header>

      <CatalogControls facets={facets} count={result.total} />

      <div className="mt-10 grid gap-7 lg:grid-cols-[220px_1fr]">
        <DesktopFilters facets={facets} />
        {result.products.length === 0 ? (
          <Empty className="border py-24">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearchIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada potongan yang cocok</EmptyTitle>
              <EmptyDescription>Coba longgarkan filter atau jelajahi seluruh katalog.</EmptyDescription>
            </EmptyHeader>
            <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href={basePath}>
              Lihat semua potongan
            </Link>
          </Empty>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
              {result.products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {result.pageCount > 1 && (
              <nav className="mt-16 flex items-center justify-between border-t pt-6" aria-label="Navigasi halaman">
                {result.page > 1 ? (
                  <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href={pageHref(result.page - 1)} rel="prev">
                    Halaman sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">
                  Halaman {result.page} dari {result.pageCount}
                </span>
                {result.page < result.pageCount ? (
                  <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href={pageHref(result.page + 1)} rel="next">
                    Halaman berikutnya
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
