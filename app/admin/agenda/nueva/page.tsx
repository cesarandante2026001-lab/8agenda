"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Especialista = { id: string; name: string }
type Slot = { id: string; date: string; startTime: string; endTime: string }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const DIAS = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"]

function fmt(dateStr: string) {
  const d = new Date(dateStr)
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
}

export default function NuevaCitaPage() {
  const router = useRouter()
  const [especialistas, setEspecialistas] = useState<Especialista[]>([])
  const [especialistaId, setEspecialistaId] = useState("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotId, setSlotId] = useState("")
  const [cargandoSlots, setCargandoSlots] = useState(false)

  const [patientName, setPatientName] = useState("")
  const [patientRut, setPatientRut] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/publico/especialistas")
      .then((r) => r.json())
      .then((d) => {
        const lista = (d.especialistas || []).map((e: any) => ({ id: e.id, name: e.name }))
        setEspecialistas(lista)
        if (lista.length > 0) setEspecialistaId(lista[0].id)
      })
  }, [])

  useEffect(() => {
    if (!especialistaId) { setSlots([]); return }
    setCargandoSlots(true)
    setSlotId("")

    const hoy = new Date()
    const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
    const hasta = new Date(desde.getTime() + 60 * 24 * 60 * 60 * 1000)

    const desdeStr = desde.toISOString().slice(0, 10)
    const hastaStr = hasta.toISOString().slice(0, 10)

    fetch(`/api/admin/slots-libres?specialistId=${especialistaId}&desde=${desdeStr}&hasta=${hastaStr}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .finally(() => setCargandoSlots(false))
  }, [especialistaId])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (!slotId) { setError("Elige una hora"); return }
    setError("")
    setEnviando(true)

    const r = await fetch("/api/admin/citas/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId,
        patientName,
        patientRut: patientRut || undefined,
        patientEmail,
        patientPhone,
        notes: notes || undefined,
      }),
    })
    const data = await r.json()
    setEnviando(false)

    if (!r.ok) { setError(data.error || "Error al crear"); return }

    router.push("/admin/agenda")
  }

  // Agrupar slots por dia para mostrar
  const slotsPorDia: Record<string, Slot[]> = {}
  for (const s of slots) {
    const k = s.date.slice(0, 10)
    if (!slotsPorDia[k]) slotsPorDia[k] = []
    slotsPorDia[k].push(s)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/admin/agenda" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black">
          Volver a la agenda
        </Link>
      </div>

      <h1 className="text-3xl font-light mb-2">
        Nueva cita <span className="font-semibold">manual</span>
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Para cuando un paciente llama por telefono o llega presencial.
      </p>

      <form onSubmit={crear} className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <label className="block text-xs tracking-widest uppercase text-gray-500 mb-3">
            Especialista
          </label>
          <select
            value={especialistaId}
            onChange={(e) => setEspecialistaId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none bg-white text-sm"
          >
            {especialistas.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <label className="block text-xs tracking-widest uppercase text-gray-500 mb-3">
            Hora disponible
          </label>
          {cargandoSlots ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400">No hay horas libres en los proximos 60 dias.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(slotsPorDia).map(([dia, lista]) => (
                <div key={dia}>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                    {fmt(dia + "T00:00:00.000Z")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lista.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlotId(s.id)}
                        className={
                          "border rounded-md px-3 py-1.5 text-sm transition " +
                          (slotId === s.id
                            ? "border-black bg-black text-white"
                            : "border-gray-200 hover:border-black")
                        }
                      >
                        {s.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-1">Datos del paciente</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Nombre completo</label>
              <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">RUT (opcional)</label>
              <input type="text" value={patientRut} onChange={(e) => setPatientRut(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Email</label>
              <input type="email" required value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Telefono</label>
              <input type="tel" required value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>}

        <button type="submit" disabled={enviando || !slotId}
          className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50">
          {enviando ? "Creando..." : "Crear cita"}
        </button>
      </form>
    </div>
  )
}