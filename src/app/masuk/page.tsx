import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() { return <div className="grid min-h-[100svh] lg:grid-cols-2"><div className="relative hidden lg:block"><Image className="object-cover" src="/images/products/02.jpg" alt="Koleksi Nusantara Wear" fill priority sizes="50vw" /></div><div className="flex items-center px-5 pb-20 pt-32 sm:px-12 lg:px-20"><div className="mx-auto w-full max-w-md"><p className="eyebrow text-primary">Selamat datang kembali</p><h1 className="display mt-4 text-6xl">Masuk ke ruang Anda.</h1><p className="mb-9 mt-5 text-sm leading-6 text-muted-foreground">Lihat pesanan, alamat, dan potongan yang Anda simpan.</p><Suspense><LoginForm /></Suspense><p className="mt-8 text-center text-sm">Belum punya akun? <Link className="border-b" href="/daftar">Daftar</Link></p><p className="mt-3 text-center text-sm"><Link className="border-b" href="/lupa-password">Lupa password?</Link></p></div></div></div> }
