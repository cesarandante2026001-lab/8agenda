import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generarSlotsDeEspecialista } from "@/lib/generar-slots"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params

  try {
    // Por defecto generamos los proximos 90 dias
    const desde = new Date()
    desde.setUTCHours(0, 0, 0, 0)

    const hasta = new Date(desde)
    hasta.setUTCDate(hasta.getUTCDate() + 90)

    const resultado = await generarSlotsDeEspecialista(id, desde, hasta)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error generando slots:", error)
    const msg = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}