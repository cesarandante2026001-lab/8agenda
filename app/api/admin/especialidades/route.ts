import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string; tenantId?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  // Por ahora mostramos todas las especialidades (single tenant)
  const especialidades = await prisma.specialty.findMany({
    orderBy: { order: "asc" },
  })

  return NextResponse.json({ especialidades })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  try {
    const body = await req.json()

    // Como no hay tenant seleccionado todavia, buscamos o creamos uno por defecto
    let tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { slug: "principal", name: "Institucion Principal" },
      })
    }

    const especialidad = await prisma.specialty.create({
      data: {
        tenantId: tenant.id,
        name: String(body.name || "").trim(),
        description: body.description ? String(body.description).trim() : null,
        color: body.color ? String(body.color).trim() : "#000000",
        order: Number(body.order) || 0,
      },
    })

    return NextResponse.json({ especialidad }, { status: 201 })
  } catch (error) {
    console.error("Error especialidad:", error)
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}