import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"
import DiasClient from "./DiasClient"

export const dynamic = "force-dynamic"

export default async function DiasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const u = await getUsuario()

  const especialista = await prisma.specialist.findFirst({
    where: { id, ...withTenant(u) },
    include: { specialty: true },
  })

  if (!especialista) notFound()

  return (
    <DiasClient
      especialista={{
        id: especialista.id,
        name: especialista.name,
        specialtyName: especialista.specialty.name,
        duracionConsulta: especialista.duracionConsulta,
      }}
    />
  )
}