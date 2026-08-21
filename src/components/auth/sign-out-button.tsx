"use client"

import { signOut } from "next-auth/react"
import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <Button className="mt-8" variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      <LogOutIcon data-icon="inline-start" />
      Keluar
    </Button>
  )
}
