import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { enviarConfirmacionReserva } from "@/lib/emails"

const schema = z.object({
  slotId: z.string(),
  patientName: z.string().min(2).max(100).trim(),
  patientRut: z.string().max(20).optional(),
  patientEmail: z.string().email().toLowerCase().trim(),
  patientPhone: z.string().min(6).max(30).trim(),
})

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const slot = await prisma.slot.findUnique({
      where: { id: data.slotId },
      include: { specialist: { include: { specialty: true } } },
    })

  const now = new Date();
  const [h, m] = slot.startTime.split(':').map(Number);
  const slotDateTime = new Date(slot.date);
  slotDateTime.setUTCHours(h, m, 0, 0);

  // Si el slot es anterior a la hora actual, rebotar
  if (slotDateTime < now) {
    return NextResponse.json({ error: "Esta hora ya ha pasado. Por favor selecciona otra." }, { status: 400 });
  }


    if (!slot) {
      return NextResponse.json({ error: "Hora no existe" }, { status: 404 })
    }

    if (slot.status !== "LIBRE") {
      return NextResponse.json({ error: "Esa hora ya fue tomada" }, { status: 400 })
    }

    // Token unico para anular sin login. Expira en 7 dias.
    const cancelToken = crypto.randomUUID().replace(/-/g, "")
    const cancelTokenExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const appointment = await prisma.$transaction(async (tx) => {
      await tx.slot.update({
        where: { id: data.slotId },
        data: { status: "TOMADO" },
      })

      const app = await tx.appointment.create({
        data: {
          tenantId: slot.specialist.tenantId,
          specialistId: slot.specialistId,
          slotId: slot.id,
          status: "RESERVADA",
          patientName: data.patientName,
          patientRut: data.patientRut || null,
          patientEmail: data.patientEmail,
          patientPhone: data.patientPhone,
          cancelToken,
          cancelTokenExpira,
        },
      })

      return app
    })

    // Email de confirmacion (no bloquea la respuesta si falla)
    enviarConfirmacionReserva({
      to: data.patientEmail,
      pacienteNombre: data.patientName,
      especialista: slot.specialist.name,
      especialidad: slot.specialist.specialty.name,
      fecha: formatearFecha(slot.date),
      hora: slot.startTime,
      cancelToken,
    }).catch((e) => console.error("[reservar] email confirmacion fallo:", e))

    return NextResponse.json(
      { appointment, cancelToken },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      )
    }
    console.error("Error reserva:", error)
    return NextResponse.json({ error: "Error al reservar" }, { status: 500 })
  }
}