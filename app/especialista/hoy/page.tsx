import { redirect } from "next/navigation"
import { currentUser } from "@/lib/auth-helpers-extra"
import { prisma } from "@/lib/prisma"
import BotonMarcar from "../citas/BotonMarcar"

export const dynamic = "force-dynamic"

export default async function HoyPage() {
  const u = await currentUser()
  if (!u) redirect("/login?callbackUrl=/especialista/hoy")

  const hoy = new Date()
  const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000)

  const citas = await prisma.appointment.findMany({
    where: {
      status: { in: ["RESERVADA", "CONFIRMADA"] },
      slot: { date: { gte: inicio, lt: fin } },
    },
    orderBy: [{ slot: { startTime: "asc" } }],
    include: {
      specialist: { include: { specialty: true } },
      slot: true,
    },
  })

  return (
    <div>
      <div className="mb-4">
        <a
          href="/especialista"
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
        >
          Volver a mis citas
        </a>
      </div>
      <h1 className="text-3xl font-light mb-2">Citas de hoy</h1>
      <p className="text-sm text-gray-500 mb-8">
        {new Date().toLocaleDateString("es-CL", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {citas.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">No hay citas para hoy.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((c) => (
            <div
              key={c.id}
              className="border border-gray-200 rounded-lg p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-lg font-medium">{c.slot.startTime}</p>
                <p className="text-sm">{c.patientName}</p>
                <p className="text-xs text-gray-500">
                  {c.patientPhone} - {c.patientEmail}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {c.specialist.name} ({c.specialist.specialty.name})
                </p>
              </div>
              <BotonMarcar id={c.id} estado={c.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}