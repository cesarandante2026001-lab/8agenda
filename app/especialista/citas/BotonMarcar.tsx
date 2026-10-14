"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function BotonMarcar({
  id,
  estado,
}: {
  id: string
  estado: string
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState<string | null>(null)

  async function marcar(accion: "ATENDIDA" | "NO_SHOW") {
    setCargando(accion)
    try {
      const r = await fetch(`/api/especialista/citas/${id}/marcar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      })
      if (!r.ok) {
        const d = await r.json()
        alert(d.error || "Error")
      } else {
        router.refresh()
      }
    } catch {
      alert("Error de conexion")
    } finally {
      setCargando(null)
    }
  }

  if (estado === "ATENDIDA" || estado === "NO_SHOW" || estado === "CANCELADA") {
    return null
  }

  return (
    <span className="inline-flex gap-3 items-center">
      <button
        onClick={() => marcar("ATENDIDA")}
        disabled={cargando !== null}
        className="text-xs uppercase tracking-wider text-green-700 hover:text-green-900 disabled:opacity-50"
      >
        {cargando === "ATENDIDA" ? "..." : "Atendida"}
      </button>
      <button
        onClick={() => marcar("NO_SHOW")}
        disabled={cargando !== null}
        className="text-xs uppercase tracking-wider text-orange-700 hover:text-orange-900 disabled:opacity-50"
      >
        {cargando === "NO_SHOW" ? "..." : "No-show"}
      </button>
    </span>
  )
}