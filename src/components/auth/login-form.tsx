"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { useCartStore } from "@/features/cart/store"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const merge = useCartStore((state) => state.merge)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setError("")
    const callbackUrl = params.get("callbackUrl") ?? "/akun"
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })

    if (!result?.ok) {
      setPending(false)
      setError(result?.error === "RATE_LIMITED" ? "Terlalu banyak percobaan. Coba lagi sebentar lagi." : "Email atau password tidak cocok.")
      return
    }

    // Cart tamu digabung ke cart akun sebelum berpindah halaman.
    await merge()
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form action={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue="demo@nusantarawear.test" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="current-password" defaultValue="Demo123!" required />
          <FieldDescription>
            Demo customer <code>demo@nusantarawear.test / Demo123!</code> · admin <code>admin@nusantarawear.test / Admin123!</code>
          </FieldDescription>
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Button className="min-h-12 w-full" size="lg" type="submit" disabled={pending}>
          {pending ? "Memeriksa..." : "Masuk"}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </FieldGroup>
    </form>
  )
}
