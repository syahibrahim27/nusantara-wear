"use client"

import { create } from "zustand"

import { emptyCartView } from "@/features/cart/types"
import type { CartView } from "@/features/cart/types"

export type CartSnapshot = CartView

const emptySnapshot: CartSnapshot = emptyCartView()

type CartState = {
  cart: CartSnapshot
  isOpen: boolean
  isLoading: boolean
  isMutating: boolean
  hydrated: boolean
  error: string | null
  setOpen: (open: boolean) => void
  refresh: () => Promise<void>
  add: (variantId: string, quantity?: number) => Promise<boolean>
  update: (itemId: string, quantity: number) => Promise<void>
  saveForLater: (itemId: string, savedForLater: boolean) => Promise<void>
  remove: (itemId: string) => Promise<void>
  merge: () => Promise<void>
}

/**
 * Cart server adalah sumber kebenaran; store ini hanya menyimpan snapshot
 * terakhir agar header, drawer, dan halaman cart tetap sinkron.
 */
async function call(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.message ?? "Permintaan gagal diproses.")
  return body as CartSnapshot
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: emptySnapshot,
  isOpen: false,
  isLoading: false,
  isMutating: false,
  hydrated: false,
  error: null,
  setOpen: (isOpen) => set({ isOpen }),

  refresh: async () => {
    set({ isLoading: true })
    try {
      set({ cart: await call("/api/v1/cart"), error: null })
    } catch {
      set({ cart: emptySnapshot })
    } finally {
      set({ isLoading: false, hydrated: true })
    }
  },

  add: async (variantId, quantity = 1) => {
    set({ isMutating: true, error: null })
    try {
      set({ cart: await call("/api/v1/cart", { method: "POST", body: JSON.stringify({ variantId, quantity }) }), isOpen: true })
      return true
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Gagal menambahkan ke tas." })
      return false
    } finally {
      set({ isMutating: false })
    }
  },

  update: async (itemId, quantity) => {
    set({ isMutating: true, error: null })
    try {
      set({ cart: await call(`/api/v1/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }) })
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Gagal memperbarui tas." })
      await get().refresh()
    } finally {
      set({ isMutating: false })
    }
  },

  saveForLater: async (itemId, savedForLater) => {
    set({ isMutating: true, error: null })
    try {
      set({ cart: await call(`/api/v1/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ savedForLater }) }) })
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Gagal menyimpan item." })
    } finally {
      set({ isMutating: false })
    }
  },

  remove: async (itemId) => {
    set({ isMutating: true, error: null })
    try {
      set({ cart: await call(`/api/v1/cart/items/${itemId}`, { method: "DELETE" }) })
    } catch (caught) {
      set({ error: caught instanceof Error ? caught.message : "Gagal menghapus item." })
    } finally {
      set({ isMutating: false })
    }
  },

  merge: async () => {
    try {
      set({ cart: await call("/api/v1/cart/merge", { method: "POST" }) })
    } catch {
      await get().refresh()
    }
  },
}))
