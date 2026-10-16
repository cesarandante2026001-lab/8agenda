import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(300).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  // Verificar que la especialidad pertenezca al tenant del usuario
  const esp = await prisma.specialty.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!esp) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const body = schema.parse(await req.json())
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description || null
  if (body.color !== undefined) data.color = body.color
  if (body.order !== undefined) data.order = body.order
  if (body.active !== undefined) data.active = body.active

  const actualizada = await prisma.specialty.update({ where: { id }, data })
  return NextResponse.json({ especialidad: actualizada })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const esp = await prisma.specialty.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!esp) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  await prisma.specialty.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}