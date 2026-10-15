import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  rut: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
})

export async function POST(req: Request) {
  const u = await currentUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const permitidos = ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"]
  if (!permitidos.includes(u.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = schema.parse(await req.json())

  let tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { slug: "principal", name: "Institucion Principal" },
    })
  }

  const paciente = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      rut: body.rut || null,
      email: body.email || null,
      phone: body.phone || null,
    },
  })

  return NextResponse.json({ paciente }, { status: 201 })
}