import { auth } from "@/lib/auth"

export type UsuarioActual = {
  id: string
  email: string
  name?: string
  role: string
  tenantId: string | null
}

export async function currentUser(): Promise<UsuarioActual | undefined> {
  const session = await auth()
  if (!session?.user) return undefined
  const u = session.user as any
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tenantId: u.tenantId ?? null,
  }
}

export async function isAdmin() {
  const u = await currentUser()
  if (!u) return false
  return ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(u.role)
}