import { prisma } from "./prisma"

type Resultado = {
  creados: number
  eliminados: number
  dias: number
}

// Convierte "09:00" a minutos (540)
function timeAMinutos(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// Convierte minutos a "09:00"
function minutosATime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0")
}

export async function generarSlotsDeEspecialista(
  specialistId: string,
  desde: Date,
  hasta: Date
): Promise<Resultado> {
  const especialista = await prisma.specialist.findUnique({
    where: { id: specialistId },
  })

  if (!especialista) {
    throw new Error("Especialista no existe")
  }

  const duracion = especialista.duracionConsulta

  // Traer los dias configurados en el rango
  const dias = await prisma.specialistDay.findMany({
    where: {
      specialistId,
      date: { gte: desde, lt: hasta },
      active: true,
    },
    orderBy: { date: "asc" },
  })

  // Borrar los slots existentes en ese rango (los regeneramos)
  const eliminados = await prisma.slot.deleteMany({
    where: {
      specialistId,
      date: { gte: desde, lt: hasta },
      status: "LIBRE",
    },
  })

  let creados = 0

  for (const dia of dias) {
    if (!dia.startTime || !dia.endTime) continue

    const inicio = timeAMinutos(dia.startTime)
    const fin = timeAMinutos(dia.endTime)
    const colStart = dia.breakStart ? timeAMinutos(dia.breakStart) : null
    const colEnd = dia.breakEnd ? timeAMinutos(dia.breakEnd) : null

    let cursor = inicio

    while (cursor + duracion <= fin) {
      const slotInicio = cursor
      const slotFin = cursor + duracion

      // Saltar si choca con la colacion
      if (colStart !== null && colEnd !== null) {
        const chocaColacion = slotInicio < colEnd && slotFin > colStart
        if (chocaColacion) {
          cursor = colEnd
          continue
        }
      }

      await prisma.slot.create({
        data: {
          specialistId,
          date: dia.date,
          startTime: minutosATime(slotInicio),
          endTime: minutosATime(slotFin),
          status: "LIBRE",
        },
      })
      creados++
      cursor += duracion
    }
  }

  return {
    creados,
    eliminados: eliminados.count,
    dias: dias.length,
  }
}