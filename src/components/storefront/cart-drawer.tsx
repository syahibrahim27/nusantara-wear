"use client"

import Image from "next/image"
import Link from "next/link"
import { BookmarkIcon, MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react"

import { useCartStore } from "@/features/cart/store"
import { formatRupiah, variantLabel } from "@/lib/commerce"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

export function CartDrawer() {
  const { isOpen, setOpen, cart, isLoading, hydrated, isMutating, update, remove, saveForLater } = useCartStore()

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-3xl">Tas Belanja</SheetTitle>
          <SheetDescription>
            {cart.itemCount > 0 ? `${cart.itemCount} barang tersimpan di tas Anda.` : "Tas tersimpan aman di server, bahkan tanpa akun."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">
          {isLoading && !hydrated ? (
            <div className="flex flex-col gap-4" aria-hidden>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : cart.items.length === 0 ? (
            <Empty className="my-auto">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBagIcon />
                </EmptyMedia>
                <EmptyTitle>Tas Anda masih lapang</EmptyTitle>
                <EmptyDescription>Temukan potongan yang ingin hidup lebih lama bersama Anda.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            cart.items.map((line) => (
              <article className="grid grid-cols-[92px_1fr] gap-4 border-b pb-5" key={line.id}>
                <Image className="h-30 w-full object-cover" src={line.imageUrl} alt={line.name} width={184} height={240} />
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="font-serif text-xl leading-none">{line.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{variantLabel(line.colorName, line.size)}</p>
                  </div>
                  <p className="text-sm">{formatRupiah(line.lineTotal)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex min-h-11 items-center border">
                      <button className="grid size-11 place-items-center disabled:opacity-40" aria-label={`Kurangi jumlah ${line.name}`} disabled={isMutating} onClick={() => update(line.id, line.quantity - 1)}>
                        <MinusIcon className="size-4" />
                      </button>
                      <span className="min-w-6 text-center text-sm">{line.quantity}</span>
                      <button className="grid size-11 place-items-center disabled:opacity-40" aria-label={`Tambah jumlah ${line.name}`} disabled={isMutating || line.quantity >= line.available} onClick={() => update(line.id, line.quantity + 1)}>
                        <PlusIcon className="size-4" />
                      </button>
                    </div>
                    <div className="flex">
                      <button className="grid size-11 place-items-center" aria-label={`Simpan ${line.name} untuk nanti`} disabled={isMutating} onClick={() => saveForLater(line.id, true)}>
                        <BookmarkIcon className="size-4" />
                      </button>
                      <button className="grid size-11 place-items-center" aria-label={`Hapus ${line.name}`} disabled={isMutating} onClick={() => remove(line.id)}>
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}

          {cart.savedItems.length > 0 && (
            <section aria-label="Disimpan untuk nanti">
              <h3 className="eyebrow text-muted-foreground">Disimpan untuk nanti</h3>
              {cart.savedItems.map((line) => (
                <div className="flex items-center justify-between gap-3 border-b py-3 text-sm" key={line.id}>
                  <span>
                    {line.name}
                    <small className="block text-muted-foreground">{variantLabel(line.colorName, line.size)}</small>
                  </span>
                  <button className="min-h-11 border-b text-xs" disabled={isMutating} onClick={() => saveForLater(line.id, false)}>
                    Pindahkan ke tas
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>

        {cart.items.length > 0 && (
          <SheetFooter>
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Subtotal</span>
              <strong className="font-serif text-2xl">{formatRupiah(cart.subtotal)}</strong>
            </div>
            <p className="text-xs text-muted-foreground">Ongkir dan promo dihitung ulang di server saat checkout.</p>
            <Link onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "min-h-12 w-full" })} href="/checkout">
              Lanjut checkout
            </Link>
            <Link onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-12 w-full" })} href="/cart">
              Lihat tas lengkap
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
