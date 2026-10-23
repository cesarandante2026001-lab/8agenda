import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(2).max(100),
  rut: z.string().max(20).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  prevision: z.string().max(50).optional().or(z.literal("")),
  contactoEmergencia: z.string().max(100).optional().or(z.literal("")),
  telefonoEmergencia: z.string().max(30).optional().or(z.literal("")),
  alergias: z.string().max(500).optional().or(z.literal("")),
  enfermedadesCronicas: z.string().max(500).optional().or(z.literal("")),
  medicamentos: z.string().max(500).optional().or(z.literal("")),
  antecedentesFamiliares: z.string().max(500).optional().or(z.literal("")),
  grupoSanguineo: z.string().max(10).optional().or(z.literal("")),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const pac = await prisma.patient.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!pac) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const body = schema.parse(await req.json())

  const actualizado = await prisma.patient.update({
    where: { id },
    data: {
      name: body.name,
      rut: body.rut || null,
      birthDate: body.birthDate ? new Date(body.birthDate + "T00:00:00.000Z") : null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      prevision: body.prevision || null,
      contactoEmergencia: body.contactoEmergencia || null,
      telefonoEmergencia: body.telefonoEmergencia || null,
      alergias: body.alergias || null,
      enfermedadesCronicas: body.enfermedadesCronicas || null,
      medicamentos: body.medicamentos || null,
      antecedentesFamiliares: body.antecedentesFamiliares || null,
      grupoSanguineo: body.grupoSanguineo || null,
      observaciones: body.observaciones || null,
    },
  })

  return NextResponse.json({ ok: true, cliente: actualizado })
}