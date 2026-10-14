import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enviarCancelacionReserva } from "@/lib/emails"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const rol = (session.user as any).role
  if (!["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST", "SPECIALIST"].includes(rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { id } = await params

  const app = await prisma.appointment.findUnique({
    where: { id },
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  if (!app) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
  }

  if (app.status === "CANCELADA") {
    return NextResponse.json({ error: "Ya estaba anulada" }, { status: 410 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id },
      data: { status: "CANCELADA" },
    })
    await tx.slot.update({
      where: { id: app.slotId },
      data: { status: "LIBRE" },
    })
  })

  if (app.patientEmail) {
    enviarCancelacionReserva({
      to: app.patientEmail,
      pacienteNombre: app.patientName,
      especialista: app.specialist.name,
      especialidad: app.specialist.specialty.name,
      fecha: formatearFecha(app.slot.date),
      hora: app.slot.startTime,
    }).catch((e) => console.error("[admin anular] email fallo:", e))
  }

  return NextResponse.json({ ok: true })
}