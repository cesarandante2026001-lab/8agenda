import { prisma } from "@/lib/prisma"
import EspecialidadesClient from "./EspecialidadesClient"

export const dynamic = "force-dynamic"

export default async function EspecialidadesPage() {
  const especialidades = await prisma.specialty.findMany({
    orderBy: { order: "asc" },
  })

  const data = especialidades.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    color: e.color,
    order: e.order,
    active: e.active,
  }))

  return <EspecialidadesClient initial={data} />
}