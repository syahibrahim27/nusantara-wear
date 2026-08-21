import { formatDateID, formatRupiah } from "@/lib/commerce"
import { listCustomers } from "@/server/services/admin-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminCustomersPage() {
  const customers = await listCustomers()

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">Customers</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Ringkasan hubungan pelanggan. Email disamarkan dan alamat lengkap tidak ditampilkan di sini.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">{customers.length} pelanggan</CardTitle>
          <CardDescription>Total belanja dihitung dari pesanan berstatus berbayar ke atas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pesanan</TableHead>
                <TableHead>Total belanja</TableHead>
                <TableHead>Bergabung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Belum ada pelanggan terdaftar.</TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.emailMasked}</TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>{formatRupiah(customer.totalSpent)}</TableCell>
                    <TableCell>{formatDateID(customer.joinedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
