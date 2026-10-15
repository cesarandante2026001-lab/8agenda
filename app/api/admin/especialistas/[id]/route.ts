import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = String(body.name).trim()
  if (body.rut !== undefined) data.rut = body.rut ? String(body.rut).trim() : null
  if (body.email !== undefined) data.email = body.email ? String(body.email).trim().toLowerCase() : null
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null
  if (body.specialtyId !== undefined) data.specialtyId = String(body.specialtyId)
  if (body.duracionConsulta !== undefined) data.duracionConsulta = Number(body.duracionConsulta)
  if (body.anticipacionMinima !== undefined) data.anticipacionMinima = Number(body.anticipacionMinima)
  if (body.anticipacionMaxima !== undefined) data.anticipacionMaxima = Number(body.anticipacionMaxima)
  if (body.active !== undefined) data.active = Boolean(body.active)

  const especialistaActual = await prisma.specialist.findUnique({ where: { id } })
  if (!especialistaActual) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Si cambia email y tiene usuario vinculado, actualizar tambien el User
  if (body.email !== undefined && especialistaActual.userId) {
    const nuevoEmail = body.email ? String(body.email).trim().toLowerCase() : null
    if (nuevoEmail && nuevoEmail !== especialistaActual.email) {
      const existe = await prisma.user.findUnique({ where: { email: nuevoEmail } })
      if (existe && existe.id !== especialistaActual.userId) {
        return NextResponse.json({ error: "Ese email ya esta en uso por otro usuario" }, { status: 400 })
      }
      await prisma.user.update({
        where: { id: especialistaActual.userId },
        data: { email: nuevoEmail },
      })
    }
  }

  const especialista = await prisma.specialist.update({
    where: { id },
    data,
    include: { specialty: true, user: { select: { id: true, email: true } } },
  })

  return NextResponse.json({ especialista })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params

  const especialista = await prisma.specialist.findUnique({ where: { id } })
  if (!especialista) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const count = await prisma.appointment.count({ where: { specialistId: id } })
  if (count > 0) {
    await prisma.specialist.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ ok: true, softDeleted: true, message: "Tiene " + count + " citas. Se desactivo en vez de borrar." })
  }

  await prisma.$transaction(async (tx) => {
    await tx.specialist.delete({ where: { id } })
    if (especialista.userId) {
      await tx.user.delete({ where: { id: especialista.userId } }).catch(() => {})
    }
  })

  return NextResponse.json({ ok: true, softDeleted: false })
}