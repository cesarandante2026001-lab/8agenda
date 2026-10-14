import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const ADMIN_ROLES: UserRole[] = ["SUPERADMIN", "OWNER", "ADMIN"]

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole)
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params
  const url = new URL(req.url)
  const year = Number(url.searchParams.get("year"))
  const month = Number(url.searchParams.get("month")) // 1-12

  if (!year || !month) {
    return NextResponse.json({ error: "Falta year o month" }, { status: 400 })
  }

  const desde = new Date(Date.UTC(year, month - 1, 1))
  const hasta = new Date(Date.UTC(year, month, 1))

  const dias = await prisma.specialistDay.findMany({
    where: {
      specialistId: id,
      date: { gte: desde, lt: hasta },
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json({ dias })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // body.dias: [{ date: "2026-10-15", active, startTime, endTime, breakStart, breakEnd }]
  const dias = Array.isArray(body.dias) ? body.dias : []

  try {
    for (const d of dias) {
      const fecha = new Date(d.date + "T00:00:00.000Z")

      await prisma.specialistDay.upsert({
        where: {
          specialistId_date: {
            specialistId: id,
            date: fecha,
          },
        },
        create: {
          specialistId: id,
          date: fecha,
          active: Boolean(d.active),
          startTime: d.startTime || null,
          endTime: d.endTime || null,
          breakStart: d.breakStart || null,
          breakEnd: d.breakEnd || null,
        },
        update: {
          active: Boolean(d.active),
          startTime: d.startTime || null,
          endTime: d.endTime || null,
          breakStart: d.breakStart || null,
          breakEnd: d.breakEnd || null,
        },
      })
    }

    return NextResponse.json({ ok: true, guardados: dias.length })
  } catch (error) {
    console.error("Error guardando dias:", error)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const user = session.user as { role?: string }
  if (!isAdminRole(user.role)) return NextResponse.json({ error: "Solo admin" }, { status: 403 })

  const { id } = await params
  const url = new URL(req.url)
  const year = Number(url.searchParams.get("year"))
  const month = Number(url.searchParams.get("month"))

  if (!year || !month) {
    return NextResponse.json({ error: "Falta year o month" }, { status: 400 })
  }

  const desde = new Date(Date.UTC(year, month - 1, 1))
  const hasta = new Date(Date.UTC(year, month, 1))

  const res = await prisma.specialistDay.deleteMany({
    where: {
      specialistId: id,
      date: { gte: desde, lt: hasta },
    },
  })

  return NextResponse.json({ ok: true, eliminados: res.count })
}