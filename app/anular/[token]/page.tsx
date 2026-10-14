"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

type Reserva = {
  id: string
  patientName: string
  patientEmail: string
  especialista: string
  especialidad: string
  fecha: string
  hora: string
  status: string
}

export default function AnularPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    fetch(`/api/publico/anular/${token}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          setError(data.error || "No se pudo cargar la reserva")
        } else {
          setReserva(data.appointment)
        }
      })
      .catch(() => setError("Error de conexion"))
      .finally(() => setCargando(false))
  }, [token])

  async function confirmarAnulacion() {
    setAnulando(true)
    try {
      const r = await fetch(`/api/publico/anular/${token}`, { method: "POST" })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || "No se pudo anular")
        setAnulando(false)
        return
      }
      router.push(`/anular/${token}/confirmado`)
    } catch {
      setError("Error de conexion")
      setAnulando(false)
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando...</p>
      </main>
    )
  }

  if (error || !reserva) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-3">No se puede anular</h1>
          <p className="text-gray-600 mb-8">{error || "Reserva no encontrada"}</p>
          <Link
            href="/reservar"
            className="inline-block bg-black text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-gray-800 transition"
          >
            Reservar otra hora
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <p className="text-xs tracking-[0.3em] text-gray-500 mb-3 uppercase text-center">
          Anular reserva
        </p>
        <h1 className="text-3xl font-light text-center mb-8">
          Confirmar <span className="font-semibold">anulacion</span>
        </h1>

        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
            Datos de la reserva
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Paciente:</span> {reserva.patientName}</p>
            <p><span className="text-gray-500">Especialidad:</span> {reserva.especialidad}</p>
            <p><span className="text-gray-500">Especialista:</span> {reserva.especialista}</p>
            <p><span className="text-gray-500">Fecha:</span> {reserva.fecha}</p>
            <p><span className="text-gray-500">Hora:</span> {reserva.hora}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6 text-center">
          Si confirmas, la reserva se anulara y el horario quedara libre.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={confirmarAnulacion}
            disabled={anulando}
            className="w-full bg-red-600 text-white px-6 py-4 text-xs tracking-widest uppercase font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {anulando ? "Anulando..." : "Confirmar anulacion"}
          </button>
          <Link
            href="/reservar"
            className="w-full text-center border border-gray-300 px-6 py-4 text-xs tracking-widest uppercase hover:border-black transition"
          >
            Volver sin anular
          </Link>
        </div>
      </div>
    </main>
  )
}