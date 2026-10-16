import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  dias: z.array(z.object({
    dayOfWeek: z.enum(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })),
  colacion: z.object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
})

async function verificarEspecialista(id: string, u: any) {
  const esp = await prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
  })
  return esp
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const esp = await verificarEspecialista(id, u)
  if (!esp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const [availabilities, breaks] = await Promise.all([
    prisma.availability.findMany({ where: { specialistId: id } }),
    prisma.break.findMany({ where: { specialistId: id } }),
  ])

  return NextResponse.json({ availabilities, breaks })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUsuario()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const esp = await verificarEspecialista(id, u)
  if (!esp) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const body = schema.parse(await req.json())

  await prisma.$transaction(async (tx) => {
    await tx.availability.deleteMany({ where: { specialistId: id } })
    await tx.break.deleteMany({ where: { specialistId: id } })

    if (body.dias.length > 0) {
      await tx.availability.createMany({
        data: body.dias.map((d) => ({
          specialistId: id,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
        })),
      })
    }

    if (body.colacion) {
      await tx.break.create({
        data: {
          specialistId: id,
          dayOfWeek: "MONDAY",
          startTime: body.colacion.startTime,
          endTime: body.colacion.endTime,
          label: "Colacion",
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}