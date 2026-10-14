import Link from "next/link"
import { prisma } from "@/lib/prisma"
import BotonAnularCita from "./BotonAnularCita"

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

export default async function AdminCitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; esp?: string }>
}) {
  const sp = await searchParams
  const filtroEstado = sp.estado || "activas"
  const filtroEsp = sp.esp || ""

  const where: any = {}
  if (filtroEstado === "activas") {
    where.status = { in: ["RESERVADA", "CONFIRMADA"] }
  } else if (filtroEstado === "canceladas") {
    where.status = "CANCELADA"
  } else if (filtroEstado === "atendidas") {
    where.status = "ATENDIDA"
  } else if (filtroEstado === "no_show") {
    where.status = "NO_SHOW"
  }
  if (filtroEsp) {
    where.specialist = { specialtyId: filtroEsp }
  }

  const [citas, especialidades] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: [{ slot: { date: "desc" } }, { slot: { startTime: "desc" } }],
      take: 200,
      include: {
        specialist: { include: { specialty: true } },
        slot: true,
      },
    }),
    prisma.specialty.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ])

  const tabs = [
    { key: "activas", label: "Activas" },
    { key: "atendidas", label: "Atendidas" },
    { key: "canceladas", label: "Canceladas" },
    { key: "no_show", label: "No-show" },
    { key: "todas", label: "Todas" },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
        >
          Volver al panel
        </Link>
      </div>

      <h1 className="text-3xl font-light mb-8">
        Citas <span className="font-semibold">recientes</span>
      </h1>

      {/* Tabs de estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => {
          const activo = filtroEstado === t.key
          const qs = new URLSearchParams()
          qs.set("estado", t.key)
          if (filtroEsp) qs.set("esp", filtroEsp)
          return (
            <Link
              key={t.key}
              href={`/admin/citas?${qs.toString()}`}
              className={
                "px-4 py-2 text-xs uppercase tracking-wider rounded border transition " +
                (activo
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-700 hover:border-black")
              }
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Filtro por especialidad */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/admin/citas?estado=${filtroEstado}`}
          className={
            "px-3 py-1.5 text-xs rounded border transition " +
            (!filtroEsp
              ? "bg-gray-100 border-gray-400"
              : "border-gray-200 text-gray-600 hover:border-black")
          }
        >
          Todas las especialidades
        </Link>
        {especialidades.map((e) => {
          const activo = filtroEsp === e.id
          return (
            <Link
              key={e.id}
              href={`/admin/citas?estado=${filtroEstado}&esp=${e.id}`}
              className={
                "px-3 py-1.5 text-xs rounded border transition " +
                (activo
                  ? "bg-gray-100 border-gray-400"
                  : "border-gray-200 text-gray-600 hover:border-black")
              }
            >
              {e.name}
            </Link>
          )
        })}
      </div>

      {citas.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay citas con estos filtros.</p>
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
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 whitespace-nowrap">{formatearFecha(c.slot.date)}</td>
                  <td className="px-4 py-3">{c.slot.startTime}</td>
                  <td className="px-4 py-3">
                    <div>{c.patientName}</div>
                    <div className="text-xs text-gray-500">{c.patientEmail}</div>
                    <div className="text-xs text-gray-500">{c.patientPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.specialist.name}</div>
                    <div className="text-xs text-gray-500">{c.specialist.specialty.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.status === "CANCELADA"
                          ? "text-red-600 text-xs uppercase tracking-wider"
                          : c.status === "ATENDIDA"
                          ? "text-green-600 text-xs uppercase tracking-wider"
                          : c.status === "NO_SHOW"
                          ? "text-orange-600 text-xs uppercase tracking-wider"
                          : "text-gray-700 text-xs uppercase tracking-wider"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status !== "CANCELADA" && c.status !== "ATENDIDA" && (
                      <BotonAnularCita id={c.id} />
                    )}
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