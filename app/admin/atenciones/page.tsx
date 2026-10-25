import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"

export const dynamic = "force-dynamic"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function AtencionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const busqueda = (q || "").trim()

  const u = await getUsuario()
  const filtroTenant = withTenant(u)

  const atenciones = await prisma.atencion.findMany({
    where: {
      ...filtroTenant,
      ...(busqueda
        ? {
            OR: [
              { patient: { name: { contains: busqueda, mode: "insensitive" } } },
              { patient: { rut: { contains: busqueda, mode: "insensitive" } } },
              { evaluacion: { contains: busqueda, mode: "insensitive" } },
              { motivoConsulta: { contains: busqueda, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      patient: true,
      specialist: { include: { specialty: true } },
      appointment: { include: { slot: true } },
      _count: { select: { recetas: true, examenes: true } },
    },
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-light mb-2">
        Atenciones
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {atenciones.length} resultado{atenciones.length === 1 ? "" : "s"}
      </p>

      <form className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por cliente, RUT, evaluacion o motivo..."
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
        />
      </form>

      {atenciones.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">
            {busqueda ? "Sin resultados para esa busqueda." : "Aun no hay atenciones registradas."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Profesional</th>
                <th className="text-left px-4 py-3">Evaluacion</th>
                <th className="text-left px-4 py-3">Contenido</th>
                <th className="text-right px-4 py-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {atenciones.map((a) => (
                <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatearFecha(a.appointment.slot.date)}
                    <div className="text-xs text-gray-500">{a.appointment.slot.startTime}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.patient.name}</div>
                    <div className="text-xs text-gray-500">{a.patient.rut || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{a.specialist.name}</div>
                    <div className="text-xs text-gray-500">{a.specialist.specialty.name}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate">{a.evaluacion || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {a._count.recetas > 0 && <span className="mr-3">{a._count.recetas} recomendaciÃƒÆ’Ã‚Â³n{a._count.recetas === 1 ? "" : "s"}</span>}
                    {a._count.examenes > 0 && <span>{a._count.examenes} examen{a._count.examenes === 1 ? "" : "es"}</span>}
                    {a._count.recetas === 0 && a._count.examenes === 0 && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/atenciones/${a.id}/imprimir`}
                      target="_blank"
                      className="text-xs uppercase tracking-wider text-black hover:underline"
                    >
                      Ver / Imprimir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}