import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = { title: "Lupa password", robots: { index: false } }

export default function ForgotPage() {
  return (
    <div className="mx-auto flex min-h-[80svh] max-w-md items-center px-5 pb-20 pt-36">
      <div className="w-full">
        <p className="eyebrow text-primary">Pemulihan akses</p>
        <h1 className="display mt-3 text-6xl">Kembali ke ruang Anda.</h1>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
        <p className="mt-7 text-center text-sm">
          <Link className="border-b" href="/masuk">
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
