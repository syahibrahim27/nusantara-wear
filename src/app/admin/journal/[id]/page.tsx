import Link from "next/link"
import { notFound } from "next/navigation"

import { getAdminJournalPost } from "@/server/services/admin-service"
import { JournalForm } from "@/components/admin/journal-form"

export default async function EditJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getAdminJournalPost(id)
  if (!post) notFound()

  return (
    <section>
      <p className="eyebrow text-primary">Studio Console</p>
      <h1 className="display mt-3 text-6xl">{post.title}</h1>
      {post.status === "PUBLISHED" && (
        <Link className="mt-3 inline-flex min-h-11 items-center border-b text-sm" href={`/journal/${post.slug}`}>
          Lihat di storefront
        </Link>
      )}
      <JournalForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          status: post.status,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
        }}
      />
    </section>
  )
}
