import type { Metadata, Viewport } from "next"
import "@fontsource-variable/cormorant-garamond"
import "@fontsource-variable/manrope"
import "./globals.css"

import { SiteFooter } from "@/components/storefront/site-footer"
import { SiteHeader } from "@/components/storefront/site-header"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Nusantara Wear — Ruang baru untuk cerita yang berakar", template: "%s — Nusantara Wear" },
  description: "Fashion lokal kontemporer dalam potongan tenang, material jujur, dan cerita yang berakar.",
  openGraph: { title: "Nusantara Wear", description: "Ruang baru untuk cerita yang berakar.", images: ["/images/campaign-akar.png"], locale: "id_ID", type: "website" },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = { colorScheme: "light", themeColor: "#F3EFE7" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#konten">Lewati ke konten</a>
        <SiteHeader />
        <main id="konten">{children}</main>
        <SiteFooter />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
