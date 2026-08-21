import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

import { formatDateID } from "@/lib/commerce"
import { BLUR_PLACEHOLDER } from "@/server/services/catalog-service"
import { listJournalPosts } from "@/server/services/journal-service"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Journal",
  description: "Catatan tentang pakaian, material, proses, dan kehidupan di kota tropis.",
  alternates: { canonical: "/journal" },
}

export default async function JournalPage() {
  const posts = await listJournalPosts()

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-28 pt-36 sm:px-10">
      <p className="eyebrow text-primary">Catatan dari studio</p>
      <h1 className="display mt-4 text-7xl sm:text-9xl">Journal</h1>

      {posts.length === 0 ? (
        <Empty className="mt-16 border py-24">
          <EmptyHeader>
            <EmptyTitle>Belum ada artikel terbit</EmptyTitle>
            <EmptyDescription>Tim studio sedang menyiapkan catatan berikutnya.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-16 grid gap-x-8 gap-y-16 lg:grid-cols-2">
          {posts.map((post, index) => (
            <article className={index % 2 ? "lg:mt-24" : ""} key={post.slug}>
              <Link className="image-reveal relative block aspect-[4/3] overflow-hidden" href={`/journal/${post.slug}`}>
                <Image className="object-cover" src={post.coverImage} alt={post.title} fill sizes="(max-width:1024px)100vw,50vw" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} />
              </Link>
              <p className="eyebrow mt-6 text-muted-foreground">{post.publishedAt ? formatDateID(post.publishedAt) : "Draf"}</p>
              <Link href={`/journal/${post.slug}`}>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">{post.title}</h2>
              </Link>
              <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{post.excerpt}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
