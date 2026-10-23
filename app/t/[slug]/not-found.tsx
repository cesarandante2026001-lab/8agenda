import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4">
          No encontrado
        </p>
        <h1 className="text-3xl font-light mb-4">
          Esta negocio <span className="font-semibold">no existe</span>
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Verifica la direccion o contacta a soporte.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-8 py-4 text-xs tracking-widest uppercase hover:bg-gray-800 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}