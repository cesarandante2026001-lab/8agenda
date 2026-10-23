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

  try {
    // Verificar que el especialista pertenezca al negocio
    const esp = await prisma.specialist.findFirst({
      where: { id, ...withTenant(u) },
    })
    if (!esp) return NextResponse.json({ error: "Especialista no encontrado" }, { status: 404 })

    // Obtener dias activos
    const dias = await prisma.specialistDay.findMany({
      where: { specialistId: id, active: true },
      orderBy: { date: "asc" },
    })

    if (dias.length === 0) {
      return NextResponse.json({ error: "No hay dias activos. Genera primero el mes con patron." }, { status: 400 })
    }

    const duracion = esp.duracionConsulta || 20

    // 1. Borrar slots LIBRES previos del especialista
    await prisma.slot.deleteMany({
      where: { specialistId: id, status: "LIBRE" },
    })

    // 2. Obtener los slots OCUPADOS que ya existen para no duplicarlos
    const slotsOcupados = await prisma.slot.findMany({
      where: { specialistId: id, status: "OCUPADO" },
      select: { date: true, startTime: true }
    })

    const slotsToCreate = []

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
          const yaOcupado = slotsOcupados.some(s => 
            s.date.toISOString() === dia.date.toISOString() && s.startTime === startStr
          )

          if (!yaOcupado) {
            slotsToCreate.push({
              specialistId: id,
              date: dia.date,
              startTime: startStr,
              endTime: endStr,
              status: "LIBRE",
            })
          }
        }

        minActual += duracion
      }
    }

    // 3. Insertar todos de una sola vez (rapido y sin timeout)
    if (slotsToCreate.length > 0) {
      await prisma.slot.createMany({ data: slotsToCreate })
    }

    return NextResponse.json({ ok: true, totalCreados: slotsToCreate.length })
  } catch (error) {
    console.error("Error generando slots:", error)
    return NextResponse.json({ error: "Error interno al generar slots: " + (error as Error).message }, { status: 500 })
  }
}
