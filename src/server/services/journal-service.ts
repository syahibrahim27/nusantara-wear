import "server-only"

import { prisma } from "@/lib/db/prisma"

const published = { status: "PUBLISHED" as const, publishedAt: { not: null } }

export const listJournalPosts = (take = 12) =>
  prisma.journalPost.findMany({ where: published, include: { author: { select: { name: true } } }, orderBy: { publishedAt: "desc" }, take })

export const getJournalPost = (slug: string) =>
  prisma.journalPost.findFirst({ where: { slug, ...published }, include: { author: { select: { name: true } } } })

export const getRelatedJournalPosts = (slug: string, take = 3) =>
  prisma.journalPost.findMany({ where: { ...published, slug: { not: slug } }, orderBy: { publishedAt: "desc" }, take })

export const listPublishedJournalSlugs = () => prisma.journalPost.findMany({ where: published, select: { slug: true, updatedAt: true } })
