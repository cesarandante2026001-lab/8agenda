import { auth } from "./auth"
import { prisma } from "./prisma"

export async function getUsuario() {
  const session = await auth()
  if (!session?.user) return null

  const userId = (session.user as { id?: string }).id
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, tenantId: true, email: true, name: true },
  })

  return user
}

export function withTenant(u: any) {
  if (!u) return {}
  if (u.role === "SUPERADMIN") return {}
  return { tenantId: u.tenantId }
}

export function esSuperadmin(u: any) {
  return u?.role === "SUPERADMIN"
}