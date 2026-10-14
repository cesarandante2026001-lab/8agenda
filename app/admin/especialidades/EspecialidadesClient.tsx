"use client"

import { useState, useTransition } from "react"

type Especialidad = {
  id: string
  name: string
  description: string | null
  color: string | null
  order: number
  active: boolean
}

export default function EspecialidadesClient({ initial }: { initial: Especialidad[] }) {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>(initial)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#000000")
  const [order, setOrder] = useState(0)
  const [msg, setMsg] = useState("")
  const [ok, setOk] = useState("")
  const [pending, start] = useTransition()

  async function recargar() {
    const r = await fetch("/api/admin/especialidades", { cache: "no-store" })
    const data = await r.json()
    setEspecialidades(data.especialidades || [])
  }

  async function crear() {
    if (!name.trim()) return
    setMsg("")
    setOk("")
    const r = await fetch("/api/admin/especialidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color, order }),
    })
    if (r.ok) {
      setName("")
      setDescription("")
      setColor("#000000")
      setOrder(0)
      setOk("Especialidad creada")
      await recargar()
    } else {
      setMsg("Error al crear")
    }
  }

  async function actualizar(e: Especialidad, campos: Partial<Especialidad>) {
    await fetch("/api/admin/especialidades/" + e.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    })
    await recargar()
  }

  async function eliminar(e: Especialidad) {
    if (!confirm("Eliminar " + e.name + "?")) return
    const r = await fetch("/api/admin/especialidades/" + e.id, { method: "DELETE" })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      setMsg(j.error || "No se puede eliminar")
      return
    }
    setMsg("")
    await recargar()
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-light mb-1">Especialidades</h1>
        <p className="text-sm text-gray-500 mb-8">
          Crea y administra las especialidades de tu institucion.
        </p>

        {msg && (
          <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {msg}
          </div>
        )}
        {ok && (
          <div className="mb-4 text-sm text-green-700 border border-green-200 bg-green-50 px-3 py-2">
            {ok}
          </div>
        )}

        <div className="border border-gray-200 p-4 mb-10 bg-gray-50">
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">
            Nueva especialidad
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cardiologia"
                className="border border-gray-300 px-3 py-2 text-sm w-48 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
                className="border border-gray-300 px-3 py-2 text-sm w-56 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="border border-gray-300 h-10 w-16 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Orden</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="border border-gray-300 px-3 py-2 text-sm w-20 bg-white"
              />
            </div>
            <button
              onClick={() => start(crear)}
              disabled={pending}
              className="bg-black text-white text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-gray-800 disabled:opacity-50"
            >
              Crear
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs tracking-widest uppercase text-gray-500">
              <th className="py-3 pr-4">Orden</th>
              <th className="py-3 pr-4">Nombre</th>
              <th className="py-3 pr-4">Descripcion</th>
              <th className="py-3 pr-4">Color</th>
              <th className="py-3 pr-4">Activa</th>
              <th className="py-3 pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especialidades.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                  No hay especialidades todavia.
                </td>
              </tr>
            ) : (
              especialidades.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      defaultValue={e.order}
                      onBlur={(ev) => {
                        const v = Number(ev.target.value)
                        if (v !== e.order) actualizar(e, { order: v })
                      }}
                      className="border border-gray-200 px-2 py-1 text-sm w-16"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      defaultValue={e.name}
                      onBlur={(ev) => {
                        const v = ev.target.value.trim()
                        if (v && v !== e.name) actualizar(e, { name: v })
                      }}
                      className="border border-gray-200 px-2 py-1 text-sm w-40"
                    />
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{e.description || "-"}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="color"
                      value={e.color || "#000000"}
                      onChange={(ev) => actualizar(e, { color: ev.target.value })}
                      className="border border-gray-300 h-8 w-12"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => actualizar(e, { active: !e.active })}
                      className={"text-xs px-3 py-1 border " + (e.active ? "border-green-300 text-green-700 bg-green-50" : "border-gray-300 text-gray-400")}
                    >
                      {e.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => eliminar(e)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}