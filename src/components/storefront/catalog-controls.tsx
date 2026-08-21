"use client"

import { useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontalIcon, XIcon } from "lucide-react"

import { formatRupiah } from "@/lib/commerce"
import { Button, buttonVariants } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type CatalogFacets = {
  categories: { name: string; slug: string }[]
  collections: { name: string; slug: string }[]
  colors: { name: string; hex: string }[]
  sizes: string[]
  minPrice: number
  maxPrice: number
}

const SORTS = [
  ["terbaru", "Terbaru"],
  ["terlaris", "Terlaris"],
  ["harga-rendah", "Harga terendah"],
  ["harga-tinggi", "Harga tertinggi"],
] as const

/** Seluruh filter dan sort disimpan di URL agar dapat dibagikan dan ramah SEO. */
function useCatalogParams() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value === null || value === "") next.delete(key)
      else next.set(key, value)
      next.delete("page")
      router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
    },
    [params, pathname, router],
  )

  const setParams = useCallback(
    (values: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      next.delete("page")
      router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
    },
    [params, pathname, router],
  )

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const current = (params.get(key) ?? "").split(",").filter(Boolean)
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
      setParam(key, next.join(","))
    },
    [params, setParam],
  )

  const has = useCallback((key: string, value: string) => (params.get(key) ?? "").split(",").filter(Boolean).includes(value), [params])

  return { params, pathname, setParam, setParams, toggleMulti, has }
}

function FilterPanel({ facets }: { facets: CatalogFacets }) {
  const { params, pathname, setParam, setParams, toggleMulti, has } = useCatalogParams()
  const activeCategory = params.get("kategori")
  const activeCollection = params.get("koleksi")

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="eyebrow mb-4">Kategori</h3>
        <div className="flex flex-col">
          <button className={cn("flex min-h-11 items-center justify-between border-b text-left text-sm", !activeCategory && "font-semibold")} onClick={() => setParam("kategori", null)}>
            Semua {!activeCategory && <span aria-hidden>●</span>}
          </button>
          {facets.categories.map((item) => (
            <button
              key={item.slug}
              className={cn("flex min-h-11 items-center justify-between border-b text-left text-sm", activeCategory === item.slug && "font-semibold")}
              aria-pressed={activeCategory === item.slug}
              onClick={() => setParam("kategori", activeCategory === item.slug ? null : item.slug)}
            >
              {item.name} {activeCategory === item.slug && <span aria-hidden>●</span>}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-4">Koleksi</h3>
        <div className="flex flex-col">
          {facets.collections.map((item) => (
            <button
              key={item.slug}
              className={cn("flex min-h-11 items-center justify-between border-b text-left text-sm", activeCollection === item.slug && "font-semibold")}
              aria-pressed={activeCollection === item.slug}
              onClick={() => setParam("koleksi", activeCollection === item.slug ? null : item.slug)}
            >
              {item.name} {activeCollection === item.slug && <span aria-hidden>●</span>}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-4">Ukuran</h3>
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((size) => (
            <button
              key={size}
              className={cn("min-h-11 min-w-11 border px-3 text-sm", has("ukuran", size) && "border-primary bg-primary text-primary-foreground")}
              aria-pressed={has("ukuran", size)}
              onClick={() => toggleMulti("ukuran", size)}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-4">Warna</h3>
        <div className="flex flex-col">
          {facets.colors.map((color) => (
            <button
              key={color.name}
              className={cn("flex min-h-11 items-center gap-3 border-b text-left text-sm", has("warna", color.name) && "font-semibold")}
              aria-pressed={has("warna", color.name)}
              onClick={() => toggleMulti("warna", color.name)}
            >
              <span className="size-3 rounded-full border" style={{ backgroundColor: color.hex }} aria-hidden />
              {color.name}
              {has("warna", color.name) && <span className="ml-auto" aria-hidden>●</span>}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-4">Harga</h3>
        <p className="text-sm text-muted-foreground">
          {formatRupiah(facets.minPrice)} — {formatRupiah(facets.maxPrice)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["Di bawah 800rb", { hargaMax: "800000" }],
            ["800rb–1,2jt", { hargaMin: "800000", hargaMax: "1200000" }],
            ["Di atas 1,2jt", { hargaMin: "1200000" }],
          ].map(([label, range]) => {
            const values = range as Record<string, string>
            const active = Object.entries(values).every(([key, value]) => params.get(key) === value)
            return (
              <button
                key={label as string}
                className={cn("min-h-11 border px-3 text-xs", active && "border-primary bg-primary text-primary-foreground")}
                aria-pressed={active}
                onClick={() => setParams({ hargaMin: active ? null : (values.hargaMin ?? null), hargaMax: active ? null : (values.hargaMax ?? null) })}
              >
                {label as string}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="eyebrow mb-4">Ketersediaan</h3>
        <button
          className={cn("flex min-h-11 w-full items-center justify-between border-b text-left text-sm", params.get("stok") === "tersedia" && "font-semibold")}
          aria-pressed={params.get("stok") === "tersedia"}
          onClick={() => setParam("stok", params.get("stok") === "tersedia" ? null : "tersedia")}
        >
          Hanya yang tersedia {params.get("stok") === "tersedia" && <span aria-hidden>●</span>}
        </button>
      </section>

      <Link className={buttonVariants({ variant: "outline", className: "min-h-11" })} href={pathname}>
        <XIcon data-icon="inline-start" />
        Bersihkan filter
      </Link>
    </div>
  )
}

export function CatalogControls({ facets, count }: { facets: CatalogFacets; count: number }) {
  const { params, setParam } = useCatalogParams()
  const activeSort = params.get("sort") ?? "terbaru"

  return (
    <div className="flex min-h-14 items-center justify-between border-y lg:justify-end">
      <div className="lg:hidden">
        <Drawer>
          <DrawerTrigger render={<Button variant="ghost" size="lg" />}>
            <SlidersHorizontalIcon data-icon="inline-start" />
            Filter
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="font-serif text-3xl">Saring koleksi</DrawerTitle>
              <DrawerDescription>Temukan potongan berdasarkan kategori, ukuran, warna, dan harga.</DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[65svh] overflow-y-auto px-5 pb-8">
              <FilterPanel facets={facets} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <span className="mr-auto text-xs text-muted-foreground lg:mr-8">{count} potongan</span>
      <Separator className="hidden h-5 lg:block" orientation="vertical" />
      <div className="flex items-center gap-1 pl-2 text-xs">
        <label className="hidden sm:inline" htmlFor="sort">
          Urutkan:
        </label>
        <select
          id="sort"
          className="min-h-11 border-0 bg-transparent px-2 text-xs focus-visible:outline-2 focus-visible:outline-ring"
          value={activeSort}
          onChange={(event) => setParam("sort", event.target.value)}
        >
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function DesktopFilters({ facets }: { facets: CatalogFacets }) {
  return (
    <aside className="sticky top-28 hidden self-start lg:block" aria-label="Filter katalog">
      <FilterPanel facets={facets} />
    </aside>
  )
}
