"use server"

import { revalidatePath } from "next/cache"

import { requireCustomer } from "@/lib/auth/session"
import { DomainError, fieldErrorsOf } from "@/lib/http"
import { addressSchema } from "@/lib/validation/schemas"
import { deleteAddress, saveAddress, toggleWishlist } from "@/server/services/account-service"
import type { ActionState } from "@/features/account/action-state"


export async function saveAddressAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCustomer()
  const parsed = addressSchema.safeParse({
    label: formData.get("label") || "Rumah",
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    district: formData.get("district"),
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    isDefault: formData.get("isDefault") === "on",
  })
  if (!parsed.success) return { status: "error", message: "Periksa kembali isian alamat.", fieldErrors: fieldErrorsOf(parsed.error) }

  const addressId = String(formData.get("addressId") ?? "") || undefined
  try {
    await saveAddress(user.id, parsed.data, addressId)
  } catch (caught) {
    return { status: "error", message: caught instanceof DomainError ? caught.message : "Alamat gagal disimpan." }
  }
  revalidatePath("/akun/alamat")
  return { status: "success", message: addressId ? "Alamat diperbarui." : "Alamat baru tersimpan." }
}

export async function deleteAddressAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCustomer()
  try {
    await deleteAddress(user.id, String(formData.get("addressId")))
  } catch (caught) {
    return { status: "error", message: caught instanceof DomainError ? caught.message : "Alamat gagal dihapus." }
  }
  revalidatePath("/akun/alamat")
  return { status: "success", message: "Alamat dihapus." }
}

export async function toggleWishlistAction(formData: FormData): Promise<void> {
  const user = await requireCustomer()
  await toggleWishlist(user.id, String(formData.get("productId")))
  revalidatePath("/akun/wishlist")
}
