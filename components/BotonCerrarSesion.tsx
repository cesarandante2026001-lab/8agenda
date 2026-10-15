"use client"

import { signOut } from "next-auth/react"
import { useState } from "react"

export function BotonCerrarSesion({ className }: { className?: string }) {
  const [saliendo, setSaliendo] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        setSaliendo(true)
        await signOut({ callbackUrl: "/login" })
      }}
      disabled={saliendo}
      className={className || "text-xs uppercase tracking-widest text-gray-500 hover:text-black disabled:opacity-50"}
    >
      {saliendo ? "Cerrando..." : "Cerrar sesion"}
    </button>
  )
}