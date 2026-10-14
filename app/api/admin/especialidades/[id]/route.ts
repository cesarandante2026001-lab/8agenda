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
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null
  if (body.color !== undefined) data.color = String(body.color)
  if (body.order !== undefined) data.order = Number(body.order)
  if (body.active !== undefined) data.active = Boolean(body.active)

  const especialidad = await prisma.specialty.update({ where: { id }, data })
  return NextResponse.json({ especialidad })
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

  const count = await prisma.specialist.count({ where: { specialtyId: id } })
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene " + count + " especialista(s)" },
      { status: 400 }
    )
  }

  await prisma.specialty.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}