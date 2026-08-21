"use client"

import { useMemo, useState } from "react"
import { RulerIcon, ShoppingBagIcon, TruckIcon } from "lucide-react"
import { toast } from "sonner"

import { formatRupiah, SHIPPING_METHODS } from "@/lib/commerce"
import { useCartStore } from "@/features/cart/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { WishlistButton } from "@/components/storefront/wishlist-button"

export type ProductDetailProps = {
  id: string
  name: string
  price: number
  compareAtPrice: number | null
  description: string
  material: string
  modelSizing: string
  careInstructions: string
  collectionName: string | null
  rating: number | null
  reviewCount: number
  variants: { id: string; sku: string; colorName: string; colorHex: string; size: string; price: number; available: number; label: string }[]
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]

export function ProductDetailClient({ product }: { product: ProductDetailProps }) {
  const colors = useMemo(
    () => [...new Map(product.variants.map((variant) => [variant.colorName, variant])).values()],
    [product.variants],
  )
  const sizes = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.size))].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)),
    [product.variants],
  )

  const firstAvailable = product.variants.find((variant) => variant.available > 0) ?? product.variants[0]
  const [color, setColor] = useState(firstAvailable?.colorName ?? colors[0]?.colorName ?? "")
  const [size, setSize] = useState(firstAvailable?.size ?? sizes[0] ?? "")
  const { add, isMutating } = useCartStore()

  const variant = useMemo(
    () => product.variants.find((item) => item.colorName === color && item.size === size),
    [color, product.variants, size],
  )
  const price = variant?.price ?? product.price

  async function addToCart() {
    if (!variant || variant.available < 1) return
    const ok = await add(variant.id, 1)
    if (ok) toast.success(`${product.name} (${variant.label}) ditambahkan ke tas.`)
    else toast.error(useCartStore.getState().error ?? "Gagal menambahkan ke tas.")
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.collectionName && <p className="eyebrow text-primary">{product.collectionName}</p>}
            <h1 className="display mt-3 text-5xl sm:text-6xl">{product.name}</h1>
          </div>
          <WishlistButton productId={product.id} productName={product.name} className="border" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <strong className="text-lg">{formatRupiah(price)}</strong>
          {product.compareAtPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">{formatRupiah(product.compareAtPrice)}</span>
              <Badge variant="secondary">Hemat {formatRupiah(product.compareAtPrice - price)}</Badge>
            </>
          )}
          {product.rating !== null && (
            <span className="text-xs text-muted-foreground">
              ★ {product.rating.toFixed(1)} · {product.reviewCount} ulasan
            </span>
          )}
        </div>
        <p className="mt-5 leading-7 text-muted-foreground">{product.description}</p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>Warna — {color}</FieldLabel>
          <ToggleGroup value={[color]} onValueChange={(values) => values[0] && setColor(values[0])} spacing={2} aria-label="Pilih warna">
            {colors.map((item) => (
              <ToggleGroupItem className="min-h-11 min-w-20" variant="outline" value={item.colorName} key={item.colorName}>
                <span className="size-3 rounded-full border" style={{ backgroundColor: item.colorHex }} aria-hidden />
                {item.colorName}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Ukuran — {size}</FieldLabel>
            <Dialog>
              <DialogTrigger render={<Button variant="link" size="sm" />}>
                <RulerIcon data-icon="inline-start" />
                Panduan ukuran
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-3xl">Panduan ukuran</DialogTitle>
                  <DialogDescription>Ukuran badan dalam sentimeter. Jika di antara dua ukuran, pilih yang lebih besar untuk siluet lapang.</DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[24rem] border-collapse text-center text-sm">
                    <caption className="sr-only">Tabel ukuran badan Nusantara Wear</caption>
                    <thead>
                      <tr>
                        <th className="border p-3 text-left">Ukuran</th>
                        {["S", "M", "L", "XL"].map((item) => (
                          <th className="border p-3" key={item}>
                            {item}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Dada", "88", "94", "100", "108"],
                        ["Pinggang", "72", "78", "84", "92"],
                        ["Panjang", "66", "68", "70", "72"],
                      ].map(([label, ...values]) => (
                        <tr key={label}>
                          <th className="border p-3 text-left font-normal" scope="row">
                            {label}
                          </th>
                          {values.map((value, index) => (
                            <td className="border p-3" key={`${label}-${index}`}>
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ToggleGroup value={[size]} onValueChange={(values) => values[0] && setSize(values[0])} spacing={2} aria-label="Pilih ukuran">
            {sizes.map((item) => {
              const candidate = product.variants.find((entry) => entry.colorName === color && entry.size === item)
              const available = (candidate?.available ?? 0) > 0
              return (
                <ToggleGroupItem className="size-12" disabled={!available} variant="outline" value={item} key={item}>
                  {item}
                  <span className="sr-only">{available ? " tersedia" : " stok habis"}</span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          <FieldDescription>
            {variant?.available
              ? variant.available <= 3
                ? `Tinggal ${variant.available} potong untuk kombinasi ini.`
                : `Tersedia · SKU ${variant.sku}`
              : "Kombinasi ini sedang habis."}
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Button className="min-h-13 w-full" size="lg" onClick={addToCart} disabled={!variant?.available || isMutating}>
        <ShoppingBagIcon data-icon="inline-start" />
        {isMutating ? "Menambahkan..." : variant?.available ? "Tambahkan ke tas" : "Stok habis"}
      </Button>

      <div className="flex items-center gap-3 border-y py-4 text-sm">
        <TruckIcon className="size-5 text-primary" />
        <span>
          Estimasi tiba Jakarta: <strong>{SHIPPING_METHODS.REGULER.description}</strong> · {formatRupiah(SHIPPING_METHODS.REGULER.price)}
        </span>
      </div>

      <Accordion defaultValue={["bahan"]}>
        <AccordionItem value="bahan">
          <AccordionTrigger>Bahan & rasa</AccordionTrigger>
          <AccordionContent>
            {product.material}. {product.modelSizing}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="rawat">
          <AccordionTrigger>Perawatan</AccordionTrigger>
          <AccordionContent>{product.careInstructions}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="kirim">
          <AccordionTrigger>Pengiriman & retur</AccordionTrigger>
          <AccordionContent>
            Reguler {SHIPPING_METHODS.REGULER.description}, Express {SHIPPING_METHODS.EXPRESS.description}, atau ambil di studio tanpa biaya. Retur ukuran dalam 14
            hari sejak pesanan diterima selama produk belum dipakai dan label tetap terpasang.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
