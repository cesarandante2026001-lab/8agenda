import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"
import BotonMarcar from "./citas/BotonMarcar"

export const dynamic = "force-dynamic"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Santiago",
  })
}

export default async function EspecialistaPage() {
  const u = await currentUser()
  if (!u) redirect("/login?callbackUrl=/especialista")

  const citas = await prisma.appointment.findMany({
    where: { status: { in: ["RESERVADA", "CONFIRMADA"] } },
    orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
    take: 200,
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  return (
    <div>
      <h1 className="text-3xl font-light mb-2">Citas activas</h1>
      <p className="text-sm text-gray-500 mb-8">
        Todas las citas reservadas y confirmadas.
      </p>

      {citas.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">No hay citas activas.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Hora</th>
                <th className="text-left px-4 py-3">Paciente</th>
                <th className="text-left px-4 py-3">Especialista</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 whitespace-nowrap">{formatearFecha(c.slot.date)}</td>
                  <td className="px-4 py-3">{c.slot.startTime}</td>
                  <td className="px-4 py-3">
                    <div>{c.patientName}</div>
                    <div className="text-xs text-gray-500">{c.patientPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.specialist.name}</div>
                    <div className="text-xs text-gray-500">{c.specialist.specialty.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase tracking-wider text-gray-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BotonMarcar id={c.id} estado={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <Link href="/especialista/hoy" className="text-xs uppercase tracking-widest text-gray-500 hover:text-black">
          Ver solo las de hoy
        </Link>
      </div>
    </div>
  )
}