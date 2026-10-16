"use client"

import { useState } from "react"

export default function BotonEnviar({ atencionId, email }: { atencionId: string; email: string }) {
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  async function enviar() {
    setCargando(true)
    setMsg("")
    setError("")

    const r = await fetch(`/api/admin/atenciones/${atencionId}/enviar`, { method: "POST" })
    const data = await r.json()
    setCargando(false)

    if (!r.ok) {
      setError(data.error || "Error al enviar")
      return
    }

    setMsg(`Enviado a ${data.to}`)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={enviar}
        disabled={cargando}
        className="bg-black text-white px-5 py-3 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50"
      >
        {cargando ? "Enviando..." : "Enviar por email"}
      </button>
      {msg && <span className="text-xs text-green-700">{msg}</span>}
      {error && <span className="text-xs text-red-700">{error}</span>}
      <span className="text-xs text-gray-500">{email}</span>
    </div>
  )
}