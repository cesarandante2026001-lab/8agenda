import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  accion: z.enum(["ATENDIDA", "NO_SHOW", "CONFIRMADA", "RESERVADA"]),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const permitidos = ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST", "SPECIALIST"]
  if (!permitidos.includes(u.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { id } = await params
  const { accion } = schema.parse(await req.json())

  const cita = await prisma.appointment.findUnique({
    where: { id },
    include: { specialist: true },
  })
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

  if (u.role === "SPECIALIST" && cita.specialist.userId !== u.id) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const actualizada = await prisma.appointment.update({
    where: { id },
    data: { status: accion },
  })

  return NextResponse.json({ ok: true, appointment: actualizada })
}