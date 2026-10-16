"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Suspense } from "react"

function LoginForm() {
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Si viene callbackUrl, usarlo. Si no, dejar que el redirect del server decida.
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || undefined,
    })

    if (res?.error) {
      setError("Email o contrasena incorrectos")
      setLoading(false)
      return
    }

    // Redirigir con window.location (no router.push) para forzar recarga completa
    // y que la cookie de sesion este disponible en el proximo render
    const destino = callbackUrl || res?.url || "/ir"
    window.location.href = destino
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/?from=publico"
            className="text-xs tracking-widest uppercase text-gray-500 hover:text-black"
          >
            Volver al inicio
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-tight mb-2">Ingresar</h1>
          <p className="text-sm text-gray-500">Accede a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-black outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          No tienes cuenta?{" "}
          <Link href="/register" className="text-black font-medium hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}