"use client"

import { useActionState } from "react"

import { saveProductAction } from "@/features/admin/actions"
import { idleAdminState } from "@/features/admin/action-state"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type ProductFormValues = {
  id?: string
  name: string
  slug: string
  description: string
  careInstructions: string
  material: string
  modelSizing: string
  categoryId: string
  basePrice: number
  compareAtPrice: number | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  seoTitle: string
  seoDescription: string
}

export function ProductForm({ product, categories }: { product?: ProductFormValues; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveProductAction, idleAdminState)
  const errors = state.fieldErrors ?? {}

  return (
    <form className="mt-8 max-w-3xl" action={action}>
      <input type="hidden" name="productId" value={product?.id ?? ""} />

      {state.status !== "idle" && (
        <Alert className="mb-6" variant={state.status === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.status === "error" ? "Belum tersimpan" : "Tersimpan"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nama produk</FieldLabel>
            <Input id="name" name="name" defaultValue={product?.name} required />
            {errors.name && <FieldError>{errors.name[0]}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.slug}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input id="slug" name="slug" defaultValue={product?.slug} placeholder="sora-layered-shirt" required />
            {errors.slug && <FieldError>{errors.slug[0]}</FieldError>}
          </Field>
        </div>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
          <Textarea id="description" name="description" rows={4} defaultValue={product?.description} required />
          {errors.description && <FieldError>{errors.description[0]}</FieldError>}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.material}>
            <FieldLabel htmlFor="material">Material</FieldLabel>
            <Input id="material" name="material" defaultValue={product?.material} required />
            {errors.material && <FieldError>{errors.material[0]}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="modelSizing">Model sizing</FieldLabel>
            <Input id="modelSizing" name="modelSizing" defaultValue={product?.modelSizing} placeholder="Model 172 cm mengenakan ukuran M" />
          </Field>
        </div>

        <Field data-invalid={!!errors.careInstructions}>
          <FieldLabel htmlFor="careInstructions">Perawatan</FieldLabel>
          <Textarea id="careInstructions" name="careInstructions" rows={2} defaultValue={product?.careInstructions} required />
          {errors.careInstructions && <FieldError>{errors.careInstructions[0]}</FieldError>}
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel htmlFor="categoryId">Kategori</FieldLabel>
            <select id="categoryId" name="categoryId" className="min-h-11 border bg-background px-3 text-sm" defaultValue={product?.categoryId} required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <FieldError>{errors.categoryId[0]}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.basePrice}>
            <FieldLabel htmlFor="basePrice">Harga (rupiah)</FieldLabel>
            <Input id="basePrice" name="basePrice" type="number" min={1000} step={1000} defaultValue={product?.basePrice} required />
            {errors.basePrice && <FieldError>{errors.basePrice[0]}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="compareAtPrice">Harga coret (opsional)</FieldLabel>
            <Input id="compareAtPrice" name="compareAtPrice" type="number" min={0} step={1000} defaultValue={product?.compareAtPrice ?? ""} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <select id="status" name="status" className="min-h-11 border bg-background px-3 text-sm" defaultValue={product?.status ?? "DRAFT"}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Aktif</option>
            <option value="ARCHIVED">Arsip</option>
          </select>
          <FieldDescription>Hanya produk aktif yang tampil di storefront dan sitemap.</FieldDescription>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="seoTitle">SEO title</FieldLabel>
            <Input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={product?.seoTitle} />
          </Field>
          <Field>
            <FieldLabel htmlFor="seoDescription">SEO description</FieldLabel>
            <Input id="seoDescription" name="seoDescription" maxLength={160} defaultValue={product?.seoDescription} />
          </Field>
        </div>

        <Button className="min-h-11 w-fit" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : product ? "Simpan perubahan" : "Buat produk"}
        </Button>
      </FieldGroup>
    </form>
  )
}
