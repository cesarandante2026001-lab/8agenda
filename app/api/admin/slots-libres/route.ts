import { NextResponse } from "next/server"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const u = await currentUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const permitidos = ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"]
  if (!permitidos.includes(u.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const specialistId = searchParams.get("specialistId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  if (!specialistId || !desde || !hasta) {
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 })
  }

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