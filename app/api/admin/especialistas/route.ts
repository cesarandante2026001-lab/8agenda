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
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const especialistas = await prisma.specialist.findMany({
    include: { specialty: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ especialistas })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  try {
    const body = await req.json()

    let tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { slug: "principal", name: "Institucion Principal" },
      })
    }

    const especialista = await prisma.specialist.create({
      data: {
        tenantId: tenant.id,
        specialtyId: String(body.specialtyId),
        name: String(body.name || "").trim(),
        rut: body.rut ? String(body.rut).trim() : null,
        email: body.email ? String(body.email).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        duracionConsulta: Number(body.duracionConsulta) || 20,
        anticipacionMinima: Number(body.anticipacionMinima) || 60,
        anticipacionMaxima: Number(body.anticipacionMaxima) || 60,
      },
    })

    return NextResponse.json({ especialista }, { status: 201 })
  } catch (error) {
    console.error("Error especialista:", error)
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}