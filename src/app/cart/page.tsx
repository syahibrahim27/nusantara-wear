import type { Metadata } from "next"
import { CartPageClient } from "@/components/commerce/cart-page-client"
export const metadata: Metadata = { title: "Tas belanja" }
export default function CartPage() { return <CartPageClient /> }
