import { formatDateID } from "@/lib/commerce"
import { listInventory, listMovements } from "@/server/services/inventory-service"
import { InventoryAdjustForm } from "@/components/admin/inventory-adjust-form"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; variantId?: string }> }) {
  const { q, variantId } = await searchParams
  const [inventory, movements] = await Promise.all([listInventory(q), listMovements(variantId)])

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">Inventory</h1>
      <p className="mt-4 text-sm text-muted-foreground">Pantau stok per variant dan catat setiap pergerakan dengan alasan.</p>

      <form className="mt-8 flex gap-2" action="/admin/inventory">
        <input className="min-h-11 flex-1 border bg-background px-3 text-sm" name="q" defaultValue={q ?? ""} placeholder="Cari SKU atau nama produk" aria-label="Cari inventory" />
        <button className={buttonVariants({ variant: "outline", className: "min-h-11" })} type="submit">
          Cari
        </button>
      </form>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">{inventory.length} variant</CardTitle>
            <CardDescription>Tersedia dihitung dari onHand dikurangi reserved.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Tersedia</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Tidak ada variant yang cocok.</TableCell>
                  </TableRow>
                ) : (
                  inventory.map((row) => (
                    <TableRow key={row.variantId}>
                      <TableCell className="font-medium">
                        {row.productName}
                        <small className="block text-muted-foreground">{row.label}</small>
                      </TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{row.onHand}</TableCell>
                      <TableCell>{row.available}</TableCell>
                      <TableCell>
                        <Badge variant={row.available <= row.reorderPoint ? "secondary" : "default"}>
                          {row.available <= row.reorderPoint ? "Stok rendah" : "Aman"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <InventoryAdjustForm
            selectedVariantId={variantId}
            variants={inventory.map((row) => ({ variantId: row.variantId, sku: row.sku, productName: row.productName, label: row.label, onHand: row.onHand }))}
          />

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Histori pergerakan</CardTitle>
              <CardDescription>30 movement terbaru.</CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pergerakan stok.</p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {movements.map((movement) => (
                    <li className="border-b pb-3" key={movement.id}>
                      <strong>
                        {movement.type} {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                      </strong>
                      <span className="block text-muted-foreground">
                        {movement.variant.product.name} · {movement.variant.sku}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {movement.reason} · {movement.actor?.name ?? "sistem"} · {formatDateID(movement.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
