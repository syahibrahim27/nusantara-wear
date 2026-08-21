import Link from "next/link"

import { NewsletterForm } from "@/components/storefront/newsletter-form"

const columns = [
  ["Belanja", ["Semua Pakaian", "Koleksi Baru", "Pencarian", "Wishlist"]],
  ["Bantuan", ["Pengiriman", "Retur", "Lacak Pesanan", "Akun Saya"]],
  ["Tentang", ["Cerita Kami", "Journal", "Privasi", "Ketentuan"]],
]

const FOOTER_LINKS: Record<string, string> = {
  "Semua Pakaian": "/shop",
  "Koleksi Baru": "/shop?sort=terbaru",
  Pencarian: "/cari",
  Wishlist: "/akun/wishlist",
  Pengiriman: "/kebijakan/pengiriman",
  Retur: "/kebijakan/retur",
  "Lacak Pesanan": "/lacak-pesanan",
  "Akun Saya": "/akun",
  "Cerita Kami": "/tentang",
  Journal: "/journal",
  Privasi: "/privacy",
  Ketentuan: "/terms",
}
export function SiteFooter() {
  return <footer className="bg-secondary px-5 pb-7 pt-20 text-secondary-foreground sm:px-10 lg:pt-28">
    <div className="mx-auto max-w-[1500px]"><div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
      <div><p className="eyebrow opacity-70">Surat dari studio</p><h2 className="display mt-5 max-w-2xl text-5xl sm:text-7xl">Cerita baru, dikirim seperlunya.</h2><NewsletterForm /></div>
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">{columns.map(([heading, items]) => <div key={heading as string}><h3 className="eyebrow mb-5 opacity-60">{heading}</h3><ul className="flex flex-col gap-3">{(items as string[]).map((item) => <li key={item}><Link className="text-sm hover:opacity-60" href={FOOTER_LINKS[item] ?? "/shop"}>{item}</Link></li>)}</ul></div>)}</div>
    </div><div className="stitch my-16" /><div className="flex flex-col gap-4 text-[11px] uppercase tracking-[.14em] opacity-70 sm:flex-row sm:justify-between"><p>© 2026 Nusantara Wear — dibuat dekat, dipakai lama.</p><div className="flex gap-6"><Link href="/privacy">Privasi</Link><Link href="/terms">Ketentuan</Link><span>Jakarta · Indonesia</span></div></div></div>
  </footer>
}
