"use client"

import { create } from "zustand"

type WishlistState = {
  ids: string[]
  loaded: boolean
  loading: boolean
  authenticated: boolean
  ensureLoaded: () => Promise<void>
  toggle: (productId: string) => Promise<"saved" | "removed" | "unauthenticated" | "error">
}

/**
 * Wishlist dimuat sekali per sesi browser sehingga halaman katalog dan PDP
 * tetap dapat dirender di server tanpa bergantung pada cookie pengguna.
 */
export const useWishlistStore = create<WishlistState>()((set, get) => ({
  ids: [],
  loaded: false,
  loading: false,
  authenticated: false,

  ensureLoaded: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const response = await fetch("/api/v1/wishlist")
      if (response.status === 401) {
        set({ authenticated: false, ids: [] })
        return
      }
      const body = (await response.json()) as { productId: string }[]
      set({ authenticated: true, ids: Array.isArray(body) ? body.map((item) => item.productId) : [] })
    } catch {
      set({ ids: [] })
    } finally {
      set({ loaded: true, loading: false })
    }
  },

  toggle: async (productId) => {
    const response = await fetch("/api/v1/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    })
    if (response.status === 401) return "unauthenticated"
    const body = await response.json().catch(() => null)
    if (!response.ok) return "error"
    const ids = get().ids.filter((id) => id !== productId)
    set({ authenticated: true, loaded: true, ids: body.saved ? [...ids, productId] : ids })
    return body.saved ? "saved" : "removed"
  },
}))
