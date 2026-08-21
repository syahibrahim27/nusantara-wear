import { Suspense } from "react"
import type { Metadata } from "next"
import { TrackingForm } from "@/components/commerce/tracking-form"
export const metadata: Metadata = { title: "Lacak pesanan" }
export default function TrackingPage() { return <div className="mx-auto grid min-h-[80svh] max-w-[1200px] items-center gap-12 px-5 pb-24 pt-36 sm:px-10 lg:grid-cols-2"><div><p className="eyebrow text-primary">Jejak perjalanan</p><h1 className="display mt-4 text-6xl sm:text-8xl">Di mana cerita Anda berada?</h1><p className="mt-6 max-w-md leading-7 text-muted-foreground">Masukkan nomor pesanan dan email yang sama saat checkout. Demi privasi, kami tidak menampilkan hasil bila salah satunya tidak cocok.</p></div><Suspense><TrackingForm /></Suspense></div> }
