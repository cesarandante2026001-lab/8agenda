import { NextResponse } from "next/server"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  try {
    const esp = await prisma.specialist.findFirst({ where: { id, ...withTenant(u) } })
    if (!esp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const dias = await prisma.specialistDay.findMany({
      where: { specialistId: id, active: true },
      orderBy: { date: "asc" },
    })

    if (dias.length === 0) {
      return NextResponse.json({ error: "No hay dias activos. Genera primero el mes con patron." }, { status: 400 })
    }

    const duracion = esp.duracionConsulta || 20

    // Borrar slots LIBRES previos
    await prisma.slot.deleteMany({ where: { specialistId: id, status: "LIBRE" } })

    let totalCreados = 0

    // Procesar de a UN dia a la vez para evitar timeout
    for (const dia of dias) {
      const inicio = dia.startTime || "09:00"
      const fin = dia.endTime || "18:00"
      const [hI, mI] = inicio.split(":").map(Number)
      const [hF, mF] = fin.split(":").map(Number)
      let minActual = hI * 60 + mI
      const minFin = hF * 60 + mF

      const batch = []
      while (minActual + duracion <= minFin) {
        const h1 = Math.floor(minActual / 60).toString().padStart(2, "0")
        const m1 = (minActual % 60).toString().padStart(2, "0")
        const h2 = Math.floor((minActual + duracion) / 60).toString().padStart(2, "0")
        const m2 = ((minActual + duracion) % 60).toString().padStart(2, "0")
        batch.push({
          specialistId: id,
          date: dia.date,
          startTime: `${h1}:${m1}`,
          endTime: `${h2}:${m2}`,
          status: "LIBRE",
        })
        minActual += duracion
      }

      if (batch.length > 0) {
        await prisma.slot.createMany({ data: batch })
        totalCreados += batch.length
      }
    }

    return NextResponse.json({ ok: true, totalCreados })
  } catch (error) {
    console.error("Error generando slots:", error)
    return NextResponse.json({ error: "Error interno: " + (error as Error).message }, { status: 500 })
  }
}