import { formatDateID, formatRupiah } from "@/lib/commerce"
import { listPromotions } from "@/server/services/promotion-service"
import { PromotionForm, PromotionToggle } from "@/components/admin/promotion-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const describe = (type: string, value: number) =>
  type === "PERCENTAGE" ? `${value}%` : type === "FIXED_AMOUNT" ? formatRupiah(value) : "Bebas ongkir"

export default async function AdminPromoPage() {
  const promotions = await listPromotions()

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">Promo codes</h1>
      <p className="mt-4 text-sm text-muted-foreground">Jadwalkan insentif dengan minimum belanja, batas total, dan batas per pelanggan.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-3xl">{promotions.length} promo</CardTitle>
            <CardDescription>Pemakaian dihitung dari redemption pada pesanan nyata.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Pemakaian</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>Belum ada promo.</TableCell>
                  </TableRow>
                ) : (
                  promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-medium">
                        {promotion.code}
                        <small className="block text-muted-foreground">{promotion.name}</small>
                      </TableCell>
                      <TableCell>{describe(promotion.type, promotion.value)}</TableCell>
                      <TableCell>{formatRupiah(promotion.minimumSubtotal)}</TableCell>
                      <TableCell>
                        {promotion._count.redemptions}
                        {promotion.usageLimit ? ` / ${promotion.usageLimit}` : ""}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDateID(promotion.startsAt)}
                        <span className="block">{formatDateID(promotion.endsAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promotion.isActive ? "default" : "secondary"}>{promotion.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      </TableCell>
                      <TableCell>
                        <PromotionToggle promotionId={promotion.id} isActive={promotion.isActive} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <PromotionForm />
      </div>
    </section>
  )
}
