import { NextResponse } from "next/server"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { enviarAtencionPorEmail } from "@/lib/emails"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const atencion = await prisma.atencion.findFirst({
    where: { id, ...withTenant(u) },
    include: {
      patient: true,
      specialist: { include: { specialty: true } },
      appointment: { include: { slot: true } },
      recetas: { orderBy: { orden: "asc" } },
      examenes: { orderBy: { orden: "asc" } },
      tenant: true,
    },
  })

  if (!atencion) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  if (!atencion.patient.email) {
    return NextResponse.json({ error: "El cliente no tiene email" }, { status: 400 })
  }
  if (u.role === "SPECIALIST" && atencion.specialist.userId !== u.id) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const resultado = await enviarAtencionPorEmail({
    to: atencion.patient.email,
    pacienteNombre: atencion.patient.name,
    negocio: atencion.tenant.name,
    especialista: atencion.specialist.name,
    especialidad: atencion.specialist.specialty.name,
    fecha: formatearFecha(atencion.appointment.slot.date),
    hora: atencion.appointment.slot.startTime,
    motivoConsulta: atencion.motivoConsulta,
    diagnostico: atencion.diagnostico,
    indicaciones: atencion.indicaciones,
    recetas: atencion.recetas.map((r) => ({
      medicamento: r.medicamento,
      dosis: r.dosis,
      frecuencia: r.frecuencia,
      duracion: r.duracion,
      indicaciones: r.indicaciones,
    })),
    examenes: atencion.examenes.map((x) => ({ nombre: x.nombre, notas: x.notas })),
  })

  if (resultado && (resultado as any).error) {
    return NextResponse.json({ error: "Resend rechazo el envio" }, { status: 500 })
  }
  if (resultado && (resultado as any).skipped) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, to: atencion.patient.email })
}