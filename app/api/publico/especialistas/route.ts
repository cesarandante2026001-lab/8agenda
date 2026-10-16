import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const h = await headers()
  const slug = h.get("x-tenant-slug")

  // Si viene de un subdominio, filtrar por ese tenant
  // Si no hay subdominio, devolver todos (modo desarrollo)
  let tenantId: string | null = null
  if (slug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug } })
    if (!tenant) {
      return NextResponse.json({ especialidades: [], especialistas: [] })
    }
    tenantId = tenant.id
  }

  const filtro = tenantId ? { tenantId } : {}

  const [especialidades, especialistas] = await Promise.all([
    prisma.specialty.findMany({
      where: { active: true, ...filtro },
      orderBy: { order: "asc" },
    }),
    prisma.specialist.findMany({
      where: { active: true, ...filtro },
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