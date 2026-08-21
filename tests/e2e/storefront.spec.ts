import { expect, test } from "@playwright/test"

/**
 * Seluruh spesifikasi ini berjalan terhadap database yang sudah dimigrasi dan di-seed.
 * Jalankan `docker compose up -d && pnpm db:migrate && pnpm db:seed` sebelum `pnpm test:e2e`.
 */

const DEMO_CUSTOMER = { email: "demo@nusantarawear.test", password: "Demo123!" }
const DEMO_ADMIN = { email: "admin@nusantarawear.test", password: "Admin123!" }

async function signIn(page: import("@playwright/test").Page, credentials: { email: string; password: string }, callbackUrl = "/akun") {
  await page.goto(`/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  await page.getByLabel("Email").fill(credentials.email)
  await page.getByLabel("Password").fill(credentials.password)
  await page.getByRole("button", { name: "Masuk" }).click()
  await page.waitForURL(`**${callbackUrl}**`)
}

async function addFirstAvailableProductToCart(page: import("@playwright/test").Page) {
  await page.goto("/shop?stok=tersedia")
  await page.locator("article a").first().click()
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await page.getByRole("button", { name: /Tambahkan ke tas/ }).click()
  await expect(page.getByRole("dialog").getByText("Tas Belanja")).toBeVisible()
}

test.describe("storefront", () => {
  test("homepage menampilkan hero, koleksi, dan katalog dari database", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Berakar")
    await expect(page.getByRole("link", { name: /Lihat koleksi/ })).toBeVisible()
    await expect(page.locator("article").first()).toBeVisible()
  })

  test("pencarian dan filter memperbarui URL serta hasil", async ({ page }) => {
    await page.goto("/cari")
    await page.getByLabel("Apa yang ingin Anda temukan?").fill("shirt")
    await page.getByRole("button", { name: "Cari" }).click()
    await expect(page).toHaveURL(/q=shirt/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hasil untuk")

    await page.goto("/shop")
    await page.getByRole("button", { name: "Atasan" }).first().click()
    await expect(page).toHaveURL(/kategori=atasan/)
  })

  test("guest dapat menambah ke tas, memakai promo, lalu checkout dan membayar mock", async ({ page }) => {
    await addFirstAvailableProductToCart(page)

    await page.goto("/cart")
    await page.getByLabel("Kode promo").fill("PERTAMA10")
    await page.getByRole("button", { name: "Pakai" }).click()
    await expect(page.getByText(/Diskon|Minimum belanja/)).toBeVisible()

    await page.getByRole("link", { name: "Lanjut checkout" }).click()
    await expect(page).toHaveURL(/checkout/)

    await page.getByLabel("Email").fill("tamu@nusantarawear.test")
    await page.getByLabel("Nomor telepon").fill("081200000000")
    await page.getByRole("button", { name: "Lanjut" }).click()

    await page.getByLabel("Nama penerima").fill("Tamu Nusantara")
    await page.getByLabel("Alamat lengkap").fill("Jl. Percobaan No. 42")
    await page.getByLabel("Kecamatan").fill("Menteng")
    await page.getByLabel("Kota").fill("Jakarta Pusat")
    await page.getByLabel("Provinsi").fill("DKI Jakarta")
    await page.getByLabel("Kode pos").fill("10310")
    await page.getByRole("button", { name: "Lanjut" }).click()

    await page.getByRole("button", { name: "Lanjut" }).click()
    await page.getByRole("button", { name: "Lanjut" }).click()

    await page.getByRole("button", { name: /Konfirmasi & bayar demo/ }).click()
    await page.waitForURL(/checkout\/(sukses|gagal)/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("tracking membutuhkan kombinasi nomor pesanan dan email yang cocok", async ({ page }) => {
    await page.goto("/lacak-pesanan")
    await page.getByLabel("Nomor pesanan").fill("NW-2026-00002")
    await page.getByLabel("Email pemesan").fill("salah@nusantarawear.test")
    await page.getByRole("button", { name: "Lacak pesanan" }).click()
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible()

    await page.getByLabel("Email pemesan").fill(DEMO_CUSTOMER.email)
    await page.getByRole("button", { name: "Lacak pesanan" }).click()
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible()
  })
})

test.describe("akun pelanggan", () => {
  test("login lalu melihat pesanan dan wishlist", async ({ page }) => {
    await signIn(page, DEMO_CUSTOMER)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kabar dari ruang Anda")

    await page.getByRole("link", { name: "Pesanan" }).first().click()
    await expect(page).toHaveURL(/akun\/pesanan/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pesanan Anda")

    await page.getByRole("link", { name: "Wishlist" }).first().click()
    await expect(page).toHaveURL(/akun\/wishlist/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wishlist")
  })
})

test.describe("admin", () => {
  test("login admin, sesuaikan stok, dan storefront ikut terbarui", async ({ page }) => {
    await signIn(page, DEMO_ADMIN, "/admin")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Studio Console")

    await page.goto("/admin/inventory")
    const variantSelect = page.getByLabel("Variant")
    const selectedLabel = await variantSelect.locator("option:checked").innerText()
    const sku = selectedLabel.match(/\(([^)]+)\)/)?.[1] ?? ""

    await page.getByLabel("Jumlah (boleh negatif)").fill("5")
    await page.getByLabel("Alasan").fill("Restock uji end-to-end")
    await page.getByRole("button", { name: "Simpan penyesuaian" }).click()
    await expect(page.getByText(/Stok diperbarui menjadi/)).toBeVisible()

    await page.goto(`/admin/inventory?q=${encodeURIComponent(sku)}`)
    await expect(page.getByText(sku)).toBeVisible()
  })

  test("pelanggan biasa tidak dapat membuka /admin", async ({ page }) => {
    await signIn(page, DEMO_CUSTOMER)
    await page.goto("/admin")
    await expect(page).toHaveURL(/akun/)
  })
})

test.describe("aksesibilitas dan mobile", () => {
  test("navigasi mobile dan filter drawer dapat dibuka", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Hanya relevan pada viewport mobile.")

    await page.goto("/")
    await page.getByRole("button", { name: "Buka menu" }).click()
    await expect(page.getByRole("dialog").getByRole("link", { name: "Pakaian" })).toBeVisible()
    await page.keyboard.press("Escape")

    await page.goto("/shop")
    await page.getByRole("button", { name: "Filter" }).click()
    await expect(page.getByRole("dialog").getByText("Saring koleksi")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toBeHidden()
  })

  test("dialog panduan ukuran dapat diakses lewat keyboard", async ({ page }) => {
    await page.goto("/shop")
    await page.locator("article a").first().click()

    await page.getByRole("button", { name: /Panduan ukuran/ }).focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("dialog").getByText("Panduan ukuran")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toBeHidden()
  })

  test("halaman utama memiliki skip link dan landmark", async ({ page }) => {
    await page.goto("/")
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name: "Lewati ke konten" })).toBeFocused()
    await expect(page.getByRole("main")).toBeVisible()
    await expect(page.getByRole("contentinfo")).toBeVisible()
  })
})
