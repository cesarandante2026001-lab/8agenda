"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Receta = {
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones: string
}

type Examen = {
  nombre: string
  notas: string
}

type Datos = {
  motivoConsulta: string
  anamnesis: string
  examenFisico: string
  diagnostico: string
  indicaciones: string
  peso: string
  talla: string
  presionArterial: string
  frecuenciaCardiaca: string
  temperatura: string
  saturacion: string
  frecuenciaResp: string
}

export default function FormAtencion({
  appointmentId,
  inicial,
  recetasIniciales,
  examenesIniciales,
  yaExistia,
}: {
  appointmentId: string
  inicial: Datos
  recetasIniciales: Receta[]
  examenesIniciales: Examen[]
  yaExistia: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState<Datos>(inicial)
  const [recetas, setRecetas] = useState<Receta[]>(recetasIniciales)
  const [examenes, setExamenes] = useState<Examen[]>(examenesIniciales)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  function set<K extends keyof Datos>(k: K, v: Datos[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function agregarReceta() {
    setRecetas((r) => [...r, { medicamento: "", dosis: "", frecuencia: "", duracion: "", indicaciones: "" }])
  }
  function setReceta(idx: number, k: keyof Receta, v: string) {
    setRecetas((r) => r.map((rec, i) => i === idx ? { ...rec, [k]: v } : rec))
  }
  function quitarReceta(idx: number) {
    setRecetas((r) => r.filter((_, i) => i !== idx))
  }

  function agregarExamen() {
    setExamenes((e) => [...e, { nombre: "", notas: "" }])
  }
  function setExamen(idx: number, k: keyof Examen, v: string) {
    setExamenes((e) => e.map((ex, i) => i === idx ? { ...ex, [k]: v } : ex))
  }
  function quitarExamen(idx: number) {
    setExamenes((e) => e.filter((_, i) => i !== idx))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMsg("")
    setGuardando(true)

    // Limpiar vacios
    const recetasLimpias = recetas.filter((r) => r.medicamento.trim())
    const examenesLimpios = examenes.filter((x) => x.nombre.trim())

    const r = await fetch(`/api/especialista/citas/${appointmentId}/atencion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, recetas: recetasLimpias, examenes: examenesLimpios }),
    })
    const data = await r.json()
    setGuardando(false)

    if (!r.ok) {
      setError(data.error || "Error al guardar")
      return
    }

    setMsg("Atencion guardada. La cita quedo marcada como ATENDIDA.")
    setTimeout(() => {
      router.push("/especialista")
    }, 1200)
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      <section className="border border-gray-200 rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Motivo de consulta</p>
        <textarea
          value={form.motivoConsulta}
          onChange={(e) => set("motivoConsulta", e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
          placeholder="Ej: dolor de cabeza persistente hace 3 dias"
        />
      </section>

      <section className="border border-gray-200 rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Signos vitales</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Campo label="Peso (kg)" value={form.peso} onChange={(v) => set("peso", v)} />
          <Campo label="Talla (cm)" value={form.talla} onChange={(v) => set("talla", v)} />
          <Campo label="PA (mmHg)" value={form.presionArterial} onChange={(v) => set("presionArterial", v)} placeholder="120/80" />
          <Campo label="FC (lpm)" value={form.frecuenciaCardiaca} onChange={(v) => set("frecuenciaCardiaca", v)} />
          <Campo label="Temperatura (C)" value={form.temperatura} onChange={(v) => set("temperatura", v)} />
          <Campo label="SatO2 (%)" value={form.saturacion} onChange={(v) => set("saturacion", v)} />
          <Campo label="FR (rpm)" value={form.frecuenciaResp} onChange={(v) => set("frecuenciaResp", v)} />
        </div>
      </section>

      <section className="border border-gray-200 rounded-lg p-6 space-y-4">
        <Area label="Anamnesis" value={form.anamnesis} onChange={(v) => set("anamnesis", v)} rows={4} />
        <Area label="Examen fisico" value={form.examenFisico} onChange={(v) => set("examenFisico", v)} rows={4} />
        <Area label="Diagnostico" value={form.diagnostico} onChange={(v) => set("diagnostico", v)} rows={3} />
        <Area label="Indicaciones generales" value={form.indicaciones} onChange={(v) => set("indicaciones", v)} rows={3} />
      </section>

      <section className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Recetas</p>
          <button
            type="button"
            onClick={agregarReceta}
            className="text-xs uppercase tracking-wider border border-gray-300 px-3 py-1.5 hover:border-black"
          >
            + Agregar medicamento
          </button>
        </div>
        {recetas.length === 0 ? (
          <p className="text-xs text-gray-400">Sin medicamentos recetados.</p>
        ) : (
          <div className="space-y-3">
            {recetas.map((r, i) => (
              <div key={i} className="border border-gray-100 rounded p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Medicamento *"
                    value={r.medicamento}
                    onChange={(e) => setReceta(i, "medicamento", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dosis (ej: 500 mg)"
                    value={r.dosis}
                    onChange={(e) => setReceta(i, "dosis", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Frecuencia (ej: cada 8 horas)"
                    value={r.frecuencia}
                    onChange={(e) => setReceta(i, "frecuencia", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Duracion (ej: 7 dias)"
                    value={r.duracion}
                    onChange={(e) => setReceta(i, "duracion", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                  />
                </div>
                <textarea
                  placeholder="Indicaciones adicionales"
                  value={r.indicaciones}
                  onChange={(e) => setReceta(i, "indicaciones", e.target.value)}
                  rows={2}
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                />
                <button
                  type="button"
                  onClick={() => quitarReceta(i)}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Solicitud de examenes</p>
          <button
            type="button"
            onClick={agregarExamen}
            className="text-xs uppercase tracking-wider border border-gray-300 px-3 py-1.5 hover:border-black"
          >
            + Agregar examen
          </button>
        </div>
        {examenes.length === 0 ? (
          <p className="text-xs text-gray-400">Sin examenes solicitados.</p>
        ) : (
          <div className="space-y-3">
            {examenes.map((x, i) => (
              <div key={i} className="border border-gray-100 rounded p-4 bg-gray-50">
                <input
                  type="text"
                  placeholder="Nombre del examen *"
                  value={x.nombre}
                  onChange={(e) => setExamen(i, "nombre", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                />
                <textarea
                  placeholder="Notas (ayuno, preparacion, etc)"
                  value={x.notas}
                  onChange={(e) => setExamen(i, "notas", e.target.value)}
                  rows={2}
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-black outline-none"
                />
                <button
                  type="button"
                  onClick={() => quitarExamen(i)}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>}
      {msg && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-md">{msg}</div>}

      <button
        type="submit"
        disabled={guardando}
        className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50"
      >
        {guardando ? "Guardando..." : yaExistia ? "Actualizar atencion" : "Guardar atencion"}
      </button>
    </form>
  )
}

function Campo({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-black outline-none text-sm"
      />
    </div>
  )
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
      />
    </div>
  )
}