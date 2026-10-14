import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [especialidades, especialistas] = await Promise.all([
    prisma.specialty.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.specialist.findMany({
      where: { active: true },
      include: { specialty: true },
      orderBy: { name: "asc" },
    }),
  ])

  return NextResponse.json({
    especialidades: especialidades.map((e) => ({
      id: e.id,
      name: e.name,
      color: e.color,
    })),
    especialistas: especialistas.map((e) => ({
      id: e.id,
      name: e.name,
      specialtyId: e.specialtyId,
      specialtyName: e.specialty.name,
      specialtyColor: e.specialty.color,
    })),
  })
}