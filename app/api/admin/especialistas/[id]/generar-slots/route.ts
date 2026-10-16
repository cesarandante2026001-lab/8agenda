import { NextResponse } from "next/server"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  // Verificar que el especialista sea del tenant
  const esp = await prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
  })
  if (!esp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Obtener dias activos
  const dias = await prisma.specialistDay.findMany({
    where: { specialistId: id, active: true },
    orderBy: { date: "asc" },
  })

  if (dias.length === 0) {
    return NextResponse.json({ error: "No hay dias activos. Genera primero el mes con patron." }, { status: 400 })
  }

  const duracion = esp.duracionConsulta || 20

  let totalCreados = 0

  await prisma.$transaction(async (tx) => {
    // Borrar slots LIBRES previos del especialista (los tomados se quedan)
    await tx.slot.deleteMany({
      where: { specialistId: id, status: "LIBRE" },
    })

    for (const dia of dias) {
      const inicio = dia.startTime || "09:00"
      const fin = dia.endTime || "18:00"
      const breakStart = dia.breakStart
      const breakEnd = dia.breakEnd

      const [hI, mI] = inicio.split(":").map(Number)
      const [hF, mF] = fin.split(":").map(Number)

      let minActual = hI * 60 + mI
      const minFin = hF * 60 + mF

      while (minActual + duracion <= minFin) {
        const h1 = Math.floor(minActual / 60).toString().padStart(2, "0")
        const m1 = (minActual % 60).toString().padStart(2, "0")
        const h2 = Math.floor((minActual + duracion) / 60).toString().padStart(2, "0")
        const m2 = ((minActual + duracion) % 60).toString().padStart(2, "0")

        const startStr = `${h1}:${m1}`
        const endStr = `${h2}:${m2}`

        const enColacion =
          breakStart && breakEnd &&
          startStr >= breakStart && startStr < breakEnd

        if (!enColacion) {
          // Verificar que no exista ya un slot a esa hora (por si acaso)
          const existe = await tx.slot.findFirst({
            where: { specialistId: id, date: dia.date, startTime: startStr },
          })

          if (!existe) {
            await tx.slot.create({
              data: {
                specialistId: id,
                date: dia.date,
                startTime: startStr,
                endTime: endStr,
                status: "LIBRE",
              },
            })
            totalCreados++
          }
        }

        minActual += duracion
      }
    }
  }, { timeout: 60000 })

  return NextResponse.json({ ok: true, totalCreados })
}