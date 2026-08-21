import { z } from "zod"

import { MAX_LINE_QUANTITY, SHIPPING_METHOD_VALUES } from "@/lib/commerce"

const trimmed = (min: number, message: string) => z.string().trim().min(min, message)

export const emailSchema = z.email("Masukkan email yang valid.").transform((value) => value.trim().toLowerCase())
export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .regex(/[A-Za-z]/, "Password harus memuat huruf.")
  .regex(/\d/, "Password harus memuat angka.")

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(8, "Password minimal 8 karakter.") })

export const registerSchema = z.object({
  name: trimmed(2, "Nama minimal 2 karakter."),
  email: emailSchema,
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({ email: emailSchema })
export const resetPasswordSchema = z.object({ token: trimmed(10, "Token tidak valid."), password: passwordSchema })

export const cartItemInputSchema = z.object({
  variantId: trimmed(1, "Variant wajib dipilih."),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY).default(1),
})
export const cartItemPatchSchema = z.object({
  quantity: z.number().int().min(0).max(MAX_LINE_QUANTITY).optional(),
  savedForLater: z.boolean().optional(),
})
export const cartMergeSchema = z.object({
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY) })).max(50).optional(),
})

export const shippingMethodSchema = z.enum(SHIPPING_METHOD_VALUES as [string, ...string[]])
export const paymentMethodSchema = z.enum(["VA", "QRIS", "CARD"])

export const quoteSchema = z.object({
  shippingMethod: shippingMethodSchema.default("REGULER"),
  promoCode: z.string().trim().max(32).optional().nullable(),
})

export const addressSchema = z.object({
  label: trimmed(2, "Beri label untuk alamat ini.").default("Rumah"),
  recipientName: trimmed(3, "Nama penerima wajib diisi."),
  phone: z.string().trim().regex(/^0\d{8,14}$/, "Nomor telepon harus diawali 0 dan 9–15 digit."),
  line1: trimmed(8, "Alamat perlu lebih lengkap."),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  district: trimmed(2, "Kecamatan wajib diisi."),
  city: trimmed(2, "Kota wajib diisi."),
  province: trimmed(2, "Provinsi wajib diisi."),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit."),
  isDefault: z.boolean().default(false),
})

export const checkoutSchema = z.object({
  email: emailSchema,
  phone: z.string().trim().regex(/^0\d{8,14}$/, "Nomor telepon harus diawali 0 dan 9–15 digit."),
  recipientName: trimmed(3, "Nama penerima wajib diisi."),
  line1: trimmed(8, "Alamat perlu lebih lengkap."),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  district: trimmed(2, "Kecamatan wajib diisi."),
  city: trimmed(2, "Kota wajib diisi."),
  province: trimmed(2, "Provinsi wajib diisi."),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit."),
  shippingMethod: shippingMethodSchema,
  paymentMethod: paymentMethodSchema,
  promoCode: z.string().trim().max(32).optional().nullable(),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
})

export const trackOrderSchema = z.object({
  orderNumber: trimmed(6, "Nomor pesanan tidak valid.").transform((value) => value.toUpperCase()),
  email: emailSchema,
})

export const paymentConfirmSchema = z.object({
  orderNumber: trimmed(6, "Nomor pesanan tidak valid.").transform((value) => value.toUpperCase()),
  outcome: z.enum(["PAID", "FAILED"]).default("PAID"),
})

export const productAdminSchema = z.object({
  name: trimmed(3, "Nama produk wajib diisi."),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  description: trimmed(20, "Deskripsi minimal 20 karakter."),
  careInstructions: trimmed(10, "Instruksi perawatan wajib diisi."),
  material: trimmed(3, "Material wajib diisi."),
  modelSizing: z.string().trim().max(160).optional().or(z.literal("")),
  categoryId: trimmed(1, "Kategori wajib dipilih."),
  basePrice: z.coerce.number<number>().int().min(1000, "Harga minimal Rp1.000."),
  compareAtPrice: z.coerce.number<number>().int().min(0).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
})

export const inventoryAdjustmentSchema = z.object({
  variantId: trimmed(1, "Variant wajib dipilih."),
  quantity: z.coerce.number<number>().int().refine((value) => value !== 0, "Jumlah penyesuaian tidak boleh nol."),
  type: z.enum(["RESTOCK", "RETURN", "ADJUSTMENT"]),
  reason: trimmed(4, "Alasan penyesuaian wajib diisi."),
})

export const orderStatusSchema = z.object({
  orderId: trimmed(1, "Order wajib dipilih."),
  status: z.enum(["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "REFUNDED"]),
  trackingNumber: z.string().trim().max(40).optional().or(z.literal("")),
})

export const promotionAdminSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,24}$/, "Kode 4–24 karakter huruf/angka."),
    name: trimmed(4, "Nama promo wajib diisi."),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
    value: z.coerce.number<number>().int().min(0),
    minimumSubtotal: z.coerce.number<number>().int().min(0).default(0),
    maxDiscount: z.coerce.number<number>().int().min(0).optional().nullable(),
    usageLimit: z.coerce.number<number>().int().min(1).optional().nullable(),
    perCustomerLimit: z.coerce.number<number>().int().min(1).default(1),
    startsAt: z.coerce.date<Date>(),
    endsAt: z.coerce.date<Date>(),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.endsAt > value.startsAt, { message: "Tanggal berakhir harus setelah tanggal mulai.", path: ["endsAt"] })
  .refine((value) => value.type !== "PERCENTAGE" || (value.value > 0 && value.value <= 100), { message: "Persentase harus 1–100.", path: ["value"] })

export const journalAdminSchema = z.object({
  title: trimmed(6, "Judul minimal 6 karakter."),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  excerpt: trimmed(20, "Ringkasan minimal 20 karakter."),
  content: trimmed(80, "Isi artikel minimal 80 karakter."),
  coverImage: trimmed(1, "Gambar sampul wajib diisi."),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
})

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  kategori: z.string().trim().optional(),
  koleksi: z.string().trim().optional(),
  ukuran: z.string().trim().optional(),
  warna: z.string().trim().optional(),
  hargaMin: z.coerce.number<number>().int().min(0).optional(),
  hargaMax: z.coerce.number<number>().int().min(0).optional(),
  stok: z.enum(["tersedia", "semua"]).optional(),
  sort: z.enum(["terbaru", "terlaris", "harga-rendah", "harga-tinggi"]).optional(),
  page: z.coerce.number<number>().int().min(1).max(500).optional(),
})

export type CatalogQuery = z.infer<typeof catalogQuerySchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type AddressInput = z.infer<typeof addressSchema>
