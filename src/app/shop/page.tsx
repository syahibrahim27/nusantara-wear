import type { Metadata } from "next"

import { CatalogPage } from "@/components/storefront/catalog-page"
import { catalogQuerySchema } from "@/lib/validation/schemas"

export const metadata: Metadata = {
  title: "Belanja semua koleksi",
  description: "Jelajahi katalog Nusantara Wear dan saring berdasarkan kategori, koleksi, warna, ukuran, harga, serta ketersediaan.",
  alternates: { canonical: "/shop" },
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const parsed = catalogQuerySchema.safeParse(raw)
  return <CatalogPage query={parsed.success ? parsed.data : {}} />
}
