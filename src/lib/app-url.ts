/**
 * Base URL publik aplikasi. `NEXT_PUBLIC_APP_URL` bisa terdaftar tapi bernilai string
 * kosong (lazim pada deploy pertama sebelum domain diketahui), jadi `||` dipakai agar
 * nilai kosong ikut jatuh ke fallback. Di Vercel domain deployment dipakai otomatis.
 */
export function appUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/+$/, "")
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim()
  if (vercel) return `https://${vercel}`
  return "http://localhost:3000"
}
