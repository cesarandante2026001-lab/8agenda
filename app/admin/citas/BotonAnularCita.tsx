"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function BotonAnularCita({ id }: { id: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function anular() {
    setCargando(true)
    try {
      const r = await fetch(`/api/admin/citas/${id}/anular`, { method: "POST" })
      const data = await r.json()
      if (!r.ok) {
        alert(data.error || "No se pudo anular")
      } else {
        router.refresh()
      }
    } catch {
      alert("Error de conexion")
    } finally {
      setCargando(false)
      setConfirmando(false)
    }
  }

  if (confirmando) {
    return (
      <span className="inline-flex gap-2 items-center">
        <button
          onClick={anular}
          disabled={cargando}
          className="text-xs uppercase tracking-wider text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {cargando ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          disabled={cargando}
          className="text-xs uppercase tracking-wider text-gray-500 hover:text-black"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-xs uppercase tracking-wider text-gray-600 hover:text-red-600 transition"
    >
      Anular
    </button>
  )
}