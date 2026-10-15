import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/auth-helpers-extra"
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
  const u = await currentUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const permitidos = ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST", "SPECIALIST"]
  if (!permitidos.includes(u.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const data = schema.parse(body)

  const actualizado = await prisma.patient.update({
    where: { id },
    data: {
      name: data.name,
      rut: data.rut || null,
      birthDate: data.birthDate ? new Date(data.birthDate + "T00:00:00.000Z") : null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      prevision: data.prevision || null,
      contactoEmergencia: data.contactoEmergencia || null,
      telefonoEmergencia: data.telefonoEmergencia || null,
      alergias: data.alergias || null,
      enfermedadesCronicas: data.enfermedadesCronicas || null,
      medicamentos: data.medicamentos || null,
      antecedentesFamiliares: data.antecedentesFamiliares || null,
      grupoSanguineo: data.grupoSanguineo || null,
      observaciones: data.observaciones || null,
    },
  })

  return NextResponse.json({ ok: true, paciente: actualizado })
}