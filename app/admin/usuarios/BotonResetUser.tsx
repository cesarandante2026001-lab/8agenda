"use client"

import { useState } from "react"

export default function BotonResetUser({ userId, email }: { userId: string; email: string }) {
  const [cargando, setCargando] = useState(false)
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null)

  async function resetear() {
    if (!confirm(`Resetear contrasena de ${email}?`)) return
    setCargando(true)
    const r = await fetch(`/api/admin/usuarios/${userId}/reset-password`, { method: "POST" })
    const data = await r.json()
    setCargando(false)
    if (!r.ok) {
      alert(data.error || "Error")
      return
    }
    setCredenciales(data.credenciales)
  }

  if (credenciales) {
    return (
      <span className="inline-flex items-center gap-2">
        <code className="text-[11px] bg-yellow-100 px-2 py-1 border border-yellow-300">
          {credenciales.password}
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(credenciales.password)
            setCredenciales(null)
          }}
          className="text-xs text-gray-500 hover:text-black"
        >
          copiar
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={resetear}
      disabled={cargando}
      className="text-xs uppercase tracking-wider text-orange-600 hover:underline disabled:opacity-50"
    >
      {cargando ? "..." : "Resetear"}
    </button>
  )
}