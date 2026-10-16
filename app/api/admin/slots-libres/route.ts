import { NextResponse } from "next/server"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const specialistId = searchParams.get("specialistId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  if (!specialistId || !desde || !hasta) {
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 })
  }

  // Verificar que el especialista sea del tenant
  const esp = await prisma.specialist.findFirst({
    where: { id: specialistId, ...withTenant(u) },
  })
  if (!esp) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const slots = await prisma.slot.findMany({
    where: {
      specialistId,
      status: "LIBRE",
      date: {
        gte: new Date(desde + "T00:00:00.000Z"),
        lt: new Date(hasta + "T00:00:00.000Z"),
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  })

  return NextResponse.json({ slots })
}