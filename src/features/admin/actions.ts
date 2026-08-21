"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireStaff } from "@/lib/auth/session"
import { DomainError, fieldErrorsOf } from "@/lib/http"
import { inventoryAdjustmentSchema, journalAdminSchema, orderStatusSchema, productAdminSchema, promotionAdminSchema } from "@/lib/validation/schemas"
import type { OrderStatus } from "@/lib/commerce"
import { archiveProduct, createProduct, createPromotion, invalidateCatalog, recordAudit, saveJournalPost, togglePromotion, updateProduct } from "@/server/services/admin-service"
import { adjustInventory } from "@/server/services/inventory-service"
import { updateOrderStatus } from "@/server/services/order-service"
import type { AdminActionState } from "@/features/admin/action-state"


const fail = (message: string, fieldErrors?: Record<string, string[]>): AdminActionState => ({ status: "error", message, fieldErrors })
const failed = (caught: unknown, fallback: string): AdminActionState =>
  caught instanceof DomainError ? fail(caught.message, caught.fieldErrors) : fail(fallback)

export async function saveProductAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  const parsed = productAdminSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail("Periksa kembali data produk.", fieldErrorsOf(parsed.error))

  const productId = String(formData.get("productId") ?? "")
  try {
    if (productId) await updateProduct(actor, productId, parsed.data)
    else await createProduct(actor, parsed.data)
  } catch (caught) {
    return failed(caught, "Produk gagal disimpan.")
  }
  revalidatePath("/admin/produk")
  if (!productId) redirect("/admin/produk")
  return { status: "success", message: "Produk tersimpan dan cache katalog diperbarui." }
}

export async function archiveProductAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  try {
    await archiveProduct(actor, String(formData.get("productId")))
  } catch (caught) {
    return failed(caught, "Produk gagal diarsipkan.")
  }
  revalidatePath("/admin/produk")
  return { status: "success", message: "Produk diarsipkan dan tidak lagi tampil di storefront." }
}

export async function adjustInventoryAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  const parsed = inventoryAdjustmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail("Penyesuaian stok tidak valid.", fieldErrorsOf(parsed.error))

  try {
    const result = await adjustInventory({ ...parsed.data, actorId: actor.id })
    await recordAudit(actor, "inventory.adjust", "Inventory", parsed.data.variantId, `${parsed.data.type} ${parsed.data.quantity}: ${parsed.data.reason}`)
    invalidateCatalog()
    revalidatePath("/admin/inventory")
    return { status: "success", message: `Stok diperbarui menjadi ${result.onHand}.` }
  } catch (caught) {
    return failed(caught, "Stok gagal disesuaikan.")
  }
}

export async function updateOrderStatusAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  const parsed = orderStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail("Status pesanan tidak valid.", fieldErrorsOf(parsed.error))

  try {
    await updateOrderStatus(parsed.data.orderId, parsed.data.status as OrderStatus, parsed.data.trackingNumber || undefined)
    await recordAudit(actor, "order.status", "Order", parsed.data.orderId, `Status menjadi ${parsed.data.status}`)
  } catch (caught) {
    return failed(caught, "Status pesanan gagal diperbarui.")
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${parsed.data.orderId}`)
  return { status: "success", message: `Status pesanan menjadi ${parsed.data.status}.` }
}

export async function createPromotionAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  const raw = Object.fromEntries(formData)
  const parsed = promotionAdminSchema.safeParse({ ...raw, isActive: formData.get("isActive") === "on" })
  if (!parsed.success) return fail("Periksa kembali data promo.", fieldErrorsOf(parsed.error))

  try {
    await createPromotion(actor, parsed.data)
  } catch (caught) {
    return failed(caught, "Promo gagal dibuat.")
  }
  revalidatePath("/admin/promo")
  return { status: "success", message: `Promo ${parsed.data.code} aktif dan siap dipakai.` }
}

export async function togglePromotionAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  try {
    await togglePromotion(actor, String(formData.get("promotionId")), formData.get("isActive") === "true")
  } catch (caught) {
    return failed(caught, "Status promo gagal diubah.")
  }
  revalidatePath("/admin/promo")
  return { status: "success", message: "Status promo diperbarui." }
}

export async function saveJournalAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireStaff()
  const parsed = journalAdminSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail("Artikel belum lengkap.", fieldErrorsOf(parsed.error))

  const postId = String(formData.get("postId") ?? "")
  try {
    await saveJournalPost(actor, parsed.data, postId || undefined)
  } catch (caught) {
    return failed(caught, "Artikel gagal disimpan.")
  }
  revalidatePath("/admin/journal")
  if (!postId) redirect("/admin/journal")
  return { status: "success", message: parsed.data.status === "PUBLISHED" ? "Artikel diterbitkan." : "Artikel tersimpan sebagai draf." }
}
