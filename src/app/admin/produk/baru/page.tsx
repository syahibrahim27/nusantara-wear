import { getCategories } from "@/server/services/catalog-service"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">Produk baru</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Produk baru dibuat dengan satu gambar placeholder. Tambahkan variant melalui seed atau adaptor katalog sesuai kebutuhan produksi.
      </p>
      <ProductForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />
    </section>
  )
}
