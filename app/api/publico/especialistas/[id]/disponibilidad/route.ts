import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const hoy = new Date()
  hoy.setUTCHours(0, 0, 0, 0)

  const hasta = new Date(hoy)
  hasta.setUTCDate(hasta.getUTCDate() + 60)

  const slots = await prisma.slot.findMany({
    where: {
      specialistId: id,
      date: { gte: hoy, lt: hasta },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  })

  const porDia: Record<string, { date: string; slots: { id: string; startTime: string; endTime: string; status: string }[] }> = {}

  for (const s of slots) {
    const iso = s.date.toISOString().slice(0, 10)
    if (!porDia[iso]) porDia[iso] = { date: iso, slots: [] }
    porDia[iso].slots.push({ id: s.id, startTime: s.startTime, endTime: s.endTime, status: s.status })
  }

  return NextResponse.json({ dias: Object.values(porDia) })
}