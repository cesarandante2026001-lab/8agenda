import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"

const recetaSchema = z.object({
  medicamento: z.string().min(1).max(200),
  dosis: z.string().max(100).optional().or(z.literal("")),
  frecuencia: z.string().max(100).optional().or(z.literal("")),
  duracion: z.string().max(100).optional().or(z.literal("")),
  indicaciones: z.string().max(500).optional().or(z.literal("")),
})

const examenSchema = z.object({
  nombre: z.string().min(1).max(200),
  notas: z.string().max(500).optional().or(z.literal("")),
})

const schema = z.object({
  motivoConsulta: z.string().max(2000).optional().or(z.literal("")),
  anamnesis: z.string().max(5000).optional().or(z.literal("")),
  examenFisico: z.string().max(5000).optional().or(z.literal("")),
  diagnostico: z.string().max(5000).optional().or(z.literal("")),
  indicaciones: z.string().max(5000).optional().or(z.literal("")),
  peso: z.string().max(20).optional().or(z.literal("")),
  talla: z.string().max(20).optional().or(z.literal("")),
  presionArterial: z.string().max(20).optional().or(z.literal("")),
  frecuenciaCardiaca: z.string().max(20).optional().or(z.literal("")),
  temperatura: z.string().max(20).optional().or(z.literal("")),
  saturacion: z.string().max(20).optional().or(z.literal("")),
  frecuenciaResp: z.string().max(20).optional().or(z.literal("")),
  recetas: z.array(recetaSchema).max(50).optional(),
  examenes: z.array(examenSchema).max(50).optional(),
})

export async function POST(
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
  const body = schema.parse(await req.json())

  const cita = await prisma.appointment.findUnique({
    where: { id },
    include: { specialist: true },
  })
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
  if (!cita.patientId) {
    return NextResponse.json({ error: "La cita no esta ligada a un paciente" }, { status: 400 })
  }

  if (u.role === "SPECIALIST" && cita.specialist.userId !== u.id) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const datos = {
    motivoConsulta: body.motivoConsulta || null,
    anamnesis: body.anamnesis || null,
    examenFisico: body.examenFisico || null,
    diagnostico: body.diagnostico || null,
    indicaciones: body.indicaciones || null,
    peso: body.peso || null,
    talla: body.talla || null,
    presionArterial: body.presionArterial || null,
    frecuenciaCardiaca: body.frecuenciaCardiaca || null,
    temperatura: body.temperatura || null,
    saturacion: body.saturacion || null,
    frecuenciaResp: body.frecuenciaResp || null,
  }

  const atencion = await prisma.$transaction(async (tx) => {
    const a = await tx.atencion.upsert({
      where: { appointmentId: id },
      update: datos,
      create: {
        tenantId: cita.tenantId,
        appointmentId: id,
        patientId: cita.patientId!,
        specialistId: cita.specialistId,
        ...datos,
      },
    })

    // Reemplazar recetas y examenes (borrar y crear)
    await tx.receta.deleteMany({ where: { atencionId: a.id } })
    await tx.solicitudExamen.deleteMany({ where: { atencionId: a.id } })

    if (body.recetas && body.recetas.length > 0) {
      await tx.receta.createMany({
        data: body.recetas.map((r, i) => ({
          atencionId: a.id,
          medicamento: r.medicamento,
          dosis: r.dosis || null,
          frecuencia: r.frecuencia || null,
          duracion: r.duracion || null,
          indicaciones: r.indicaciones || null,
          orden: i,
        })),
      })
    }

    if (body.examenes && body.examenes.length > 0) {
      await tx.solicitudExamen.createMany({
        data: body.examenes.map((e, i) => ({
          atencionId: a.id,
          nombre: e.nombre,
          notas: e.notas || null,
          orden: i,
        })),
      })
    }

    await tx.appointment.update({
      where: { id },
      data: { status: "ATENDIDA" },
    })

    return a
  })

  return NextResponse.json({ ok: true, atencion })
}