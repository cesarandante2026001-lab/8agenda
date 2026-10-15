import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FichaForm from "./FichaForm"

export const dynamic = "force-dynamic"

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "-"
  return fecha.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function FichaPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const paciente = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { slot: { date: "desc" } },
        take: 20,
        include: {
          specialist: { include: { specialty: true } },
          slot: true,
        },
      },
    },
  })

  if (!paciente) notFound()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/admin/pacientes"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
        >
          Volver a pacientes
        </Link>
      </div>

      <h1 className="text-3xl font-light mb-1">{paciente.name}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {paciente.rut ? `RUT ${paciente.rut} - ` : ""}
        Ficha creada el {formatearFecha(paciente.createdAt)}
      </p>

      <FichaForm paciente={{
        id: paciente.id,
        name: paciente.name,
        rut: paciente.rut || "",
        birthDate: paciente.birthDate ? paciente.birthDate.toISOString().slice(0, 10) : "",
        email: paciente.email || "",
        phone: paciente.phone || "",
        address: paciente.address || "",
        city: paciente.city || "",
        prevision: paciente.prevision || "",
        contactoEmergencia: paciente.contactoEmergencia || "",
        telefonoEmergencia: paciente.telefonoEmergencia || "",
        alergias: paciente.alergias || "",
        enfermedadesCronicas: paciente.enfermedadesCronicas || "",
        medicamentos: paciente.medicamentos || "",
        antecedentesFamiliares: paciente.antecedentesFamiliares || "",
        grupoSanguineo: paciente.grupoSanguineo || "",
        observaciones: paciente.observaciones || "",
      }} />

      <div className="mt-12">
        <h2 className="text-xl font-light mb-4">
          Historial de <span className="font-semibold">citas</span>
        </h2>
        {paciente.appointments.length === 0 ? (
          <p className="text-sm text-gray-500">Sin citas registradas.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Hora</th>
                  <th className="text-left px-4 py-3">Especialista</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paciente.appointments.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{formatearFecha(a.slot.date)}</td>
                    <td className="px-4 py-3">{a.slot.startTime}</td>
                    <td className="px-4 py-3">
                      {a.specialist.name}
                      <div className="text-xs text-gray-500">{a.specialist.specialty.name}</div>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider">
                      {a.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}