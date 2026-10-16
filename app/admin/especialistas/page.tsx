import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"
import EspecialistasClient from "./EspecialistasClient"

export const dynamic = "force-dynamic"

export default async function EspecialistasPage() {
  const u = await getUsuario()
  const filtro = withTenant(u)

  const [especialistas, especialidades] = await Promise.all([
    prisma.specialist.findMany({
      where: { ...filtro },
      include: { specialty: true },
      orderBy: { name: "asc" },
    }),
    prisma.specialty.findMany({
      where: { active: true, ...filtro },
      orderBy: { order: "asc" },
    }),
  ])

  const dataEsp = especialistas.map((e) => ({
    id: e.id,
    name: e.name,
    rut: e.rut,
    email: e.email,
    phone: e.phone,
    specialtyId: e.specialtyId,
    specialtyName: e.specialty.name,
    duracionConsulta: e.duracionConsulta,
    anticipacionMinima: e.anticipacionMinima,
    anticipacionMaxima: e.anticipacionMaxima,
    active: e.active,
  }))

  const dataCat = especialidades.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return <EspecialistasClient initial={dataEsp} especialidades={dataCat} />
}