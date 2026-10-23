import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"
import BotonAnularCita from "../../citas/BotonAnularCita"

export const dynamic = "force-dynamic"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function DetalleCitaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const u = await getUsuario()

  const cita = await prisma.appointment.findFirst({
    where: { id, ...withTenant(u) },
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  if (!cita) notFound()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/admin/agenda"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
        >
          Volver a la agenda
        </Link>
      </div>

      <h1 className="text-3xl font-light mb-8">
        Detalle de la <span className="font-semibold">cita</span>
      </h1>

      <div className="border border-gray-200 rounded-lg p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Fecha y hora</p>
        <p className="text-lg">{formatearFecha(cita.slot.date)}</p>
        <p className="text-2xl font-medium">{cita.slot.startTime} - {cita.slot.endTime}</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Cliente</p>
        <p className="text-lg mb-2">{cita.patientName}</p>
        <div className="text-sm space-y-1">
          {cita.patientRut && (
            <p><span className="text-gray-500">RUT:</span> {cita.patientRut}</p>
          )}
          <p><span className="text-gray-500">Email:</span> {cita.patientEmail}</p>
          <p><span className="text-gray-500">Telefono:</span> {cita.patientPhone}</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Profesional</p>
        <p className="text-lg">{cita.specialist.name}</p>
        <p className="text-sm text-gray-500">{cita.specialist.specialty.name}</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Estado</p>
        <p className="text-sm uppercase tracking-wider">{cita.status}</p>
      </div>

      {cita.notes && (
        <div className="border border-gray-200 rounded-lg p-6 mb-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Notas</p>
          <p className="text-sm whitespace-pre-wrap">{cita.notes}</p>
        </div>
      )}

      {cita.status !== "CANCELADA" && cita.status !== "ATENDIDA" && (
        <div className="mt-8 text-center">
          <BotonAnularCita id={cita.id} />
        </div>
      )}
    </div>
  )
}