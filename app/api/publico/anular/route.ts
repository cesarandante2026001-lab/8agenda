import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const appointmentId = String(body.appointmentId || "")

    if (!appointmentId) {
      return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    if (appointment.status === "CANCELADA") {
      return NextResponse.json({ error: "Esta reserva ya fue anulada" }, { status: 400 })
    }

    // Marcar la cita como cancelada y liberar el slot
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELADA" },
      }),
      prisma.slot.update({
        where: { id: appointment.slotId },
        data: { status: "LIBRE" },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error anulando:", error)
    return NextResponse.json({ error: "Error al anular" }, { status: 500 })
  }
}