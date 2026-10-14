import { auth } from "@/lib/auth"

export async function currentUser() {
  const session = await auth()
  return session?.user as
    | { id: string; email: string; name?: string; role: string }
    | undefined
}

export async function isAdmin() {
  const u = await currentUser()
  if (!u) return false
  return ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(u.role)
}