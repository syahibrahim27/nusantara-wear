const PROMO_COOKIE = "nw_promo"

/** Kode promo disimpan di cookie non-httpOnly agar server dapat memakainya pada quote. */
export function readPromoCookie() {
  if (typeof document === "undefined") return ""
  return (
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${PROMO_COOKIE}=`))
      ?.split("=")[1] ?? ""
  )
}

export function writePromoCookie(code: string) {
  if (typeof document === "undefined") return
  const normalized = code.trim().toUpperCase()
  document.cookie = normalized
    ? `${PROMO_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=86400; samesite=lax`
    : `${PROMO_COOKIE}=; path=/; max-age=0; samesite=lax`
}

export const clearPromoCookie = () => writePromoCookie("")
