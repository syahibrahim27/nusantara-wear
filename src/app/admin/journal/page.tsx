import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { formatDateID } from "@/lib/commerce"
import { listAdminJournal } from "@/server/services/admin-service"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminJournalPage() {
  const posts = await listAdminJournal()

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-primary">Studio Console</p>
          <h1 className="display mt-3 text-6xl">Journal</h1>
          <p className="mt-4 text-sm text-muted-foreground">Tulis, simpan sebagai draf, lalu terbitkan artikel editorial.</p>
        </div>
        <Link className={buttonVariants({ className: "min-h-11" })} href="/admin/journal/baru">
          <PlusIcon data-icon="inline-start" />
          Tulis artikel
        </Link>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">{posts.length} artikel</CardTitle>
          <CardDescription>Menerbitkan artikel memicu revalidasi halaman journal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penulis</TableHead>
                <TableHead>Diperbarui</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>Belum ada artikel.</TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/journal/${post.id}`}>{post.title}</Link>
                      <small className="block text-muted-foreground">/journal/{post.slug}</small>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>{post.status}</Badge>
                    </TableCell>
                    <TableCell>{post.author.name ?? "Studio"}</TableCell>
                    <TableCell>{formatDateID(post.updatedAt)}</TableCell>
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
