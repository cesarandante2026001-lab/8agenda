import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import BotonImprimir from "./BotonImprimir"
import BotonEnviar from "./BotonEnviar"

export const dynamic = "force-dynamic"

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatearFechaLarga(fecha: Date) {
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function ImprimirAtencionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const atencion = await prisma.atencion.findUnique({
    where: { id },
    include: {
      patient: true,
      specialist: { include: { specialty: true } },
      appointment: { include: { slot: true } },
      recetas: { orderBy: { orden: "asc" } },
      examenes: { orderBy: { orden: "asc" } },
      tenant: true,
    },
  })

  if (!atencion) notFound()

  const edad = atencion.patient.birthDate
    ? Math.floor((Date.now() - atencion.patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="min-h-screen bg-white py-8 print:py-0">
      <div className="max-w-3xl mx-auto px-8 print:px-4">
        {/* Acciones fuera de la impresion */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href={`/admin/clientes/${atencion.patientId}`}
            className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
          >
            Volver a la ficha
          </Link>
          <div className="flex items-center gap-3">
            <BotonImprimir />
            {atencion.patient.email && (
              <BotonEnviar
                atencionId={atencion.id}
                email={atencion.patient.email}
              />
            )}
          </div>
        </div>

        {/* Encabezado */}
        <header className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{atencion.tenant.name}</h1>
              {atencion.tenant.address && (
                <p className="text-xs text-gray-600 mt-1">
                  {atencion.tenant.address}
                  {atencion.tenant.city ? `, ${atencion.tenant.city}` : ""}
                </p>
              )}
              {atencion.tenant.phone && <p className="text-xs text-gray-600">{atencion.tenant.phone}</p>}
              {atencion.tenant.email && <p className="text-xs text-gray-600">{atencion.tenant.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-500">Atencion medica</p>
              <p className="text-sm font-medium">{formatearFecha(atencion.createdAt)}</p>
            </div>
          </div>
        </header>

        {/* Datos del cliente */}
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
            Cliente
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p><span className="text-gray-500">Nombre:</span> <strong>{atencion.patient.name}</strong></p>
            <p><span className="text-gray-500">RUT:</span> {atencion.patient.rut || "-"}</p>
            {atencion.patient.birthDate && (
              <p><span className="text-gray-500">Fecha nacimiento:</span> {formatearFecha(atencion.patient.birthDate)} {edad !== null ? `(${edad} anos)` : ""}</p>
            )}
            {atencion.patient.prevision && (
              <p><span className="text-gray-500">Prevision:</span> {atencion.patient.prevision}</p>
            )}
            {atencion.patient.phone && (
              <p><span className="text-gray-500">Telefono:</span> {atencion.patient.phone}</p>
            )}
            {atencion.patient.email && (
              <p><span className="text-gray-500">Email:</span> {atencion.patient.email}</p>
            )}
          </div>
        </section>

        {/* Datos de la consulta */}
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
            Consulta
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p><span className="text-gray-500">Fecha:</span> {formatearFechaLarga(atencion.appointment.slot.date)}</p>
            <p><span className="text-gray-500">Hora:</span> {atencion.appointment.slot.startTime}</p>
            <p><span className="text-gray-500">Profesional:</span> <strong>{atencion.specialist.name}</strong></p>
            <p><span className="text-gray-500">Especialidad:</span> {atencion.specialist.specialty.name}</p>
          </div>
        </section>

        {/* Signos vitales */}
        {(atencion.peso || atencion.talla || atencion.presionArterial || atencion.frecuenciaCardiaca || atencion.temperatura || atencion.saturacion || atencion.frecuenciaResp) && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Signos vitales
            </h2>
            <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-sm">
              {atencion.peso && <p><span className="text-gray-500">Peso:</span> {atencion.peso} kg</p>}
              {atencion.talla && <p><span className="text-gray-500">Talla:</span> {atencion.talla} cm</p>}
              {atencion.presionArterial && <p><span className="text-gray-500">PA:</span> {atencion.presionArterial} mmHg</p>}
              {atencion.frecuenciaCardiaca && <p><span className="text-gray-500">FC:</span> {atencion.frecuenciaCardiaca} lpm</p>}
              {atencion.temperatura && <p><span className="text-gray-500">Temp:</span> {atencion.temperatura} C</p>}
              {atencion.saturacion && <p><span className="text-gray-500">SatO2:</span> {atencion.saturacion}%</p>}
              {atencion.frecuenciaResp && <p><span className="text-gray-500">FR:</span> {atencion.frecuenciaResp} rpm</p>}
            </div>
          </section>
        )}

        {/* Motivo */}
        {atencion.motivoConsulta && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Motivo de la visita
            </h2>
            <p className="text-sm whitespace-pre-wrap">{atencion.motivoConsulta}</p>
          </section>
        )}

        {/* Anamnesis */}
        {atencion.anamnesis && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Anamnesis
            </h2>
            <p className="text-sm whitespace-pre-wrap">{atencion.anamnesis}</p>
          </section>
        )}

        {/* Examen fisico */}
        {atencion.examenFisico && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Examen fisico
            </h2>
            <p className="text-sm whitespace-pre-wrap">{atencion.examenFisico}</p>
          </section>
        )}

        {/* Diagnostico */}
        {atencion.diagnostico && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Diagnostico
            </h2>
            <p className="text-sm whitespace-pre-wrap font-medium">{atencion.diagnostico}</p>
          </section>
        )}

        {/* Indicaciones */}
        {atencion.indicaciones && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Indicaciones
            </h2>
            <p className="text-sm whitespace-pre-wrap">{atencion.indicaciones}</p>
          </section>
        )}

        {/* Recomendacioness */}
        {atencion.recetas.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Recomendaciones
            </h2>
            <ol className="space-y-3 text-sm">
              {atencion.recetas.map((r, i) => (
                <li key={r.id} className="border-l-2 border-black pl-3">
                  <p className="font-medium">{i + 1}. {r.medicamento}</p>
                  <p className="text-gray-700">
                    {[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(" - ")}
                  </p>
                  {r.indicaciones && <p className="text-gray-600 italic">{r.indicaciones}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Examenes */}
        {atencion.examenes.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
              Examenes solicitados
            </h2>
            <ul className="space-y-2 text-sm">
              {atencion.examenes.map((x, i) => (
                <li key={x.id} className="border-l-2 border-black pl-3">
                  <p className="font-medium">{i + 1}. {x.nombre}</p>
                  {x.notas && <p className="text-gray-600 italic">{x.notas}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Firma */}
        <section className="mt-16 pt-8 border-t border-gray-300">
          <div className="text-center max-w-xs mx-auto">
            <div className="border-t border-black pt-2">
              <p className="text-sm font-medium">{atencion.specialist.name}</p>
              <p className="text-xs text-gray-500">{atencion.specialist.specialty.name}</p>
              {atencion.specialist.rut && (
                <p className="text-xs text-gray-500">RUT {atencion.specialist.rut}</p>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          Documento generado el {formatearFechaLarga(new Date())}
        </footer>
      </div>
    </div>
  )
}