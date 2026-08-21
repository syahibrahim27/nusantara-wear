"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { useCartStore } from "@/features/cart/store"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function RegisterForm() {
  const router = useRouter()
  const merge = useCartStore((state) => state.merge)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setError("")
    setFieldErrors({})
    const payload = { name: formData.get("name"), email: formData.get("email"), password: formData.get("password") }

    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setPending(false)
      setFieldErrors(body?.fieldErrors ?? {})
      setError(body?.message ?? "Pendaftaran belum berhasil.")
      return
    }

    const result = await signIn("credentials", { email: payload.email, password: payload.password, redirect: false })
    if (!result?.ok) {
      setPending(false)
      setError("Akun dibuat, tetapi masuk otomatis gagal. Silakan masuk manual.")
      return
    }
    await merge()
    router.push("/akun")
    router.refresh()
  }

  return (
    <form className="mt-9" action={submit}>
      <FieldGroup>
        <Field data-invalid={!!fieldErrors.name}>
          <FieldLabel htmlFor="name">Nama</FieldLabel>
          <Input id="name" name="name" autoComplete="name" required />
          {fieldErrors.name && <FieldError>{fieldErrors.name[0]}</FieldError>}
        </Field>
        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {fieldErrors.email && <FieldError>{fieldErrors.email[0]}</FieldError>}
        </Field>
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <FieldDescription>Minimal 8 karakter, memuat huruf dan angka.</FieldDescription>
          {fieldErrors.password && <FieldError>{fieldErrors.password[0]}</FieldError>}
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Button className="min-h-12" size="lg" type="submit" disabled={pending}>
          {pending ? "Membuat akun..." : "Daftar"}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </FieldGroup>
    </form>
  )
}
