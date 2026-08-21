import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

import { prisma } from "@/lib/db/prisma"
import { rateLimit } from "@/lib/http"
import { loginSchema } from "@/lib/validation/schemas"

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
if (!secret && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET wajib diisi di production.")

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/masuk", error: "/masuk" },
  providers: [
    CredentialsProvider({
      name: "Email dan password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const ip = (request?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "local"
        if (!rateLimit(`login:${ip}`, 10, 60_000).allowed) throw new Error("RATE_LIMITED")

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
        if (!user?.passwordHash) return null
        if (!(await compare(parsed.data.password, user.passwordHash))) return null
        return { id: user.id, name: user.name ?? user.email, email: user.email, role: user.role, image: user.image }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
  secret: secret ?? "nusantara-wear-development-secret-32-characters",
}
