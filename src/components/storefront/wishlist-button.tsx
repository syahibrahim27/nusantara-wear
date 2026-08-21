"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { HeartIcon } from "lucide-react"
import { toast } from "sonner"

import { useWishlistStore } from "@/features/wishlist/store"
import { cn } from "@/lib/utils"

export function WishlistButton({
  productId,
  productName,
  className,
  labelled = false,
}: {
  productId: string
  productName: string
  className?: string
  labelled?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { ids, ensureLoaded, toggle } = useWishlistStore()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const saved = ids.includes(productId)

  async function onToggle() {
    setPending(true)
    const result = await toggle(productId)
    setPending(false)
    if (result === "unauthenticated") {
      toast.info("Masuk dulu untuk menyimpan potongan ini.")
      router.push(`/masuk?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    if (result === "error") {
      toast.error("Gagal memperbarui wishlist.")
      return
    }
    toast.success(result === "saved" ? `${productName} disimpan ke wishlist.` : `${productName} dihapus dari wishlist.`)
  }

  return (
    <button
      type="button"
      className={cn("grid min-h-11 min-w-11 place-items-center", labelled && "flex w-auto px-4", className)}
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${productName} dari wishlist` : `Simpan ${productName} ke wishlist`}
      disabled={pending}
      onClick={onToggle}
    >
      <HeartIcon className={cn("size-4", saved && "fill-primary text-primary")} />
      {labelled && <span className="ml-2 text-xs">{saved ? "Tersimpan" : "Simpan"}</span>}
    </button>
  )
}
