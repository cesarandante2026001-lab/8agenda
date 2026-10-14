"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Especialista = {
  id: string
  name: string
  specialtyName: string
  duracionConsulta: number
}

type Dia = {
  id?: string
  date: string // YYYY-MM-DD
  active: boolean
  startTime: string | null
  endTime: string | null
  breakStart: string | null
  breakEnd: string | null
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DIAS_SEMANA = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

function diasDelMes(year: number, month: number): (string | null)[] {
  const primerDia = new Date(Date.UTC(year, month - 1, 1))
  const ultimoDia = new Date(Date.UTC(year, month, 0))

  // Dia de la semana del primer dia (0=domingo, 1=lunes...)
  let diaSemana = primerDia.getUTCDay()
  // Convertir a: 0=lunes, 6=domingo
  diaSemana = diaSemana === 0 ? 6 : diaSemana - 1

  const dias: (string | null)[] = []
  for (let i = 0; i < diaSemana; i++) dias.push(null)

  for (let d = 1; d <= ultimoDia.getUTCDate(); d++) {
    const fecha = new Date(Date.UTC(year, month - 1, d))
    const iso = fecha.toISOString().slice(0, 10)
    dias.push(iso)
  }

  return dias
}

export default function DiasClient({ especialista }: { especialista: Especialista }) {
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth() + 1)
  const [dias, setDias] = useState<Record<string, Dia>>({})
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [ok, setOk] = useState("")
  const [error, setError] = useState("")
  const [generandoSlots, setGenerandoSlots] = useState(false)

  // Config por defecto para "generar mes"
  const [patronActivo, setPatronActivo] = useState(true)
  const [patronDias, setPatronDias] = useState<number[]>([1, 2, 3, 4, 5]) // L-V
  const [patronStart, setPatronStart] = useState("09:00")
  const [patronEnd, setPatronEnd] = useState("18:00")
  const [patronBreakStart, setPatronBreakStart] = useState("13:00")
  const [patronBreakEnd, setPatronBreakEnd] = useState("14:00")

  async function cargar() {
    setCargando(true)
    const r = await fetch(
      "/api/admin/especialistas/" + especialista.id + "/dias?year=" + year + "&month=" + month,
      { cache: "no-store" }
    )
    const data = await r.json()
    const mapa: Record<string, Dia> = {}
    for (const d of data.dias || []) {
      const iso = new Date(d.date).toISOString().slice(0, 10)
      mapa[iso] = {
        id: d.id,
        date: iso,
        active: d.active,
        startTime: d.startTime,
        endTime: d.endTime,
        breakStart: d.breakStart,
        breakEnd: d.breakEnd,
      }
    }
    setDias(mapa)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [year, month])

  function mesAnterior() {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  function mesSiguiente() {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  function generarMes() {
    const dias = diasDelMes(year, month).filter((d) => d !== null) as string[]
    const nuevos: Record<string, Dia> = { ...dias_actuales() }

    for (const iso of dias) {
      const fecha = new Date(iso + "T00:00:00.000Z")
      let dow = fecha.getUTCDay()
      dow = dow === 0 ? 7 : dow

      if (patronDias.includes(dow)) {
        nuevos[iso] = {
          date: iso,
          active: true,
          startTime: patronStart,
          endTime: patronEnd,
          breakStart: patronBreakStart,
          breakEnd: patronBreakEnd,
        }
      }
    }

    setDias(nuevos)
    setOk("Mes generado. Revisa y guarda.")
    setTimeout(() => setOk(""), 3000)
  }

  function dias_actuales() {
    return dias
  }

  function limpiarMes() {
    if (!confirm("Borrar todos los dias de este mes?")) return
    setDias({})
    setOk("Mes limpiado. Guarda para confirmar.")
    setTimeout(() => setOk(""), 3000)
  }

  function abrirDia(iso: string) {
    setEditando(iso)
  }

  function toggleDia(iso: string) {
    setDias((prev) => {
      const actual = prev[iso]
      if (!actual) {
        return {
          ...prev,
          [iso]: {
            date: iso,
            active: true,
            startTime: patronStart,
            endTime: patronEnd,
            breakStart: patronBreakStart,
            breakEnd: patronBreakEnd,
          },
        }
      }
      return {
        ...prev,
        [iso]: { ...actual, active: !actual.active },
      }
    })
  }

  function actualizarDia(iso: string, campo: keyof Dia, valor: string | boolean) {
    setDias((prev) => ({
      ...prev,
      [iso]: { ...prev[iso], [campo]: valor },
    }))
  }

  async function guardar() {
    setOk("")
    setError("")

    const lista = Object.values(dias)

    const r = await fetch(
      "/api/admin/especialistas/" + especialista.id + "/dias",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias: lista }),
      }
    )

    if (!r.ok) {
      setError("Error al guardar")
      return
    }

    setOk("Dias guardados correctamente")
    await cargar()
    setTimeout(() => setOk(""), 3000)
  }

  async function borrarTodo() {
    if (!confirm("Borrar TODOS los dias del mes en la base de datos?")) return
    const r = await fetch(
      "/api/admin/especialistas/" + especialista.id + "/dias?year=" + year + "&month=" + month,
      { method: "DELETE" }
    )
    if (r.ok) {
      setOk("Dias borrados")
      await cargar()
      setTimeout(() => setOk(""), 3000)
    }
  }

  async function generarSlots() {
    if (!confirm("Esto va a generar las horas disponibles de los proximos 90 dias. Continuar?")) return
    setGenerandoSlots(true)
    setOk("")
    setError("")

    const r = await fetch(
      "/api/admin/especialistas/" + especialista.id + "/generar-slots",
      { method: "POST" }
    )

    setGenerandoSlots(false)

    if (!r.ok) {
      setError("Error al generar slots")
      return
    }

    const data = await r.json()
    alert("Slots generados: " + data.creados + " horas disponibles en " + data.dias + " dias (" + data.eliminados + " slots viejos eliminados)")
    setOk("Slots generados: " + data.creados + " horas")
    setTimeout(() => setOk(""), 8000)
  }
  const diasMes = diasDelMes(year, month)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/admin/especialistas"
          className="inline-block text-xs tracking-widest uppercase text-gray-500 hover:text-black mb-6"
        >
          Volver a especialistas
        </Link>

        <h1 className="text-3xl font-light mb-1">
          Calendario de {especialista.name}
        </h1>
        <p className="text-sm text-gray-500 mb-2">{especialista.specialtyName}</p>
        <p className="text-xs text-gray-400 mb-8">
          Duracion de cada consulta: {especialista.duracionConsulta} minutos
        </p>

        {ok && (
          <div className="mb-6 text-sm text-green-700 border border-green-200 bg-green-50 px-3 py-2">
            {ok}
          </div>
        )}
        {error && (
          <div className="mb-6 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {error}
          </div>
        )}

        {/* Generador de patron */}
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 mb-8">
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">
            Generar mes con patron
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dias de atencion</label>
              <div className="flex gap-1">
                {DIAS_SEMANA.map((d, i) => {
                  const num = i + 1
                  const activo = patronDias.includes(num)
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setPatronDias((prev) =>
                          prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num]
                        )
                      }}
                      className={"text-xs px-2 py-1 border " + (activo ? "border-black bg-black text-white" : "border-gray-300 text-gray-500")}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input
                type="time"
                value={patronStart}
                onChange={(e) => setPatronStart(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input
                type="time"
                value={patronEnd}
                onChange={(e) => setPatronEnd(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Colacion desde</label>
              <input
                type="time"
                value={patronBreakStart}
                onChange={(e) => setPatronBreakStart(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input
                type="time"
                value={patronBreakEnd}
                onChange={(e) => setPatronBreakEnd(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={generarMes}
              className="bg-black text-white text-xs tracking-widest uppercase px-4 py-2 hover:bg-gray-800"
            >
              Generar mes
            </button>
            <button
              onClick={limpiarMes}
              className="border border-gray-300 text-xs tracking-widest uppercase px-4 py-2 hover:border-black"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Calendario */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={mesAnterior}
              className="border border-gray-300 px-3 py-1 hover:border-black"
            >
              &lt;
            </button>
            <p className="text-lg font-medium">
              {MESES[month - 1]} {year}
            </p>
            <button
              onClick={mesSiguiente}
              className="border border-gray-300 px-3 py-1 hover:border-black"
            >
              &gt;
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={borrarTodo}
              className="text-xs text-red-600 hover:underline"
            >
              Borrar todo el mes
            </button>
            <button
              onClick={generarSlots}
              disabled={generandoSlots}
              className="border border-black text-xs tracking-widest uppercase px-5 py-2 hover:bg-black hover:text-white transition disabled:opacity-50"
            >
              {generandoSlots ? "Generando..." : "Generar slots"}
            </button>
            <button
              onClick={guardar}
              className="bg-black text-white text-xs tracking-widest uppercase px-5 py-2 hover:bg-gray-800"
            >
              Guardar cambios
            </button>
          </div>
        </div>

        {cargando ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-2 text-center text-xs tracking-widest uppercase text-gray-500">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {diasMes.map((iso, i) => {
                if (!iso) {
                  return <div key={i} className="aspect-square border border-gray-100 bg-gray-50" />
                }
                const dia = dias[iso]
                const activo = dia?.active
                const num = Number(iso.slice(-2))
                return (
                  <button
                    key={iso}
                    onClick={() => toggleDia(iso)}
                    onDoubleClick={() => abrirDia(iso)}
                    className={
                      "aspect-square border border-gray-100 p-2 text-left transition " +
                      (activo ? "bg-green-50 hover:bg-green-100" : "bg-white hover:bg-gray-50")
                    }
                  >
                    <div className="flex justify-between items-start">
                      <span className={"text-sm " + (activo ? "font-medium text-green-700" : "text-gray-400")}>
                        {num}
                      </span>
                      {activo && (
                        <span className="text-[10px] text-green-700">
                          {dia?.startTime?.slice(0, 5)}-{dia?.endTime?.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Click en un dia para activar/desactivar. Doble click para editar los horarios de ese dia.
        </p>

        {/* Modal de edicion de dia */}
        {editando && dias[editando] && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-lg font-medium mb-4">
                {new Date(editando + "T00:00:00.000Z").toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dias[editando].active}
                    onChange={(e) => actualizarDia(editando, "active", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Atiende este dia</span>
                </label>

                {dias[editando].active && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                          type="time"
                          value={dias[editando].startTime || "09:00"}
                          onChange={(e) => actualizarDia(editando, "startTime", e.target.value)}
                          className="border border-gray-300 px-2 py-1 text-sm w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                          type="time"
                          value={dias[editando].endTime || "18:00"}
                          onChange={(e) => actualizarDia(editando, "endTime", e.target.value)}
                          className="border border-gray-300 px-2 py-1 text-sm w-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Colacion desde</label>
                        <input
                          type="time"
                          value={dias[editando].breakStart || "13:00"}
                          onChange={(e) => actualizarDia(editando, "breakStart", e.target.value)}
                          className="border border-gray-300 px-2 py-1 text-sm w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                          type="time"
                          value={dias[editando].breakEnd || "14:00"}
                          onChange={(e) => actualizarDia(editando, "breakEnd", e.target.value)}
                          className="border border-gray-300 px-2 py-1 text-sm w-full"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditando(null)}
                  className="px-4 py-2 border border-gray-300 text-xs tracking-widest uppercase hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}