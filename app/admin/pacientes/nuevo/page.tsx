"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NuevoPacientePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [rut, setRut] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setGuardando(true)

    const r = await fetch("/api/admin/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        rut: rut || undefined,
        email: email || undefined,
        phone: phone || undefined,
      }),
    })
    const data = await r.json()
    setGuardando(false)

    if (!r.ok) {
      setError(data.error || "Error al crear")
      return
    }

    router.push(`/admin/pacientes/${data.paciente.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/admin/pacientes" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black">
          Volver a pacientes
        </Link>
      </div>

      <h1 className="text-3xl font-light mb-2">Nuevo paciente</h1>
      <p className="text-sm text-gray-500 mb-8">
        Crea la ficha. Despues podes completar los datos medicos.
      </p>

      <form onSubmit={guardar} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">RUT</label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Telefono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
          />
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>}

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {guardando ? "Creando..." : "Crear paciente"}
        </button>
      </form>
    </div>
  )
}