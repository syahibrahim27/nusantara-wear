"use client"

import { useState } from "react"
import { ArrowUpRightIcon } from "lucide-react"

export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  async function submit(formData: FormData) {
    setStatus("pending")
    const response = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      setStatus("error")
      setMessage(body?.message ?? "Pendaftaran belum berhasil.")
      return
    }
    setStatus("done")
    setMessage("Terima kasih. Surat pertama akan tiba saat koleksi berikutnya siap.")
  }

  return (
    <div>
      <form className="mt-10 flex max-w-xl border-b pb-2" action={submit}>
        <label className="sr-only" htmlFor="footer-email">
          Email
        </label>
        <input
          id="footer-email"
          name="email"
          className="min-h-12 flex-1 bg-transparent outline-none placeholder:text-secondary-foreground/50"
          type="email"
          required
          placeholder="Alamat email Anda"
        />
        <button className="grid size-12 place-items-center" aria-label="Daftar newsletter" disabled={status === "pending"}>
          <ArrowUpRightIcon />
        </button>
      </form>
      <p aria-live="polite" className={status === "error" ? "mt-3 text-sm text-destructive" : "mt-3 text-sm opacity-70"}>
        {message}
      </p>
    </div>
  )
}
