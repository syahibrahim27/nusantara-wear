"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CreditCardIcon, MapPinIcon, PackageCheckIcon, UserRoundIcon } from "lucide-react"
import type { z } from "zod"

import { useCartStore } from "@/features/cart/store"
import { clearPromoCookie, readPromoCookie } from "@/features/cart/promo-cookie"
import { formatRupiah, PAYMENT_METHODS, SHIPPING_METHODS, variantLabel } from "@/lib/commerce"
import type { ShippingMethod } from "@/lib/commerce"
import { checkoutSchema } from "@/lib/validation/schemas"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type CheckoutData = z.infer<typeof checkoutSchema>
type Quote = { subtotal: number; discountTotal: number; shippingTotal: number; grandTotal: number; promoCode: string | null; promoApplied: boolean; promoMessage: string | null }

const steps = [
  { title: "Kontak", icon: UserRoundIcon, fields: ["email", "phone"] },
  { title: "Alamat", icon: MapPinIcon, fields: ["recipientName", "line1", "district", "city", "province", "postalCode"] },
  { title: "Kurir", icon: PackageCheckIcon, fields: ["shippingMethod"] },
  { title: "Pembayaran", icon: CreditCardIcon, fields: ["paymentMethod"] },
  { title: "Tinjau", icon: CheckIcon, fields: [] },
] as const

export function CheckoutClient({ defaults }: { defaults?: Partial<CheckoutData> }) {
  const router = useRouter()
  const { cart, hydrated, refresh } = useCartStore()
  const [step, setStep] = useState(0)
  const [pending, setPending] = useState(false)
  const [serverError, setServerError] = useState("")
  const [quote, setQuote] = useState<Quote | null>(null)
  const idempotencyKey = useRef<string | null>(null)

  const { register, control, handleSubmit, trigger, formState } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { shippingMethod: "REGULER", paymentMethod: "QRIS", promoCode: "", ...defaults },
  })
  const errors = formState.errors
  const values = useWatch({ control })
  const shippingMethod = (values.shippingMethod ?? "REGULER") as ShippingMethod

  useEffect(() => {
    if (!hydrated) void refresh()
  }, [hydrated, refresh])

  /** Quote tidak pernah dihitung di client: server yang menentukan total akhir. */
  async function fetchQuote(method: ShippingMethod) {
    const response = await fetch("/api/v1/checkout/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shippingMethod: method, promoCode: readPromoCookie() || null }),
    })
    setQuote(response.ok ? ((await response.json()) as Quote) : null)
  }

  const next = async () => {
    const fields = steps[step].fields as unknown as (keyof CheckoutData)[]
    if (fields.length === 0 || (await trigger(fields))) setStep((value) => Math.min(steps.length - 1, value + 1))
  }

  async function processCheckout(data: CheckoutData) {
    setPending(true)
    setServerError("")
    try {
      const key = (idempotencyKey.current ??= crypto.randomUUID())
      const orderResponse = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": key },
        body: JSON.stringify({ ...data, promoCode: readPromoCookie() || null }),
      })
      const order = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(order.message ?? "Pesanan tidak dapat dibuat.")

      const paymentResponse = await fetch("/api/v1/payments/mock/confirm", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": `${key}:confirm` },
        body: JSON.stringify({ orderNumber: order.orderNumber, outcome: "PAID" }),
      })
      const payment = await paymentResponse.json()
      clearPromoCookie()
      await refresh()

      if (!paymentResponse.ok || payment.paymentStatus !== "PAID") {
        router.push(`/checkout/gagal?order=${order.orderNumber}`)
        return
      }
      router.push(`/checkout/sukses/${order.orderNumber}`)
    } catch (caught) {
      setServerError(caught instanceof Error ? caught.message : "Checkout gagal diproses.")
      await refresh()
    } finally {
      setPending(false)
    }
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSubmit(processCheckout)(event)
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1300px] px-5 pb-28 pt-32 sm:px-10" aria-busy>
        <Skeleton className="h-14 w-1/2" />
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto min-h-[70svh] max-w-2xl px-5 pt-40 text-center">
        <h1 className="display text-6xl">Tas Anda kosong.</h1>
        <p className="mt-5 text-muted-foreground">Tambahkan potongan sebelum memulai checkout.</p>
        <Link className={buttonVariants({ className: "mt-8 min-h-12", size: "lg" })} href="/shop">
          Jelajahi koleksi
        </Link>
      </div>
    )
  }

  const summary = quote ?? { subtotal: cart.subtotal, discountTotal: cart.discountTotal, shippingTotal: cart.shippingTotal, grandTotal: cart.grandTotal, promoCode: cart.promoCode, promoApplied: cart.promoApplied, promoMessage: cart.promoMessage }

  return (
    <div className="mx-auto max-w-[1300px] px-5 pb-28 pt-32 sm:px-10">
      <div className="mb-12">
        <p className="eyebrow text-primary">Checkout aman · Mode demo</p>
        <h1 className="display mt-3 text-6xl sm:text-8xl">Satu langkah pada satu waktu.</h1>
        <Progress className="mt-8" value={(step + 1) * 20} />
        <ol className="mt-4 grid grid-cols-5 gap-2">
          {steps.map(({ title, icon: Icon }, index) => (
            <li className="text-center text-[10px] uppercase tracking-wider sm:text-xs" key={title} aria-current={index === step ? "step" : undefined}>
              <Icon className="mx-auto mb-2 size-4" />
              <span className={index === step ? "font-bold" : "text-muted-foreground"}>{title}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="min-h-[450px]" noValidate>
          {serverError && (
            <Alert className="mb-8" variant="destructive">
              <AlertTitle>Checkout belum dapat dilanjutkan</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {step === 0 && (
            <section>
              <h2 className="font-serif text-4xl">Di mana kami mengirim kabar?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tidak perlu membuat akun. Email dipakai untuk konfirmasi dan pelacakan.</p>
              <FieldGroup className="mt-8">
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
                  <FieldError errors={[errors.email]} />
                </Field>
                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="phone">Nomor telepon</FieldLabel>
                  <Input id="phone" inputMode="tel" autoComplete="tel" placeholder="0812xxxxxxx" aria-invalid={!!errors.phone} {...register("phone")} />
                  <FieldError errors={[errors.phone]} />
                </Field>
              </FieldGroup>
            </section>
          )}

          {step === 1 && (
            <section>
              <h2 className="font-serif text-4xl">Ke mana potongan ini pulang?</h2>
              <FieldGroup className="mt-8">
                <Field data-invalid={!!errors.recipientName}>
                  <FieldLabel htmlFor="recipientName">Nama penerima</FieldLabel>
                  <Input id="recipientName" autoComplete="name" aria-invalid={!!errors.recipientName} {...register("recipientName")} />
                  <FieldError errors={[errors.recipientName]} />
                </Field>
                <Field data-invalid={!!errors.line1}>
                  <FieldLabel htmlFor="line1">Alamat lengkap</FieldLabel>
                  <Input id="line1" autoComplete="address-line1" aria-invalid={!!errors.line1} {...register("line1")} />
                  <FieldError errors={[errors.line1]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="line2">Detail tambahan (opsional)</FieldLabel>
                  <Input id="line2" autoComplete="address-line2" {...register("line2")} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field data-invalid={!!errors.district}>
                    <FieldLabel htmlFor="district">Kecamatan</FieldLabel>
                    <Input id="district" aria-invalid={!!errors.district} {...register("district")} />
                    <FieldError errors={[errors.district]} />
                  </Field>
                  <Field data-invalid={!!errors.city}>
                    <FieldLabel htmlFor="city">Kota</FieldLabel>
                    <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} />
                    <FieldError errors={[errors.city]} />
                  </Field>
                  <Field data-invalid={!!errors.province}>
                    <FieldLabel htmlFor="province">Provinsi</FieldLabel>
                    <Input id="province" autoComplete="address-level1" aria-invalid={!!errors.province} {...register("province")} />
                    <FieldError errors={[errors.province]} />
                  </Field>
                  <Field data-invalid={!!errors.postalCode}>
                    <FieldLabel htmlFor="postalCode">Kode pos</FieldLabel>
                    <Input id="postalCode" inputMode="numeric" maxLength={5} autoComplete="postal-code" aria-invalid={!!errors.postalCode} {...register("postalCode")} />
                    <FieldError errors={[errors.postalCode]} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="notes">Catatan untuk kurir (opsional)</FieldLabel>
                  <Textarea id="notes" rows={3} {...register("notes")} />
                </Field>
              </FieldGroup>
            </section>
          )}

          {step === 2 && (
            <section>
              <FieldSet>
                <FieldLegend className="font-serif text-4xl">Pilih cara perjalanan.</FieldLegend>
                <FieldDescription>Estimasi dihitung dari Jakarta dan bersifat simulasi.</FieldDescription>
                <Controller
                  name="shippingMethod"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      className="mt-8"
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        void fetchQuote(value as ShippingMethod)
                      }}
                    >
                      {Object.entries(SHIPPING_METHODS).map(([value, method]) => (
                        <label className="grid min-h-20 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 border p-4 has-data-checked:border-primary" key={value}>
                          <RadioGroupItem value={value} />
                          <span>
                            <strong className="block">{method.label}</strong>
                            <span className="text-xs text-muted-foreground">{method.description}</span>
                          </span>
                          <span className="text-sm">{method.price === 0 ? "Gratis" : formatRupiah(method.price)}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
              </FieldSet>
            </section>
          )}

          {step === 3 && (
            <section>
              <FieldSet>
                <FieldLegend className="font-serif text-4xl">Pembayaran demo.</FieldLegend>
                <FieldDescription>Tidak ada uang sungguhan yang ditagih.</FieldDescription>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup className="mt-8" value={field.value} onValueChange={field.onChange}>
                      {Object.entries(PAYMENT_METHODS).map(([value, method]) => (
                        <label className="grid min-h-20 cursor-pointer grid-cols-[auto_1fr] items-center gap-4 border p-4 has-data-checked:border-primary" key={value}>
                          <RadioGroupItem value={value} />
                          <span>
                            <strong className="block">{method.label}</strong>
                            <span className="text-xs text-muted-foreground">{method.description}</span>
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
              </FieldSet>
            </section>
          )}

          {step === 4 && (
            <section>
              <h2 className="font-serif text-4xl">Periksa sekali lagi.</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="border p-5">
                  <p className="eyebrow text-muted-foreground">Kontak</p>
                  <p className="mt-3 text-sm">
                    {values.email}
                    <br />
                    {values.phone}
                  </p>
                </div>
                <div className="border p-5">
                  <p className="eyebrow text-muted-foreground">Dikirim ke</p>
                  <p className="mt-3 text-sm">
                    {values.recipientName}
                    <br />
                    {values.line1}
                    {values.line2 ? `, ${values.line2}` : ""}
                    <br />
                    {values.district}, {values.city}
                    <br />
                    {values.province} {values.postalCode}
                  </p>
                </div>
                <div className="border p-5">
                  <p className="eyebrow text-muted-foreground">Kurir</p>
                  <p className="mt-3 text-sm">{SHIPPING_METHODS[shippingMethod].label}</p>
                </div>
                <div className="border p-5">
                  <p className="eyebrow text-muted-foreground">Pembayaran</p>
                  <p className="mt-3 text-sm">{PAYMENT_METHODS[(values.paymentMethod ?? "QRIS") as keyof typeof PAYMENT_METHODS].label} · simulasi</p>
                </div>
              </div>
            </section>
          )}

          <div className="mt-12 flex justify-between">
            <Button type="button" variant="outline" size="lg" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
              <ChevronLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" size="lg" onClick={next}>
                Lanjut <ChevronRightIcon data-icon="inline-end" />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? "Memproses..." : "Konfirmasi & bayar demo"}
              </Button>
            )}
          </div>
        </form>

        <aside className="h-fit bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-3xl">Ringkasan pesanan</h2>
          <div className="mt-5 flex flex-col gap-3">
            {cart.items.map((line) => (
              <div className="flex justify-between gap-3 text-sm" key={line.id}>
                <span>
                  {line.name} × {line.quantity}
                  <small className="block text-muted-foreground">{variantLabel(line.colorName, line.size)}</small>
                </span>
                <span>{formatRupiah(line.lineTotal)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-5" />
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon {summary.promoApplied ? summary.promoCode : ""}</span>
              <span>−{formatRupiah(summary.discountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkir</span>
              <span>{formatRupiah(summary.shippingTotal)}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <strong>Total</strong>
              <strong className="font-serif text-3xl">{formatRupiah(summary.grandTotal)}</strong>
            </div>
          </div>
          {summary.promoMessage && <p className={summary.promoApplied ? "mt-4 text-xs text-primary" : "mt-4 text-xs text-destructive"}>{summary.promoMessage}</p>}
        </aside>
      </div>
    </div>
  )
}
