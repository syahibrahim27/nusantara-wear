import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() { return [{ source: "/(.*)", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://zentra.tarzex.com https://www.zentra.tarzex.com" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ] }] },
}

export default nextConfig
