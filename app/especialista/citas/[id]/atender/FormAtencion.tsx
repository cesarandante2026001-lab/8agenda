"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
  yaExistia,
}: {
  appointmentId: string
  inicial: Datos
  yaExistia: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState<Datos>(inicial)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  function set<K extends keyof Datos>(k: K, v: Datos[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMsg("")
    setGuardando(true)

    const r = await fetch(`/api/especialista/citas/${appointmentId}/atencion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
        <Area label="Indicaciones / tratamiento" value={form.indicaciones} onChange={(v) => set("indicaciones", v)} rows={3} />
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