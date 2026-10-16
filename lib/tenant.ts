import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

export type UsuarioSesion = {
  id: string
  email: string
  name?: string
  role: UserRole
  tenantId: string | null
}

export async function getUsuario(): Promise<UsuarioSesion | null> {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user as any
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tenantId: u.tenantId ?? null,
  }
}

export function esSuperadmin(u: UsuarioSesion | null) {
  return u?.role === "SUPERADMIN"
}

export function esStaff(u: UsuarioSesion | null) {
  if (!u) return false
  return ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(u.role)
}

export function esDoctor(u: UsuarioSesion | null) {
  return u?.role === "SPECIALIST"
}

/**
 * Devuelve el tenantId que debe usar la consulta.
 * - Si es SUPERADMIN: null (puede ver todo)
 * - Si es usuario normal: su tenantId (obligatorio)
 * - Si es null y no es superadmin: error
 */
export function tenantDelUsuario(u: UsuarioSesion | null): string | null {
  if (!u) throw new Error("Sin sesion")
  if (esSuperadmin(u)) return null
  if (!u.tenantId) throw new Error("Usuario sin tenant asignado")
  return u.tenantId
}

/**
 * Devuelve un where de Prisma para filtrar por tenant.
 * Uso: prisma.specialty.findMany({ where: { ...withTenant(u) } })
 */
export function withTenant(u: UsuarioSesion | null) {
  const t = tenantDelUsuario(u)
  if (t === null) return {} // superadmin ve todo
  return { tenantId: t }
}