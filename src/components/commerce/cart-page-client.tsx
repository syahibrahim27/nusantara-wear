"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookmarkIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { useCartStore } from "@/features/cart/store"
import { writePromoCookie } from "@/features/cart/promo-cookie"
import { formatRupiah, variantLabel } from "@/lib/commerce"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function CartPageClient() {
  const { cart, hydrated, isMutating, refresh, update, remove, saveForLater } = useCartStore()

  useEffect(() => {
    if (!hydrated) void refresh()
  }, [hydrated, refresh])

  function applyPromo(formData: FormData) {
    writePromoCookie(String(formData.get("promo") ?? ""))
    void refresh()
  }

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-[70svh] max-w-[1400px] px-5 pb-28 pt-36 sm:px-10" aria-busy>
        <Skeleton className="h-16 w-2/3" />
        <div className="mt-14 grid gap-16 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-[70svh] max-w-[1400px] px-5 pb-28 pt-36 sm:px-10">
      <p className="eyebrow text-primary">Tas belanja</p>
      <h1 className="display mt-4 text-6xl sm:text-8xl">Potongan pilihan Anda.</h1>

      {cart.items.length === 0 ? (
        <div className="mt-16 border-y py-20 text-center">
          <p className="font-serif text-4xl">Belum ada yang dibawa pulang.</p>
          <Link className={buttonVariants({ className: "mt-8 min-h-12", size: "lg" })} href="/shop">
            Jelajahi koleksi
          </Link>
        </div>
      ) : (
        <div className="mt-14 grid gap-16 lg:grid-cols-[1fr_380px]">
          <div>
            {cart.issues.length > 0 && (
              <Alert className="mb-8" variant="destructive">
                <AlertTitle>Stok berubah</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {cart.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {cart.items.map((line) => (
              <article className="grid grid-cols-[110px_1fr] gap-5 border-t py-6 sm:grid-cols-[160px_1fr_auto]" key={line.id}>
                <Image className="aspect-[3/4] w-full object-cover" src={line.imageUrl} alt={line.name} width={320} height={426} />
                <div>
                  <Link className="font-serif text-2xl sm:text-3xl" href={`/produk/${line.slug}`}>
                    {line.name}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {variantLabel(line.colorName, line.size)} · {line.sku}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="inline-flex min-h-11 items-center border">
                      <button className="grid size-11 place-items-center disabled:opacity-40" aria-label={`Kurangi ${line.name}`} disabled={isMutating} onClick={() => update(line.id, line.quantity - 1)}>
                        <MinusIcon className="size-4" />
                      </button>
                      <span className="min-w-8 text-center">{line.quantity}</span>
                      <button className="grid size-11 place-items-center disabled:opacity-40" aria-label={`Tambah ${line.name}`} disabled={isMutating || line.quantity >= line.available} onClick={() => update(line.id, line.quantity + 1)}>
                        <PlusIcon className="size-4" />
                      </button>
                    </div>
                    <Button variant="ghost" size="sm" disabled={isMutating} onClick={() => saveForLater(line.id, true)}>
                      <BookmarkIcon data-icon="inline-start" />
                      Simpan untuk nanti
                    </Button>
                  </div>
                </div>
                <div className="col-start-2 flex items-end justify-between sm:col-start-auto sm:flex-col">
                  <strong>{formatRupiah(line.lineTotal)}</strong>
                  <button className="grid size-11 place-items-center" aria-label={`Hapus ${line.name}`} disabled={isMutating} onClick={() => remove(line.id)}>
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </article>
            ))}

            {cart.savedItems.length > 0 && (
              <section className="mt-14" aria-labelledby="disimpan">
                <h2 className="font-serif text-3xl" id="disimpan">
                  Disimpan untuk nanti
                </h2>
                {cart.savedItems.map((line) => (
                  <div className="flex items-center justify-between gap-4 border-t py-5" key={line.id}>
                    <div>
                      <Link className="font-serif text-2xl" href={`/produk/${line.slug}`}>
                        {line.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{variantLabel(line.colorName, line.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={isMutating} onClick={() => saveForLater(line.id, false)}>
                        Pindahkan ke tas
                      </Button>
                      <button className="grid size-11 place-items-center" aria-label={`Hapus ${line.name}`} disabled={isMutating} onClick={() => remove(line.id)}>
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>

          <aside className="sticky top-28 h-fit bg-card p-6">
            <h2 className="font-serif text-3xl">Ringkasan</h2>
            <form className="mt-6" action={applyPromo}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="promo">Kode promo</FieldLabel>
                  <div className="flex gap-2">
                    <Input id="promo" name="promo" key={cart.promoCode ?? "kosong"} defaultValue={cart.promoCode ?? ""} placeholder="PERTAMA10" />
                    <Button type="submit" variant="outline">
                      Pakai
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
            {cart.promoMessage && <p className={cart.promoApplied ? "mt-3 text-xs text-primary" : "mt-3 text-xs text-destructive"}>{cart.promoMessage}</p>}

            <div className="mt-7 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(cart.subtotal)}</span>
              </div>
              {cart.discountTotal > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Diskon {cart.promoCode}</span>
                  <span>−{formatRupiah(cart.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimasi ongkir reguler</span>
                <span>{formatRupiah(cart.shippingTotal)}</span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between">
                <strong>Total</strong>
                <strong className="font-serif text-3xl">{formatRupiah(cart.grandTotal)}</strong>
              </div>
            </div>

            <Link className={buttonVariants({ className: "mt-7 min-h-12 w-full", size: "lg" })} href="/checkout">
              Lanjut checkout
            </Link>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Harga, promo, dan stok dihitung ulang di server saat checkout.</p>
          </aside>
        </div>
      )}
    </div>
  )
}
