import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"
import HorariosClient from "./HorariosClient"

export const dynamic = "force-dynamic"

export default async function HorariosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const u = await getUsuario()

  const especialista = await prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
    include: {
      specialty: true,
      availabilities: true,
      breaks: true,
    },
  })

  if (!especialista) notFound()

  const data = {
    id: especialista.id,
    name: especialista.name,
    specialtyName: especialista.specialty.name,
    duracionConsulta: especialista.duracionConsulta,
    availabilities: especialista.availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
    breaks: especialista.breaks.map((b) => ({
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      label: b.label,
    })),
  }

  return <HorariosClient especialista={data} />
}