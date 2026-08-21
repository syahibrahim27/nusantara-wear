"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, SearchIcon, ShoppingBagIcon, UserRoundIcon } from "lucide-react"

import { useCartStore } from "@/features/cart/store"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  ["Baru", "/shop?sort=terbaru"],
  ["Koleksi", "/koleksi/ruang-teduh"],
  ["Pakaian", "/shop"],
  ["Cerita", "/tentang"],
  ["Journal", "/journal"],
]

export function SiteHeader() {
  const pathname = usePathname()
  const [solid, setSolid] = useState(false)
  const { cart, setOpen, refresh, hydrated } = useCartStore()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    addEventListener("scroll", onScroll, { passive: true })
    return () => removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!hydrated) void refresh()
  }, [hydrated, refresh])

  const count = cart.itemCount
  const isSolid = pathname !== "/" || solid

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-40 border-b border-transparent text-white transition-colors duration-500", isSolid && "border-border bg-background/95 text-foreground backdrop-blur-md")}>
        <div className="mx-auto grid h-18 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-7 lg:h-22 lg:px-10">
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama">
            {links.map(([label, href]) => (
              <Link className="eyebrow flex min-h-11 items-center hover:opacity-60" href={href} key={label}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Buka menu" />}>
                <MenuIcon />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="font-serif text-3xl">Menu</SheetTitle>
                  <SheetDescription>Jelajahi Nusantara Wear</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col px-4">
                  {links.map(([label, href], index) => (
                    <Link className="border-b py-5 font-serif text-3xl" href={href} key={label}>
                      <span className="mr-3 font-sans text-xs text-muted-foreground">0{index + 1}</span>
                      {label}
                    </Link>
                  ))}
                  <Link className="border-b py-5 font-serif text-3xl" href="/akun">
                    <span className="mr-3 font-sans text-xs text-muted-foreground">06</span>Akun
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <Link className="text-center font-serif text-2xl font-semibold tracking-[-.05em] sm:text-3xl" href="/" aria-label="Nusantara Wear, beranda">
            NUSANTARA <i className="font-normal">wear</i>
          </Link>
          <div className="flex justify-end gap-1">
            <Link className="grid size-11 place-items-center" href="/cari" aria-label="Cari">
              <SearchIcon className="size-5" />
            </Link>
            <Link className="hidden size-11 place-items-center sm:grid" href="/akun" aria-label="Akun">
              <UserRoundIcon className="size-5" />
            </Link>
            <Button className="relative" variant="ghost" size="icon-lg" onClick={() => setOpen(true)} aria-label={`Tas belanja, ${count} barang`}>
              <ShoppingBagIcon />
              {count > 0 && <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{count}</span>}
            </Button>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  )
}
