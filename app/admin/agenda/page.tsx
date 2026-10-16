import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"

export const dynamic = "force-dynamic"

const DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

function inicioSemana(d: Date) {
  const dia = d.getUTCDay()
  const diff = dia === 0 ? -6 : 1 - dia
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  r.setUTCDate(r.getUTCDate() + diff)
  return r
}

function addDias(d: Date, n: number) {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + n)
  return r
}

function fmtISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ esp?: string; sem?: string }>
}) {
  const sp = await searchParams
  const espId = sp.esp || ""

  const base = sp.sem ? new Date(sp.sem + "T00:00:00.000Z") : new Date()
  const lunes = inicioSemana(base)
  const domingo = addDias(lunes, 6)
  const fin = addDias(domingo, 1)

  const u = await getUsuario()
  const filtroTenant = withTenant(u)

  const especialistas = await prisma.specialist.findMany({
    where: { active: true, ...filtroTenant, ...(espId ? { id: espId } : {}) },
    orderBy: { name: "asc" },
    include: { specialty: true },
  })

  const citas = await prisma.appointment.findMany({
    where: {
      ...filtroTenant,
      status: { in: ["RESERVADA", "CONFIRMADA", "EN_SALA", "ATENDIDA", "NO_SHOW"] },
      slot: { date: { gte: lunes, lt: fin } },
      ...(espId ? { specialistId: espId } : {}),
    },
    include: { slot: true, specialist: true },
  })

  const todasEspecialidades = await prisma.specialty.findMany({
    where: { active: true, ...filtroTenant },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  })

  const grilla: Record<string, Record<string, typeof citas>> = {}
  for (const esp of especialistas) {
    grilla[esp.id] = {}
    for (let i = 0; i < 7; i++) {
      grilla[esp.id][fmtISO(addDias(lunes, i))] = []
    }
  }
  for (const c of citas) {
    const key = fmtISO(c.slot.date)
    if (grilla[c.specialistId] && grilla[c.specialistId][key]) {
      grilla[c.specialistId][key].push(c)
    }
  }

  const semAnterior = fmtISO(addDias(lunes, -7))
  const semSiguiente = fmtISO(addDias(lunes, 7))
  const titulo = `${lunes.getUTCDate()} ${DIAS[0]} al ${domingo.getUTCDate()} ${DIAS[6]}`

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-light">
          Semana <span className="font-semibold">{titulo}</span>
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/agenda/nueva${espId ? "?esp=" + espId : ""}`}
            className="bg-black text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-gray-800"
          >
            + Nueva cita
          </Link>
          <Link
            href={`/admin/agenda?sem=${semAnterior}${espId ? "&esp=" + espId : ""}`}
            className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-wider hover:border-black"
          >
            Anterior
          </Link>
          <Link
            href={`/admin/agenda${espId ? "?esp=" + espId : ""}`}
            className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-wider hover:border-black"
          >
            Hoy
          </Link>
          <Link
            href={`/admin/agenda?sem=${semSiguiente}${espId ? "&esp=" + espId : ""}`}
            className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-wider hover:border-black"
          >
            Siguiente
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/admin/agenda?sem=${fmtISO(lunes)}`}
          className={
            "px-3 py-1.5 text-xs rounded border transition " +
            (!espId
              ? "bg-gray-100 border-gray-400"
              : "border-gray-200 text-gray-600 hover:border-black")
          }
        >
          Todos
        </Link>
        {todasEspecialidades.map((e) => {
          const activo = espId === e.id
          return (
            <Link
              key={e.id}
              href={`/admin/agenda?sem=${fmtISO(lunes)}&esp=${e.id}`}
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

      {especialistas.length === 0 ? (
        <p className="text-sm text-gray-500">No hay especialistas activos.</p>
      ) : (
        <div className="space-y-8">
          {especialistas.map((esp) => (
            <div key={esp.id}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-medium">{esp.name}</h2>
                <span className="text-xs text-gray-500">{esp.specialty.name}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DIAS.map((d, i) => {
                  const fecha = addDias(lunes, i)
                  const key = fmtISO(fecha)
                  const lista = grilla[esp.id][key] || []
                  const esHoy = fmtISO(new Date()) === key
                  return (
                    <div
                      key={key}
                      className={
                        "border rounded-lg p-2 min-h-[140px] " +
                        (esHoy ? "border-black bg-gray-50" : "border-gray-200")
                      }
                    >
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
                        <span>{d}</span>
                        <span className="text-gray-700">{fecha.getUTCDate()}</span>
                      </div>
                      <div className="space-y-1">
                        {lista.map((c) => (
                          <Link
                            key={c.id}
                            href={`/admin/agenda/${c.id}`}
                            className="block text-[11px] leading-tight border-l-2 border-black pl-2 py-1 hover:bg-gray-100 transition"
                            title={`${c.patientName} - ${c.patientPhone}`}
                          >
                            <div className="font-medium">{c.slot.startTime}</div>
                            <div className="text-gray-600 truncate">{c.patientName}</div>
                          </Link>
                        ))}
                        {lista.length === 0 && (
                          <div className="text-[11px] text-gray-300">-</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}