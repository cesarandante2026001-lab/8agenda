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
 * Filtro de Prisma para limitar consultas al tenant del usuario.
 * - SUPERADMIN: devuelve {} (ve todo)
 * - Usuario con tenant: devuelve { tenantId: "xxx" }
 * - Usuario sin tenant y no superadmin: devuelve { tenantId: "___imposible___" } (no ve nada)
 */
export function withTenant(u: UsuarioSesion | null) {
  if (!u) return { tenantId: "___sin_sesion___" }
  if (esSuperadmin(u)) return {}
  if (!u.tenantId) return { tenantId: "___sin_tenant___" }
  return { tenantId: u.tenantId }
}