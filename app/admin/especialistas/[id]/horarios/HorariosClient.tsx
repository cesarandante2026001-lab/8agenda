"use client"

import { useState } from "react"
import Link from "next/link"

type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY"

type Availability = { dayOfWeek: DayOfWeek; startTime: string; endTime: string }
type Break = { dayOfWeek: DayOfWeek; startTime: string; endTime: string; label: string | null }

type Especialista = {
  id: string
  name: string
  specialtyName: string
  duracionConsulta: number
  availabilities: Availability[]
  breaks: Break[]
}

const DIAS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Lunes" },
  { key: "TUESDAY", label: "Martes" },
  { key: "WEDNESDAY", label: "Miercoles" },
  { key: "THURSDAY", label: "Jueves" },
  { key: "FRIDAY", label: "Viernes" },
  { key: "SATURDAY", label: "Sabado" },
  { key: "SUNDAY", label: "Domingo" },
]

export default function HorariosClient({ especialista }: { especialista: Especialista }) {
  const [availabilities, setAvailabilities] = useState<Availability[]>(especialista.availabilities)
  const [breaks, setBreaks] = useState<Break[]>(especialista.breaks)
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState("")
  const [error, setError] = useState("")

  function toggleDia(day: DayOfWeek) {
    const existe = availabilities.find((a) => a.dayOfWeek === day)
    if (existe) {
      setAvailabilities((prev) => prev.filter((a) => a.dayOfWeek !== day))
    } else {
      setAvailabilities((prev) => [
        ...prev,
        { dayOfWeek: day, startTime: "09:00", endTime: "18:00" },
      ])
    }
  }

  function actualizarHorario(day: DayOfWeek, campo: "startTime" | "endTime", valor: string) {
    setAvailabilities((prev) =>
      prev.map((a) => (a.dayOfWeek === day ? { ...a, [campo]: valor } : a))
    )
  }

  function agregarBreak(day: DayOfWeek) {
    setBreaks((prev) => [
      ...prev,
      { dayOfWeek: day, startTime: "13:00", endTime: "14:00", label: "Colacion" },
    ])
  }

  function actualizarBreak(index: number, campo: keyof Break, valor: string) {
    setBreaks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [campo]: valor } : b))
    )
  }

  function eliminarBreak(index: number) {
    setBreaks((prev) => prev.filter((_, i) => i !== index))
  }

  async function guardar() {
    setGuardando(true)
    setOk("")
    setError("")

    const res = await fetch("/api/admin/especialistas/" + especialista.id + "/horarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilities, breaks }),
    })

    setGuardando(false)

    if (!res.ok) {
      setError("Error al guardar")
      return
    }

    setOk("Horarios guardados")
    setTimeout(() => setOk(""), 2500)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/admin/especialistas"
          className="inline-block text-xs tracking-widest uppercase text-gray-500 hover:text-black mb-6"
        >
          Volver a especialistas
        </Link>

        <h1 className="text-3xl font-light mb-1">
          Horarios de {especialista.name}
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

        <h2 className="text-lg font-medium mb-4">Dias que atiende</h2>
        <div className="space-y-3 mb-10">
          {DIAS.map((d) => {
            const activo = availabilities.find((a) => a.dayOfWeek === d.key)
            return (
              <div
                key={d.key}
                className={"border rounded-lg p-4 " + (activo ? "border-black bg-gray-50" : "border-gray-200")}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                    <input
                      type="checkbox"
                      checked={!!activo}
                      onChange={() => toggleDia(d.key)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{d.label}</span>
                  </label>

                  {activo && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Desde</span>
                      <input
                        type="time"
                        value={activo.startTime}
                        onChange={(e) => actualizarHorario(d.key, "startTime", e.target.value)}
                        className="border border-gray-300 px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500">hasta</span>
                      <input
                        type="time"
                        value={activo.endTime}
                        onChange={(e) => actualizarHorario(d.key, "endTime", e.target.value)}
                        className="border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                </div>

                {activo && (
                  <div className="mt-3 pl-6">
                    <p className="text-xs text-gray-500 mb-2">Colaciones / pausas</p>
                    {breaks
                      .map((b, i) => ({ b, i }))
                      .filter(({ b }) => b.dayOfWeek === d.key)
                      .map(({ b, i }) => (
                        <div key={i} className="flex items-center gap-2 text-sm mb-2">
                          <input
                            type="time"
                            value={b.startTime}
                            onChange={(e) => actualizarBreak(i, "startTime", e.target.value)}
                            className="border border-gray-300 px-2 py-1 text-sm"
                          />
                          <span className="text-gray-500">a</span>
                          <input
                            type="time"
                            value={b.endTime}
                            onChange={(e) => actualizarBreak(i, "endTime", e.target.value)}
                            className="border border-gray-300 px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            value={b.label || ""}
                            onChange={(e) => actualizarBreak(i, "label", e.target.value)}
                            placeholder="Colacion"
                            className="border border-gray-300 px-2 py-1 text-sm w-32"
                          />
                          <button
                            onClick={() => eliminarBreak(i)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => agregarBreak(d.key)}
                      className="text-xs text-gray-500 hover:text-black underline"
                    >
                      + Agregar pausa
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={guardar}
          disabled={guardando}
          className="bg-black text-white text-xs tracking-widest uppercase px-6 py-3 hover:bg-gray-800 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>
    </main>
  )
}