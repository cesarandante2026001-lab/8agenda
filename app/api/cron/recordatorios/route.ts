import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enviarRecordatorio } from "@/lib/emails"

export const dynamic = "force-dynamic"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

// GET: dispara el envio de recordatorios para las citas de manana.
// Protegido por CRON_SECRET (header Authorization: Bearer <secret>)
// o por ?secret=<secret> en la query (comodo para cron-job.org).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secretQuery = searchParams.get("secret")
  const secretHeader = req.headers.get("authorization")?.replace("Bearer ", "")
  const secretEsperado = process.env.CRON_SECRET

  if (secretEsperado && secretQuery !== secretEsperado && secretHeader !== secretEsperado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const hoy = new Date()
  const inicioManana = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 1))
  const finManana = new Date(inicioManana.getTime() + 24 * 60 * 60 * 1000)

  const citas = await prisma.appointment.findMany({
    where: {
      status: { in: ["RESERVADA", "CONFIRMADA"] },
      slot: { date: { gte: inicioManana, lt: finManana } },
    },
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  let enviados = 0
  let errores = 0

  for (const c of citas) {
    try {
      await enviarRecordatorio({
        to: c.patientEmail,
        pacienteNombre: c.patientName,
        especialista: c.specialist.name,
        especialidad: c.specialist.specialty.name,
        fecha: formatearFecha(c.slot.date),
        hora: c.slot.startTime,
        cancelToken: c.cancelToken || undefined,
      })
      enviados++
    } catch (e) {
      console.error("[cron recordatorios] error con cita", c.id, e)
      errores++
    }
  }

  return NextResponse.json({
    ok: true,
    total: citas.length,
    enviados,
    errores,
    fechaObjetivo: inicioManana.toISOString().slice(0, 10),
  })
}