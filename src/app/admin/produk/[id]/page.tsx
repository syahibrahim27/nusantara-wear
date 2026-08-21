import Link from "next/link"
import { notFound } from "next/navigation"

import { availableStock } from "@/lib/commerce"
import { getAdminProduct } from "@/server/services/admin-service"
import { getCategories } from "@/server/services/catalog-service"
import { ProductForm } from "@/components/admin/product-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, categories] = await Promise.all([getAdminProduct(id), getCategories()])
  if (!product) notFound()

  const details = (product.details ?? {}) as { material?: string; modelSizing?: string }

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">{product.name}</h1>
      <Link className="mt-3 inline-flex min-h-11 items-center border-b text-sm" href={`/produk/${product.slug}`}>
        Lihat di storefront
      </Link>

      <ProductForm
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          careInstructions: product.careInstructions,
          material: details.material ?? "",
          modelSizing: details.modelSizing ?? "",
          categoryId: product.categoryId,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
          status: product.status,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
        }}
      />

      <section className="mt-14" aria-labelledby="variant">
        <h2 className="font-serif text-3xl" id="variant">
          Variant &amp; stok
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Penyesuaian stok dilakukan di halaman inventory agar setiap perubahan tercatat.</p>
        <Table className="mt-5">
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Warna</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Tersedia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-medium">{variant.sku}</TableCell>
                <TableCell>{variant.colorName}</TableCell>
                <TableCell>{variant.size}</TableCell>
                <TableCell>{variant.inventory ? availableStock(variant.inventory) : 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </section>
  )
}
