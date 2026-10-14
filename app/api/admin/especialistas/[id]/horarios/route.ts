import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params

  const [availabilities, breaks] = await Promise.all([
    prisma.availability.findMany({ where: { specialistId: id } }),
    prisma.break.findMany({ where: { specialistId: id } }),
  ])

  return NextResponse.json({ availabilities, breaks })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // body.availabilities: [{ dayOfWeek, startTime, endTime }]
  // body.breaks: [{ dayOfWeek, startTime, endTime, label }]

  const availabilities = Array.isArray(body.availabilities) ? body.availabilities : []
  const breaks = Array.isArray(body.breaks) ? body.breaks : []

  try {
    // Borrar los existentes y recrear
    await prisma.availability.deleteMany({ where: { specialistId: id } })
    await prisma.break.deleteMany({ where: { specialistId: id } })

    for (const a of availabilities) {
      await prisma.availability.create({
        data: {
          specialistId: id,
          dayOfWeek: a.dayOfWeek,
          startTime: String(a.startTime),
          endTime: String(a.endTime),
        },
      })
    }

    for (const b of breaks) {
      await prisma.break.create({
        data: {
          specialistId: id,
          dayOfWeek: b.dayOfWeek,
          startTime: String(b.startTime),
          endTime: String(b.endTime),
          label: b.label ? String(b.label) : null,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error guardando horarios:", error)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}