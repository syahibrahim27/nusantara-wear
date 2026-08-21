import { LocalStorageProvider } from "@/lib/storage/provider"
import type { StorageProvider } from "@/lib/storage/provider"

/** `STORAGE_PROVIDER=local` menyimpan referensi aset lokal; adapter object storage memakai interface sama. */
function resolveProvider(): StorageProvider {
  const configured = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase()
  if (configured !== "local") console.warn(`[storage] provider "${configured}" belum tersedia, memakai LocalStorageProvider.`)
  return new LocalStorageProvider()
}

const globalForStorage = globalThis as typeof globalThis & { __NW_STORAGE__?: StorageProvider }
export const storageProvider: StorageProvider = (globalForStorage.__NW_STORAGE__ ??= resolveProvider())
export type { StorageProvider, StoredObject } from "@/lib/storage/provider"
