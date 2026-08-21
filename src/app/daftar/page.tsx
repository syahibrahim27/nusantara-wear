import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { currentUser } from "@/lib/auth/session"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Daftar akun", description: "Buat akun Nusantara Wear untuk menyimpan alamat, wishlist, dan riwayat pesanan." }
export const dynamic = "force-dynamic"

export default async function RegisterPage() {
  if (await currentUser()) redirect("/akun")

  return (
    <div className="mx-auto flex min-h-[85svh] max-w-md items-center px-5 pb-20 pt-36">
      <div className="w-full">
        <p className="eyebrow text-primary">Akun baru</p>
        <h1 className="display mt-3 text-6xl">Buat ruang Anda.</h1>
        <RegisterForm />
        <p className="mt-7 text-center text-sm">
          Sudah punya akun?{" "}
          <Link className="border-b" href="/masuk">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
