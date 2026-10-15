"use client"
import Link from "next/link"

import { useState, useTransition } from "react"

type Especialista = {
  id: string
  name: string
  rut: string | null
  email: string | null
  phone: string | null
  specialtyId: string
  specialtyName: string
  duracionConsulta: number
  anticipacionMinima: number
  anticipacionMaxima: number
  active: boolean
  userId: string | null
}

type Especialidad = {
  id: string
  name: string
}

export default function EspecialistasClient({
  initial,
  especialidades,
}: {
  initial: Especialista[]
  especialidades: Especialidad[]
}) {
  const [especialistas, setEspecialistas] = useState<Especialista[]>(initial)
  const [name, setName] = useState("")
  const [rut, setRut] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [specialtyId, setSpecialtyId] = useState(especialidades[0]?.id || "")
  const [duracionConsulta, setDuracionConsulta] = useState(20)
  const [msg, setMsg] = useState("")
  const [ok, setOk] = useState("")
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null)
  const [pending, start] = useTransition()

  async function resetear(e: Especialista) {
    if (!confirm(`Resetear contrasena de ${e.name}?`)) return
    const r = await fetch(`/api/admin/usuarios/${e.userId}/reset-password`, { method: "POST" })
    const data = await r.json()
    if (!r.ok) {
      setMsg(data.error || "No se pudo resetear")
      return
    }
    setCredenciales(data.credenciales)
    setOk("Contrasena reseteada. Entregar ahora.")
  }

  async function recargar() {
    const r = await fetch("/api/admin/especialistas", { cache: "no-store" })
    const data = await r.json()
    setEspecialistas(data.especialistas || [])
  }

  async function crear() {
    if (!name.trim() || !specialtyId) return
    setMsg("")
    setOk("")
    const r = await fetch("/api/admin/especialistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        rut: rut.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        specialtyId,
        duracionConsulta,
      }),
    })
    if (r.ok) {
      const data = await r.json()
      setName("")
      setRut("")
      setEmail("")
      setPhone("")
      setOk("Especialista creado")
      if (data.credenciales) {
        setCredenciales(data.credenciales)
      }
      await recargar()
    } else {
      const data = await r.json().catch(() => ({}))
      setMsg(data.error || "Error al crear")
    }
  }

  async function actualizar(e: Especialista, campos: Partial<Especialista>) {
    await fetch("/api/admin/especialistas/" + e.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    })
    await recargar()
  }

  async function eliminar(e: Especialista) {
    if (!confirm("Eliminar " + e.name + "?")) return
    const r = await fetch("/api/admin/especialistas/" + e.id, { method: "DELETE" })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      setMsg(j.error || "No se puede eliminar")
      return
    }
    if (j.softDeleted) {
      setOk(j.message)
    } else {
      setOk("Especialista eliminado")
    }
    setMsg("")
    await recargar()
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-light mb-1">Especialistas</h1>
        <p className="text-sm text-gray-500 mb-8">
          Crea y administra los profesionales de tu institucion.
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

        {credenciales && (
          <div className="mb-6 border-2 border-black bg-yellow-50 p-5">
            <p className="text-xs tracking-widest uppercase text-gray-700 mb-3">
              Credenciales del nuevo doctor (entregar ahora, no se vuelven a mostrar)
            </p>
            <div className="space-y-2 font-mono text-sm">
              <p><span className="text-gray-500">Email:</span> <strong>{credenciales.email}</strong></p>
              <p><span className="text-gray-500">Contrasena:</span> <strong>{credenciales.password}</strong></p>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${credenciales.email}\nContrasena: ${credenciales.password}`)
                }}
                className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition"
              >
                Copiar credenciales
              </button>
              <button
                onClick={() => setCredenciales(null)}
                className="text-xs uppercase tracking-widest text-gray-500 hover:text-black"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {especialidades.length === 0 ? (
          <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-6 mb-8 text-sm text-yellow-800">
            Primero tienes que crear al menos una especialidad en /admin/especialidades
          </div>
        ) : (
          <div className="border border-gray-200 p-4 mb-10 bg-gray-50">
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">
              Nuevo especialista
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Juan Perez"
                  className="border border-gray-300 px-3 py-2 text-sm w-full bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">RUT</label>
                <input
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                  className="border border-gray-300 px-3 py-2 text-sm w-full bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@clinica.cl"
                  className="border border-gray-300 px-3 py-2 text-sm w-full bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefono</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="border border-gray-300 px-3 py-2 text-sm w-full bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Especialidad</label>
                <select
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value)}
                  className="border border-gray-300 px-3 py-2 text-sm w-full bg-white"
                >
                  {especialidades.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duracion consulta (min)</label>
                <input
                  type="number"
                  value={duracionConsulta}
                  onChange={(e) => setDuracionConsulta(Number(e.target.value))}
                  className="border border-gray-300 px-3 py-2 text-sm w-full bg-white"
                />
              </div>
            </div>
            <button
              onClick={() => start(crear)}
              disabled={pending}
              className="mt-4 bg-black text-white text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-gray-800 disabled:opacity-50"
            >
              Crear especialista
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs tracking-widest uppercase text-gray-500">
              <th className="py-3 pr-4">Nombre</th>
              <th className="py-3 pr-4">RUT</th>
              <th className="py-3 pr-4">Especialidad</th>
              <th className="py-3 pr-4">Duracion</th>
              <th className="py-3 pr-4">Activo</th>
              <th className="py-3 pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especialistas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                  No hay especialistas todavia.
                </td>
              </tr>
            ) : (
              especialistas.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">{e.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{e.rut || "-"}</td>
                  <td className="py-3 pr-4">{e.specialtyName}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      defaultValue={e.duracionConsulta}
                      onBlur={(ev) => {
                        const v = Number(ev.target.value)
                        if (v !== e.duracionConsulta) actualizar(e, { duracionConsulta: v })
                      }}
                      className="border border-gray-200 px-2 py-1 text-sm w-16"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => actualizar(e, { active: !e.active })}
                      className={"text-xs px-3 py-1 border " + (e.active ? "border-green-300 text-green-700 bg-green-50" : "border-gray-300 text-gray-400")}
                    >
                      {e.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="py-3 pr-4 space-x-3">
                    <Link
                      href={"/admin/especialistas/" + e.id + "/dias"}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Horarios
                    </Link>
                    {e.userId && (
                      <button
                        onClick={() => resetear(e)}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        Resetear clave
                      </button>
                    )}
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