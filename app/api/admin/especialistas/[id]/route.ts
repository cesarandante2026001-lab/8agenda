import { NextResponse } from "next/server"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const esp = await prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!esp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = String(body.name).trim()
  if (body.rut !== undefined) data.rut = body.rut ? String(body.rut).trim() : null
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null
  if (body.specialtyId !== undefined) data.specialtyId = String(body.specialtyId)
  if (body.duracionConsulta !== undefined) data.duracionConsulta = Number(body.duracionConsulta)
  if (body.anticipacionMinima !== undefined) data.anticipacionMinima = Number(body.anticipacionMinima)
  if (body.anticipacionMaxima !== undefined) data.anticipacionMaxima = Number(body.anticipacionMaxima)
  if (body.active !== undefined) data.active = Boolean(body.active)

  // Si cambia email, actualizar tambien el User vinculado
  if (body.email !== undefined && esp.userId) {
    const nuevoEmail = body.email ? String(body.email).trim().toLowerCase() : null
    if (nuevoEmail && nuevoEmail !== esp.email) {
      const existe = await prisma.user.findUnique({ where: { email: nuevoEmail } })
      if (existe && existe.id !== esp.userId) {
        return NextResponse.json({ error: "Ese email ya esta en uso" }, { status: 400 })
      }
      await prisma.user.update({
        where: { id: esp.userId },
        data: { email: nuevoEmail },
      })
      data.email = nuevoEmail
    }
  }

  const actualizado = await prisma.specialist.update({
    where: { id },
    data,
    include: { specialty: true, user: { select: { id: true, email: true } } },
  })

  return NextResponse.json({ especialista: actualizado })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const esp = await prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!esp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const count = await prisma.appointment.count({ where: { specialistId: id } })
  if (count > 0) {
    await prisma.specialist.update({ where: { id }, data: { active: false } })
    return NextResponse.json({
      ok: true,
      softDeleted: true,
      message: "Tiene " + count + " citas. Se desactivo en vez de borrar.",
    })
  }

  await prisma.$transaction(async (tx) => {
    await tx.specialist.delete({ where: { id } })
    if (esp.userId) {
      await tx.user.delete({ where: { id: esp.userId } }).catch(() => {})
    }
  })

  return NextResponse.json({ ok: true, softDeleted: false })
}