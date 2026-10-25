import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUsuario, withTenant } from "@/lib/tenant"
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

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const u = await getUsuario()

  const cliente = await prisma.patient.findFirst({
    where: { id, ...withTenant(u) },
    include: {
      atenciones: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          specialist: { include: { specialty: true } },
          recetas: { orderBy: { orden: "asc" } },
          examenes: { orderBy: { orden: "asc" } },
        },
      },
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

  if (!cliente) notFound()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/admin/clientes"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
        >
          Volver a clientes
        </Link>
      </div>

      <h1 className="text-3xl font-light mb-1">{cliente.name}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {cliente.rut ? `RUT ${cliente.rut} - ` : ""}
        Ficha creada el {formatearFecha(cliente.createdAt)}
      </p>

      <FichaForm cliente={{
        id: cliente.id,
        name: cliente.name,
        rut: cliente.rut || "",
        birthDate: cliente.birthDate ? cliente.birthDate.toISOString().slice(0, 10) : "",
        email: cliente.email || "",
        phone: cliente.phone || "",
        address: cliente.address || "",
        city: cliente.city || "",
        prevision: cliente.prevision || "",
        contactoEmergencia: cliente.contactoEmergencia || "",
        telefonoEmergencia: cliente.telefonoEmergencia || "",
        NOTAS: cliente.NOTAS || "",
        enfermedadesCronicas: cliente.enfermedadesCronicas || "",
        INSUMOS: cliente.INSUMOS || "",
        antecedentesFamiliares: cliente.antecedentesFamiliares || "",
        grupoSanguineo: cliente.grupoSanguineo || "",
        NOTAS: cliente.NOTAS || "",
      }} />

      <div className="mt-12">
        <h2 className="text-xl font-light mb-4">
          Atenciones
        </h2>
        {cliente.atenciones.length === 0 ? (
          <p className="text-sm text-gray-500">Sin atenciones registradas.</p>
        ) : (
          <div className="space-y-3">
            {cliente.atenciones.map((a) => (
              <details key={a.id} className="border border-gray-200 rounded-lg">
                <summary className="cursor-pointer px-5 py-4 hover:bg-gray-50">
                  <span className="font-medium">{formatearFecha(a.createdAt)}</span>
                  <span className="text-sm text-gray-500 ml-3">{a.specialist.name}</span>
                  {a.diagnostico && (
                    <span className="text-sm text-gray-600 ml-3 truncate">
                      - {a.diagnostico.slice(0, 80)}
                    </span>
                  )}
                </summary>
                <div className="px-5 py-4 border-t border-gray-100 space-y-3 text-sm">
                  <div className="flex justify-end mb-2">
                    <a
                      href={`/atenciones/${a.id}/imprimir`}
                      target="_blank"
                      className="text-xs uppercase tracking-wider border border-gray-300 px-3 py-1.5 hover:border-black"
                    >
                      Imprimir / Descargar
                    </a>
                  </div>
                  <VerCampo label="Motivo" valor={a.motivoConsulta} />
                  <VerCampo label="Anamnesis" valor={a.anamnesis} />
                  <VerCampo label="Examen fisico" valor={a.examenFisico} />
                  <VerCampo label="Diagnostico" valor={a.diagnostico} />
                  <VerCampo label="Indicaciones" valor={a.indicaciones} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                    <VerCampo label="Peso" valor={a.peso} />
                    <VerCampo label="Talla" valor={a.talla} />
                    <VerCampo label="PA" valor={a.presionArterial} />
                    <VerCampo label="FC" valor={a.frecuenciaCardiaca} />
                    <VerCampo label="Temperatura" valor={a.temperatura} />
                    <VerCampo label="SatO2" valor={a.saturacion} />
                    <VerCampo label="FR" valor={a.frecuenciaResp} />
                  </div>

                  {a.recetas.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Recomendacioness</p>
                      <div className="space-y-2">
                        {a.recetas.map((r: any) => (
                          <div key={r.id} className="border-l-2 border-blue-400 pl-3 py-1">
                            <p className="font-medium">{r.medicamento}</p>
                            <p className="text-xs text-gray-600">
                              {[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(" - ")}
                            </p>
                            {r.indicaciones && <p className="text-xs text-gray-500 mt-1">{r.indicaciones}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {a.examenes.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Examenes solicitados</p>
                      <ul className="space-y-1">
                        {a.examenes.map((x: any) => (
                          <li key={x.id} className="border-l-2 border-orange-400 pl-3 py-1">
                            <p className="font-medium text-sm">{x.nombre}</p>
                            {x.notas && <p className="text-xs text-gray-500">{x.notas}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.recetas.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Recomendacioness</p>
                      <div className="space-y-2">
                        {a.recetas.map((r: any) => (
                          <div key={r.id} className="border-l-2 border-blue-400 pl-3 py-1">
                            <p className="font-medium">{r.medicamento}</p>
                            <p className="text-xs text-gray-600">
                              {[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(" - ")}
                            </p>
                            {r.indicaciones && <p className="text-xs text-gray-500 mt-1">{r.indicaciones}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {a.examenes.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Examenes solicitados</p>
                      <ul className="space-y-1">
                        {a.examenes.map((x: any) => (
                          <li key={x.id} className="border-l-2 border-orange-400 pl-3 py-1">
                            <p className="font-medium text-sm">{x.nombre}</p>
                            {x.notas && <p className="text-xs text-gray-500">{x.notas}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-light mb-4">
          Historial de servicios
        </h2>
        {cliente.appointments.length === 0 ? (
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
                {cliente.appointments.map((a) => (
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
function VerCampo({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">{label}</p>
      <p className="whitespace-pre-wrap">{valor}</p>
    </div>
  )
}