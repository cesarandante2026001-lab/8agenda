import { auth } from "./auth"
import type { UserRole } from "@prisma/client"

export const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

export async function getSession() {
  return auth()
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user) return null
  return session.user as {
    id: string
    email: string
    name?: string
    role: UserRole
    tenantId?: string | null
  }
}

export async function isAdmin() {
  const user = await getCurrentUser()
  if (!user) return false
  return ADMIN_ROLES.includes(user.role)
}