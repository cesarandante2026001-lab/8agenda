import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant, tenantDelUsuario } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(300).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#000000"),
  order: z.number().int().optional().default(0),
})

export async function GET() {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const especialidades = await prisma.specialty.findMany({
    where: { ...withTenant(u) },
    orderBy: { order: "asc" },
  })

  return NextResponse.json({ especialidades })
}

export async function POST(req: Request) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const tenantId = tenantDelUsuario(u)
  if (!tenantId) {
    return NextResponse.json({ error: "Selecciona un tenant especifico" }, { status: 400 })
  }

  const body = schema.parse(await req.json())

  const especialidad = await prisma.specialty.create({
    data: {
      tenantId,
      name: body.name,
      description: body.description || null,
      color: body.color,
      order: body.order,
    },
  })

  return NextResponse.json({ especialidad }, { status: 201 })
}