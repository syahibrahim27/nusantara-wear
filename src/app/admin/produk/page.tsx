import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { formatDateID, formatRupiah } from "@/lib/commerce"
import { listAdminProducts } from "@/server/services/admin-service"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArchiveProductButton } from "@/components/admin/archive-product-button"

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const products = await listAdminProducts(q)

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-primary">Studio Console</p>
          <h1 className="display mt-3 text-6xl">Produk</h1>
          <p className="mt-4 text-sm text-muted-foreground">Kelola katalog, harga, status publikasi, dan metadata SEO.</p>
        </div>
        <Link className={buttonVariants({ className: "min-h-11" })} href="/admin/produk/baru">
          <PlusIcon data-icon="inline-start" />
          Tambah produk
        </Link>
      </div>

      <form className="mt-8 flex gap-2" action="/admin/produk">
        <input className="min-h-11 flex-1 border bg-background px-3 text-sm" name="q" defaultValue={q ?? ""} placeholder="Cari nama produk" aria-label="Cari produk" />
        <button className={buttonVariants({ variant: "outline", className: "min-h-11" })} type="submit">
          Cari
        </button>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">{products.length} produk</CardTitle>
          <CardDescription>Perubahan produk memicu invalidasi cache halaman katalog dan PDP.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Tidak ada produk yang cocok.</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/produk/${product.id}`}>{product.name}</Link>
                      <small className="block text-muted-foreground">{product.category.name}</small>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>{product.status}</Badge>
                    </TableCell>
                    <TableCell>{formatRupiah(product.basePrice)}</TableCell>
                    <TableCell>{product._count.variants}</TableCell>
                    <TableCell>{formatDateID(product.updatedAt)}</TableCell>
                    <TableCell>{product.status !== "ARCHIVED" && <ArchiveProductButton productId={product.id} />}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
