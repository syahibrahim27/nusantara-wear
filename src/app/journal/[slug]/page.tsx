import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { formatDateID } from "@/lib/commerce"
import { BLUR_PLACEHOLDER } from "@/server/services/catalog-service"
import { getJournalPost, getRelatedJournalPosts } from "@/server/services/journal-service"

export const revalidate = 600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getJournalPost(slug)
  if (!post) return { title: "Artikel tidak ditemukan" }
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, images: [post.coverImage], publishedTime: post.publishedAt?.toISOString() },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getJournalPost(slug)
  if (!post) notFound()

  const related = await getRelatedJournalPosts(post.slug)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const structured = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${appUrl}${post.coverImage}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name ?? "Studio Nusantara Wear" },
    publisher: { "@type": "Organization", name: "Nusantara Wear" },
  }

  return (
    <article className="pb-28 pt-32">
      <header className="mx-auto max-w-5xl px-5 py-12 text-center sm:px-10">
        <p className="eyebrow text-primary">Journal · {post.publishedAt ? formatDateID(post.publishedAt) : "Draf"}</p>
        <h1 className="display mt-5 text-6xl sm:text-8xl">{post.title}</h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
        <p className="mt-6 text-xs text-muted-foreground">Ditulis oleh {post.author.name ?? "Studio Nusantara Wear"}</p>
      </header>

      <div className="relative mx-auto aspect-[16/8] max-w-[1500px]">
        <Image className="object-cover" src={post.coverImage} alt={post.title} fill priority sizes="100vw" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} />
      </div>

      <div className="mx-auto max-w-2xl px-5 pt-16 text-lg leading-9">
        {post.content.split("\n\n").map((paragraph, index) =>
          paragraph.startsWith("> ") ? (
            <blockquote className="display my-14 border-y py-10 text-4xl text-primary sm:text-5xl" key={index}>
              {paragraph.slice(2)}
            </blockquote>
          ) : (
            <p className={index === 0 ? "" : "mt-7"} key={index}>
              {paragraph}
            </p>
          ),
        )}

        {related.length > 0 && (
          <section className="mt-20 border-t pt-10" aria-labelledby="artikel-lain">
            <h2 className="font-serif text-3xl" id="artikel-lain">
              Bacaan lain
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link className="text-base" href={`/journal/${item.slug}`}>
                    {item.title}
                    <span className="block text-sm text-muted-foreground">{item.excerpt}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link className="mt-14 inline-flex min-h-11 items-center border-b text-sm font-semibold" href="/journal">
          Kembali ke Journal
        </Link>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
    </article>
  )
}
