import { NextResponse } from "next/server"
import { z } from "zod"
import { getUsuario, withTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  dias: z.array(z.object({
    date: z.string(),
    active: z.boolean(),
    startTime: z.string().nullable().optional(),
    endTime: z.string().nullable().optional(),
    breakStart: z.string().nullable().optional(),
    breakEnd: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })),
})

async function verificarEspecialista(id: string, u: any) {
  return prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
  })
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

  const dias = await prisma.specialistDay.findMany({
    where: { specialistId: id },
    orderBy: { date: "asc" },
  })

  return NextResponse.json({ dias })
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
    for (const d of body.dias) {
      const fecha = new Date(d.date + "T00:00:00.000Z")
      await tx.specialistDay.upsert({
        where: { specialistId_date: { specialistId: id, date: fecha } },
        update: {
          active: d.active,
          startTime: d.startTime || null,
          endTime: d.endTime || null,
          breakStart: d.breakStart || null,
          breakEnd: d.breakEnd || null,
          notes: d.notes || null,
        },
        create: {
          specialistId: id,
          date: fecha,
          active: d.active,
          startTime: d.startTime || null,
          endTime: d.endTime || null,
          breakStart: d.breakStart || null,
          breakEnd: d.breakEnd || null,
          notes: d.notes || null,
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}