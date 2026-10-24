import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/auth-helpers-extra"
import { getUsuario } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import BotonMarcar from "./citas/BotonMarcar"

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

export default async function EspecialistaPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const u = await currentUser()
  if (!u) redirect("/login?callbackUrl=/especialista")

  const sp = await searchParams
  const ver = sp.ver || "todas"

  const esAdmin = ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(u.role)

  let where: any = {}
  // Filtrar por tenant si no es superadmin
  const tenantFiltro = u.role === "SUPERADMIN" ? null : (u as any).tenantId
  if (tenantFiltro) where.tenantId = tenantFiltro

  if (ver === "activas") {
    where.status = { in: ["RESERVADA", "CONFIRMADA", "EN_SALA"] }
  } else if (ver === "atendidas") {
    where.status = "ATENDIDA"
  } else if (ver === "no_show") {
    where.status = "NO_SHOW"
  } else if (ver === "todas") {
    where.status = { in: ["RESERVADA", "CONFIRMADA", "EN_SALA", "ATENDIDA", "NO_SHOW"] }
  }

  if (!esAdmin) {
    const esp = await prisma.specialist.findFirst({ where: { userId: u.id } })
    if (!esp) {
      return (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">
            Tu usuario no esta vinculado a ningun especialista. Contacta al administrador.
          </p>
        </div>
      )
    }
    where.specialistId = esp.id
  }

  const citas = await prisma.appointment.findMany({
    where,
    orderBy: [{ slot: { date: "desc" } }, { slot: { startTime: "desc" } }],
    take: 200,
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
      atencion: true,
    },
  })

  const filtros = [
    { key: "todas", label: "Todas" },
    { key: "activas", label: "Activas" },
    { key: "atendidas", label: "Atendidas" },
    { key: "no_show", label: "No-show" },
  ]

  return (
    <div>
      <h1 className="text-3xl font-light mb-2">Mis citas</h1>
      <p className="text-sm text-gray-500 mb-6">
        {esAdmin ? "Vista admin: muestra citas de todos los especialistas." : "Aqui ves tus citas."}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {filtros.map((f) => {
          const activo = ver === f.key
          return (
            <Link
              key={f.key}
              href={`/especialista?ver=${f.key}`}
              className={
                "px-4 py-2 text-xs uppercase tracking-wider rounded border transition " +
                (activo
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-700 hover:border-black")
              }
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {citas.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">No hay citas en este filtro.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Hora</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Especialista</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => {
                const atendida = c.status === "ATENDIDA"
                const cancelada = c.status === "CANCELADA"
                const noShow = c.status === "NO_SHOW"
                const finalizada = atendida || cancelada || noShow

                return (
                  <tr
                    key={c.id}
                    className={
                      "border-t border-gray-100 " +
                      (atendida ? "bg-gray-50 text-gray-500" : "")
                    }
                  >
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
                      <span
                        className={
                          "text-xs uppercase tracking-wider " +
                          (atendida ? "text-green-700" : noShow ? "text-orange-700" : "text-gray-700")
                        }
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      {finalizada ? (
                        <a
                          href={`/especialista/citas/${c.id}/atender`}
                          className="text-xs uppercase tracking-wider text-blue-600 hover:underline"
                        >
                          {atendida ? "Ver atencion" : "Ver detalle"}
                        </a>
                      ) : (
                        <>
                          <a
                            href={`/especialista/citas/${c.id}/atender`}
                            className="text-xs uppercase tracking-wider text-black hover:underline"
                          >
                            Atender
                          </a>
                          <BotonMarcar id={c.id} estado={c.status} />
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
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