export type CartLineView = {
  id: string
  variantId: string
  productId: string
  slug: string
  name: string
  imageUrl: string
  colorName: string
  size: string
  sku: string
  unitPrice: number
  quantity: number
  lineTotal: number
  available: number
  savedForLater: boolean
}

export type CartView = {
  id: string | null
  items: CartLineView[]
  savedItems: CartLineView[]
  itemCount: number
  subtotal: number
  discountTotal: number
  shippingTotal: number
  grandTotal: number
  promoCode: string | null
  promoApplied: boolean
  promoMessage: string | null
  issues: string[]
}

export const emptyCartView = (): CartView => ({
  id: null,
  items: [],
  savedItems: [],
  itemCount: 0,
  subtotal: 0,
  discountTotal: 0,
  shippingTotal: 0,
  grandTotal: 0,
  promoCode: null,
  promoApplied: false,
  promoMessage: null,
  issues: [],
})
