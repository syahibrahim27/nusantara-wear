import type { Metadata } from "next"
import { SearchIcon } from "lucide-react"

import { CatalogPage } from "@/components/storefront/catalog-page"
import { catalogQuerySchema } from "@/lib/validation/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"

export const metadata: Metadata = {
  title: "Pencarian",
  description: "Cari potongan Nusantara Wear berdasarkan nama, deskripsi, SKU, kategori, koleksi, atau tag.",
  robots: { index: false },
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const parsed = catalogQuerySchema.safeParse(raw)
  const query = parsed.success ? parsed.data : {}
  const q = query.q ?? ""

  return (
    <>
      <div className="mx-auto max-w-3xl px-5 pt-36">
        <form action="/cari" className="flex items-end gap-3" role="search">
          <Field>
            <FieldLabel htmlFor="q">Apa yang ingin Anda temukan?</FieldLabel>
            <Input className="min-h-12" id="q" name="q" defaultValue={q} placeholder="Nama, bahan, SKU, kategori..." />
          </Field>
          <Button className="min-h-12" size="lg" type="submit">
            <SearchIcon data-icon="inline-start" />
            Cari
          </Button>
        </form>
      </div>
      <CatalogPage
        title={q ? `Hasil untuk “${q}”` : "Pencarian"}
        eyebrow="Temukan potongan"
        intro="Pencarian mencakup nama, deskripsi, SKU, kategori, koleksi, dan tag produk."
        query={query}
        basePath="/cari"
      />
    </>
  )
}
