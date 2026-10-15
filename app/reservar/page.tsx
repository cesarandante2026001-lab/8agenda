"use client"

import Link from "next/link"

import { useEffect, useState } from "react"

type Especialidad = { id: string; name: string; color: string | null }
type Especialista = { id: string; name: string; specialtyId: string; specialtyName: string; specialtyColor: string | null }
type Slot = { id: string; startTime: string; endTime: string; status: string }
type Dia = { date: string; slots: Slot[] }

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function ReservarPage() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [especialistas, setEspecialistas] = useState<Especialista[]>([])
  const [especialidadId, setEspecialidadId] = useState<string>("")
  const [especialistaId, setEspecialistaId] = useState<string>("")
  const [dias, setDias] = useState<Dia[]>([])
  const [slotSeleccionado, setSlotSeleccionado] = useState<Slot | null>(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("")
  const [cargando, setCargando] = useState(true)
  const [cargandoDias, setCargandoDias] = useState(false)

  const [patientName, setPatientName] = useState("")
  const [patientRut, setPatientRut] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState(false)
  const [cancelToken, setCancelToken] = useState("")

  useEffect(() => {
    fetch("/api/publico/especialistas")
      .then((r) => r.json())
      .then((data) => {
        setEspecialidades(data.especialidades || [])
        setEspecialistas(data.especialistas || [])
        if (data.especialidades?.length > 0) setEspecialidadId(data.especialidades[0].id)
        setCargando(false)
      })
  }, [])

  useEffect(() => {
    if (!especialidadId) return
    const filtrados = especialistas.filter((e) => e.specialtyId === especialidadId)
    if (filtrados.length > 0) setEspecialistaId(filtrados[0].id)
    else { setEspecialistaId(""); setDias([]) }
    setSlotSeleccionado(null)
    setDiaSeleccionado("")
  }, [especialidadId, especialistas])

  useEffect(() => {
    if (!especialistaId) { setDias([]); return }
    setCargandoDias(true)
    setDias([])
    setSlotSeleccionado(null)
    setDiaSeleccionado("")

    fetch("/api/publico/especialistas/" + especialistaId + "/disponibilidad")
      .then((r) => r.json())
      .then((data) => {
        setDias(data.dias || [])
        if (data.dias?.length > 0) setDiaSeleccionado(data.dias[0].date)
        setCargandoDias(false)
      })
  }, [especialistaId])

  async function reservar(e: React.FormEvent) {
    e.preventDefault()
    if (!slotSeleccionado || slotSeleccionado.status !== "LIBRE") return
    setError("")
    setEnviando(true)

    const r = await fetch("/api/publico/reservar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: slotSeleccionado.id,
        patientName,
        patientRut: patientRut || undefined,
        patientEmail,
        patientPhone,
      }),
    })
    const data = await r.json()
    setEnviando(false)

    if (!r.ok) { setError(data.error || "Error al reservar"); return }

    setCancelToken(data.cancelToken || "")
    setExito(true)
  }

  const especialistasFiltrados = especialistas.filter((e) => e.specialtyId === especialidadId)
  const especialistaActual = especialistas.find((e) => e.id === especialistaId)
  const diaActual = dias.find((d) => d.date === diaSeleccionado)

  if (cargando) {
    return <main className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando...</p></main>
  }

  if (exito) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-white">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-3xl font-light mb-3">Hora reservada</h1>
          <p className="text-sm text-gray-500 mb-6">
            Te enviamos un correo con los detalles. Te esperamos.
          </p>
          <p className="text-sm mb-8">
            <strong>{especialistaActual?.name}</strong><br />
            {new Date(diaSeleccionado + "T00:00:00.000Z").toLocaleDateString("es-CL", {
              weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
            })} a las {slotSeleccionado?.startTime}
          </p>
          <div className="space-y-4">
            {cancelToken && (
              <div className="border border-gray-200 rounded-lg p-4 text-left">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Guarda este link por si necesitas anular
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={typeof window !== "undefined" ? window.location.origin + "/anular/" + cancelToken : ""}
                    className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + "/anular/" + cancelToken)
                    }}
                    className="text-xs uppercase tracking-wider px-3 py-2 border border-gray-300 rounded hover:border-black"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setExito(false)
                  setCancelToken("")
                  setSlotSeleccionado(null)
                  setPatientName("")
                  setPatientRut("")
                  setPatientEmail("")
                  setPatientPhone("")
                  setError("")
                }}
                className="w-full bg-black text-white px-6 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition text-center"
              >
                Reservar otra hora
              </button>
              <a
                href="/"
                className="w-full border border-gray-300 px-6 py-4 text-xs tracking-widest uppercase hover:border-black transition text-center block"
              >
                Volver al inicio
              </a>
              {cancelToken && (
                <a
                  href={"/anular/" + cancelToken}
                  className="text-xs text-red-600 hover:underline mt-2 text-center"
                >
                  Anular esta reserva
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] text-gray-500 mb-4 uppercase">Reserva tu hora</p>
          <h1 className="text-4xl font-light tracking-tight mb-2">Agenda tu consulta</h1>
          <p className="text-sm text-gray-500">Elige especialidad, especialista, dia y hora.</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <label className="block text-xs tracking-widest uppercase text-gray-500 mb-3">
            1. Especialidad
          </label>
          <select
            value={especialidadId}
            onChange={(e) => setEspecialidadId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none bg-white text-sm"
          >
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {especialidadId && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-3">
              2. Especialista
            </label>
            {especialistasFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400">No hay especialistas activos en esta especialidad.</p>
            ) : (
              <select
                value={especialistaId}
                onChange={(e) => setEspecialistaId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none bg-white text-sm"
              >
                {especialistasFiltrados.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {especialistaId && !cargandoDias && dias.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">3. Dia</p>
            <div className="flex gap-2 flex-wrap">
              {dias.map((d) => {
                const fecha = new Date(d.date + "T00:00:00.000Z")
                const dow = fecha.getUTCDay()
                const num = fecha.getUTCDate()
                const mes = fecha.getUTCMonth()
                const sel = diaSeleccionado === d.date
                return (
                  <button key={d.date} onClick={() => { setDiaSeleccionado(d.date); setSlotSeleccionado(null) }}
                    className={"border rounded-lg px-4 py-3 text-center transition min-w-[80px] " + (sel ? "border-black bg-black text-white" : "border-gray-200 hover:border-black")}>
                    <p className="text-xs uppercase tracking-widest">{DIAS_CORTOS[dow]}</p>
                    <p className="text-xl font-medium">{num}</p>
                    <p className="text-xs opacity-60">{MESES_CORTOS[mes]}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {diaActual && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">4. Hora</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {diaActual.slots.map((s) => {
                const tomado = s.status !== "LIBRE"
                const sel = slotSeleccionado?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => { if (!tomado) setSlotSeleccionado(s) }}
                    disabled={tomado}
                    className={
                      "border rounded-md py-2 text-sm transition " +
                      (tomado
                        ? "border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed"
                        : sel
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-black")
                    }
                  >
                    {s.startTime}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Las horas en gris ya fueron reservadas.
            </p>
          </div>
        )}

        {especialistaId && !cargandoDias && dias.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-lg p-16 text-center mb-6">
            <p className="text-sm text-gray-400">Este especialista no tiene horas disponibles por ahora.</p>
          </div>
        )}

        {slotSeleccionado && (
          <form onSubmit={reservar} className="border border-gray-200 rounded-lg p-6 space-y-5">
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-1">5. Tus datos</p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>{especialistaActual?.name}</strong> -{" "}
              {new Date(diaSeleccionado + "T00:00:00.000Z").toLocaleDateString("es-CL", {
                weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
              })} a las {slotSeleccionado.startTime}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Nombre completo</label>
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">RUT (opcional)</label>
                <input type="text" value={patientRut} onChange={(e) => setPatientRut(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Email</label>
                <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Telefono</label>
                <input type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none" />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>}

            <button type="submit" disabled={enviando}
              className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50">
              {enviando ? "Reservando..." : "Confirmar reserva"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}