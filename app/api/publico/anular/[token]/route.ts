import { NextResponse } from "next/server"
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

// GET: devuelve datos de la reserva para mostrar en la pagina de confirmacion
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const app = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  if (!app) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  if (app.status === "CANCELADA") {
    return NextResponse.json({ error: "Esta reserva ya fue anulada", yaAnulada: true }, { status: 410 })
  }

  if (app.cancelTokenExpira && app.cancelTokenExpira < new Date()) {
    return NextResponse.json({ error: "El plazo para anular expiro", expirado: true }, { status: 410 })
  }

  return NextResponse.json({
    appointment: {
      id: app.id,
      patientName: app.patientName,
      patientEmail: app.patientEmail,
      especialista: app.specialist.name,
      especialidad: app.specialist.specialty.name,
      fecha: formatearFecha(app.slot.date),
      hora: app.slot.startTime,
      status: app.status,
    },
  })
}

// POST: confirma la anulacion
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const app = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  if (!app) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  if (app.status === "CANCELADA") {
    return NextResponse.json({ error: "Esta reserva ya fue anulada" }, { status: 410 })
  }

  if (app.cancelTokenExpira && app.cancelTokenExpira < new Date()) {
    return NextResponse.json({ error: "El plazo para anular expiro" }, { status: 410 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: app.id },
      data: { status: "CANCELADA" },
    })
    await tx.slot.update({
      where: { id: app.slotId },
      data: { status: "LIBRE" },
    })
  })

  enviarCancelacionReserva({
    to: app.patientEmail,
    clienteNombre: app.patientName,
    especialista: app.specialist.name,
    especialidad: app.specialist.specialty.name,
    fecha: formatearFecha(app.slot.date),
    hora: app.slot.startTime,
  }).catch((e) => console.error("[anular] email cancelacion fallo:", e))

  return NextResponse.json({ ok: true })
}