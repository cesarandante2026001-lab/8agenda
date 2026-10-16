import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant, tenantDelUsuario } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  rut: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
})

export async function POST(req: Request) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const tenantId = tenantDelUsuario(u)
  if (!tenantId) {
    return NextResponse.json({ error: "Selecciona un tenant especifico" }, { status: 400 })
  }

  const body = schema.parse(await req.json())

  const paciente = await prisma.patient.create({
    data: {
      tenantId,
      name: body.name,
      rut: body.rut || null,
      email: body.email || null,
      phone: body.phone || null,
    },
  })

  return NextResponse.json({ paciente }, { status: 201 })
}