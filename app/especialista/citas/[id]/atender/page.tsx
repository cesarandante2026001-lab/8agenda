import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"
import FormAtencion from "./FormAtencion"

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

export default async function AtenderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const u = await currentUser()
  if (!u) redirect("/login")

  const { id } = await params

  const tenantFiltro = u.role === "SUPERADMIN" ? null : (u as any).tenantId

  const cita = await prisma.appointment.findFirst({
    where: {
      id,
      ...(tenantFiltro ? { tenantId: tenantFiltro } : {}),
    },
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
      patient: true,
      atencion: {
        include: {
          recetas: { orderBy: { orden: "asc" } },
          examenes: { orderBy: { orden: "asc" } },
        },
      },
    },
  })

  if (!cita) notFound()

  const esAdmin = ["SUPERADMIN", "OWNER", "ADMIN", "RECEPTIONIST"].includes(u.role)
  if (u.role === "SPECIALIST" && cita.specialist.userId !== u.id) {
    redirect("/especialista")
  }

  const atencionExistente = cita.atencion

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/especialista" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black">
          Volver a mis citas
        </Link>
        {atencionExistente && (
          <a
            href={`/atenciones/${atencionExistente.id}/imprimir`}
            target="_blank"
            className="text-xs uppercase tracking-wider border border-gray-300 px-3 py-1.5 hover:border-black"
          >
            Imprimir
          </a>
        )}
      </div>

      <h1 className="text-3xl font-light mb-2">Atencion medica</h1>
      <p className="text-sm text-gray-500 mb-8">
        {formatearFecha(cita.slot.date)} a las {cita.slot.startTime}
      </p>

      <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-gray-50">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Paciente</p>
        <p className="text-lg font-medium">{cita.patientName}</p>
        <div className="text-sm text-gray-600 mt-1 space-y-0.5">
          {cita.patientRut && <p>RUT: {cita.patientRut}</p>}
          {cita.patient?.prevision && <p>Prevision: {cita.patient.prevision}</p>}
          {cita.patient?.alergias && <p className="text-red-700">Alergias: {cita.patient.alergias}</p>}
          {cita.patient?.enfermedadesCronicas && <p>Enf. cronicas: {cita.patient.enfermedadesCronicas}</p>}
          {cita.patient?.medicamentos && <p>Medicamentos: {cita.patient.medicamentos}</p>}
        </div>
        {cita.patient && (
          <Link
            href={`/admin/pacientes/${cita.patient.id}`}
            className="inline-block mt-3 text-xs uppercase tracking-wider text-gray-600 hover:text-black"
          >
            Ver ficha completa
          </Link>
        )}
      </div>

      <FormAtencion
        appointmentId={cita.id}
        inicial={{
          motivoConsulta: atencionExistente?.motivoConsulta || "",
          anamnesis: atencionExistente?.anamnesis || "",
          examenFisico: atencionExistente?.examenFisico || "",
          diagnostico: atencionExistente?.diagnostico || "",
          indicaciones: atencionExistente?.indicaciones || "",
          peso: atencionExistente?.peso || "",
          talla: atencionExistente?.talla || "",
          presionArterial: atencionExistente?.presionArterial || "",
          frecuenciaCardiaca: atencionExistente?.frecuenciaCardiaca || "",
          temperatura: atencionExistente?.temperatura || "",
          saturacion: atencionExistente?.saturacion || "",
          frecuenciaResp: atencionExistente?.frecuenciaResp || "",
        }}
        recetasIniciales={(atencionExistente?.recetas || []).map((r: any) => ({
          medicamento: r.medicamento,
          dosis: r.dosis || "",
          frecuencia: r.frecuencia || "",
          duracion: r.duracion || "",
          indicaciones: r.indicaciones || "",
        }))}
        examenesIniciales={(atencionExistente?.examenes || []).map((e: any) => ({
          nombre: e.nombre,
          notas: e.notas || "",
        }))}
        recetasIniciales={(atencionExistente?.recetas || []).map((r: any) => ({
          medicamento: r.medicamento,
          dosis: r.dosis || "",
          frecuencia: r.frecuencia || "",
          duracion: r.duracion || "",
          indicaciones: r.indicaciones || "",
        }))}
        examenesIniciales={(atencionExistente?.examenes || []).map((e: any) => ({
          nombre: e.nombre,
          notas: e.notas || "",
        }))}
        yaExistia={!!atencionExistente}
      />
    </div>
  )
}