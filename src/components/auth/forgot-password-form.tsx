"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/** Satu halaman menangani dua tahap: minta tautan, lalu setel password dengan token. */
export function ForgotPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get("token")
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "reset">("idle")
  const [error, setError] = useState("")

  async function request(formData: FormData) {
    setStatus("pending")
    setError("")
    const response = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setStatus("idle")
      setError(body?.message ?? "Permintaan gagal diproses.")
      return
    }
    setStatus("sent")
  }

  async function reset(formData: FormData) {
    setStatus("pending")
    setError("")
    const response = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: formData.get("password") }),
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      setStatus("idle")
      setError(body?.message ?? "Token tidak valid atau sudah kedaluwarsa.")
      return
    }
    setStatus("reset")
    setTimeout(() => router.push("/masuk"), 1500)
  }

  if (token) {
    return (
      <form className="mt-9" action={reset}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">Password baru</FieldLabel>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            <FieldDescription>Minimal 8 karakter, memuat huruf dan angka.</FieldDescription>
          </Field>
          {error && <FieldError>{error}</FieldError>}
          {status === "reset" && (
            <Alert>
              <AlertTitle>Password diperbarui</AlertTitle>
              <AlertDescription>Anda akan diarahkan ke halaman masuk.</AlertDescription>
            </Alert>
          )}
          <Button className="min-h-12" size="lg" type="submit" disabled={status === "pending" || status === "reset"}>
            {status === "pending" ? "Menyimpan..." : "Simpan password baru"}
          </Button>
        </FieldGroup>
      </form>
    )
  }

  return (
    <form className="mt-9" action={request}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email akun</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          <FieldDescription>Mode demo mencetak tautan pemulihan melalui console email adapter di terminal server.</FieldDescription>
        </Field>
        {error && <FieldError>{error}</FieldError>}
        {status === "sent" && (
          <Alert>
            <AlertTitle>Tautan dikirim</AlertTitle>
            <AlertDescription>Bila email terdaftar, tautan pemulihan sudah dikirim dan berlaku 30 menit.</AlertDescription>
          </Alert>
        )}
        <Button className="min-h-12" size="lg" type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Mengirim..." : "Kirim tautan"}
        </Button>
      </FieldGroup>
    </form>
  )
}
