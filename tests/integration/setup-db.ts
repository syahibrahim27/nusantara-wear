import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

/**
 * Integration test memakai PostgreSQL sungguhan. Bila database tidak dapat dijangkau,
 * suite di-skip dengan pesan jelas alih-alih gagal—jalankan `docker compose up -d`
 * lalu `pnpm db:migrate && pnpm db:seed` untuk mengaktifkannya.
 */
export async function connectTestDatabase() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  try {
    await client.$queryRaw`SELECT 1`
    return client
  } catch {
    await client.$disconnect().catch(() => {})
    return null
  }
}

export const databaseAvailable = async () => {
  const client = await connectTestDatabase()
  if (!client) return false
  await client.$disconnect()
  return true
}
