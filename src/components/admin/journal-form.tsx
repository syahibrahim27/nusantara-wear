"use client"

import { useActionState } from "react"

import { saveJournalAction } from "@/features/admin/actions"
import { idleAdminState } from "@/features/admin/action-state"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type JournalFormValues = {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  seoTitle: string
  seoDescription: string
}

export function JournalForm({ post }: { post?: JournalFormValues }) {
  const [state, action, pending] = useActionState(saveJournalAction, idleAdminState)
  const errors = state.fieldErrors ?? {}

  return (
    <form className="mt-8 max-w-3xl" action={action}>
      <input type="hidden" name="postId" value={post?.id ?? ""} />

      {state.status !== "idle" && (
        <Alert className="mb-6" variant={state.status === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.status === "error" ? "Belum tersimpan" : "Tersimpan"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="title">Judul</FieldLabel>
            <Input id="title" name="title" defaultValue={post?.title} required />
            {errors.title && <FieldError>{errors.title[0]}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.slug}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input id="slug" name="slug" defaultValue={post?.slug} placeholder="membaca-kain-sebagai-arsip" required />
            {errors.slug && <FieldError>{errors.slug[0]}</FieldError>}
          </Field>
        </div>

        <Field data-invalid={!!errors.excerpt}>
          <FieldLabel htmlFor="excerpt">Ringkasan</FieldLabel>
          <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt} required />
          {errors.excerpt && <FieldError>{errors.excerpt[0]}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.content}>
          <FieldLabel htmlFor="content">Isi artikel</FieldLabel>
          <Textarea id="content" name="content" rows={12} defaultValue={post?.content} required />
          <FieldDescription>Pisahkan paragraf dengan baris kosong. Awali baris dengan &gt; untuk kutipan besar.</FieldDescription>
          {errors.content && <FieldError>{errors.content[0]}</FieldError>}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.coverImage}>
            <FieldLabel htmlFor="coverImage">Gambar sampul</FieldLabel>
            <Input id="coverImage" name="coverImage" defaultValue={post?.coverImage ?? "/images/sculpture-tenun.png"} required />
            {errors.coverImage && <FieldError>{errors.coverImage[0]}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <select id="status" name="status" className="min-h-11 border bg-background px-3 text-sm" defaultValue={post?.status ?? "DRAFT"}>
              <option value="DRAFT">Draf</option>
              <option value="PUBLISHED">Terbit</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="seoTitle">SEO title</FieldLabel>
            <Input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={post?.seoTitle} />
          </Field>
          <Field>
            <FieldLabel htmlFor="seoDescription">SEO description</FieldLabel>
            <Input id="seoDescription" name="seoDescription" maxLength={160} defaultValue={post?.seoDescription} />
          </Field>
        </div>

        <Button className="min-h-11 w-fit" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : post ? "Simpan artikel" : "Buat artikel"}
        </Button>
      </FieldGroup>
    </form>
  )
}
