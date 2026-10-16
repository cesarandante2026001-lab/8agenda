import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  slotId: z.string(),
  patientName: z.string().min(2).max(100).trim(),
  patientRut: z.string().max(20).optional(),
  patientEmail: z.string().email().toLowerCase().trim(),
  patientPhone: z.string().min(6).max(30).trim(),
  notes: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const data = schema.parse(await req.json())

    const slot = await prisma.slot.findUnique({
      where: { id: data.slotId },
      include: { specialist: true },
    })

    if (!slot) return NextResponse.json({ error: "Hora no existe" }, { status: 404 })
    if (slot.status !== "LIBRE") {
      return NextResponse.json({ error: "Esa hora ya fue tomada" }, { status: 400 })
    }

    // Verificar que el slot sea del tenant del usuario
    const esp = await prisma.specialist.findFirst({
      where: { id: slot.specialistId, ...withTenant(u) },
    })
    if (!esp) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

    // Buscar o crear paciente
    let paciente = await prisma.patient.findFirst({
      where: { tenantId: slot.specialist.tenantId, rut: data.patientRut || undefined },
    })
    if (!paciente) {
      paciente = await prisma.patient.create({
        data: {
          tenantId: slot.specialist.tenantId,
          name: data.patientName,
          rut: data.patientRut || null,
          email: data.patientEmail,
          phone: data.patientPhone,
        },
      })
    }

    const cita = await prisma.$transaction(async (tx) => {
      await tx.slot.update({
        where: { id: data.slotId },
        data: { status: "TOMADO" },
      })

      return tx.appointment.create({
        data: {
          tenantId: slot.specialist.tenantId,
          specialistId: slot.specialistId,
          slotId: slot.id,
          patientId: paciente.id,
          status: "RESERVADA",
          patientName: data.patientName,
          patientRut: data.patientRut || null,
          patientEmail: data.patientEmail,
          patientPhone: data.patientPhone,
          notes: data.notes || null,
        },
      })
    })

    return NextResponse.json({ appointment: cita }, { status: 201 })
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json({ error: e.issues[0]?.message || "Datos invalidos" }, { status: 400 })
    }
    console.error("Error crear cita manual:", e)
    return NextResponse.json({ error: "Error al crear la cita" }, { status: 500 })
  }
}