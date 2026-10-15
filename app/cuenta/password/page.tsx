"use client"

import { useState } from "react"
import Link from "next/link"

export default function CambiarPasswordPage() {
  const [passwordActual, setPasswordActual] = useState("")
  const [passwordNueva, setPasswordNueva] = useState("")
  const [passwordRepetir, setPasswordRepetir] = useState("")
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  async function cambiar(e: React.FormEvent) {
    e.preventDefault()
    setMsg("")
    setError("")

    if (passwordNueva !== passwordRepetir) {
      setError("Las contrasenas nuevas no coinciden")
      return
    }
    if (passwordNueva.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres")
      return
    }

    setCargando(true)
    const r = await fetch("/api/cuenta/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordActual, passwordNueva }),
    })
    const data = await r.json()
    setCargando(false)

    if (!r.ok) {
      setError(data.error || "Error al cambiar")
      return
    }

    setMsg("Contrasena actualizada")
    setPasswordActual("")
    setPasswordNueva("")
    setPasswordRepetir("")
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black">
            Volver al inicio
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-tight mb-2">Cambiar contrasena</h1>
          <p className="text-sm text-gray-500">Actualiza tu contrasena de acceso</p>
        </div>

        <form onSubmit={cambiar} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Contrasena actual
            </label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Contrasena nueva
            </label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Repetir contrasena nueva
            </label>
            <input
              type="password"
              value={passwordRepetir}
              onChange={(e) => setPasswordRepetir(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {msg && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-md">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {cargando ? "Cambiando..." : "Cambiar contrasena"}
          </button>
        </form>
      </div>
    </main>
  )
}